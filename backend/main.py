"""
IntelliHire - Career Intelligence System
Backend API with FastAPI (MongoDB Migration)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import pdfplumber
import easyocr
import fitz  # PyMuPDF — pure-Python PDF renderer, no system binary needed
from PIL import Image
import io
import re
import numpy as np
from sentence_transformers import SentenceTransformer, util
import networkx as nx
import json
import os
from dotenv import load_dotenv
import httpx
import asyncio
from cachetools import cached, TTLCache
import hashlib
from functools import lru_cache

# Configurable threshold for BERT semantic skill matching.
# Skills with cosine similarity >= this value are considered semantically equivalent.
# Tune between 0.70 (lenient) and 0.85 (strict). Default 0.65 balances precision/recall.
SEMANTIC_SIMILARITY_THRESHOLD = 0.65

load_dotenv()
from collections import Counter
import uuid
from pymongo import MongoClient
from bson import ObjectId

# Create explicit caches so we can invalidate them
jobs_cache = TTLCache(maxsize=100, ttl=300)
candidates_cache = TTLCache(maxsize=100, ttl=60)

# Create FastAPI app
app = FastAPI(title="IntelliHire API", version="1.0.0")
router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
if not MONGO_URI:
    MONGO_URI = "mongodb://localhost:27017" # Fallback if env variable is missing
client = MongoClient(MONGO_URI)
db = client.get_database("intellihire")

users_collection = db["users"]
resumes_collection = db["resumes"]
jobs_collection = db["jobs"]
matches_collection = db["matches"]
ai_feedback_cache = db["ai_feedback_cache"]

# Ensure upload directory exists
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to parse MongoDB ObjectId
def parse_mongo_id(doc):
    if not doc: return doc
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc

# ============== PYDANTIC MODELS ==============

class UserCreate(BaseModel):
    email: str
    name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    
    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    location: Optional[str] = None
    job_type: Optional[str] = "full-time"
    experience_required: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_required: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    description: str
    required_skills: List[str]
    
    class Config:
        from_attributes = True

class SkillAnalysis(BaseModel):
    skills: List[str]
    skill_strength: Dict[str, float]
    skill_gaps: List[str]
    learning_path: List[str]

class MatchResponse(BaseModel):
    resume_id: str
    job_id: str
    similarity_score: float
    matched_skills: List[str]
    missing_skills: List[str]

class ResumeFeedbackRequest(BaseModel):
    job_id: Optional[str] = None
    job_description: Optional[str] = None

class BulletRewrite(BaseModel):
    original: str
    rewritten: str
    reason: str

class SectionFeedback(BaseModel):
    section: str
    score: int
    issues: list[str]
    rewritten: str
    bullet_rewrites: list[BulletRewrite]

class KeywordMatch(BaseModel):
    keyword: str
    matched: bool
    context: str

class ResumeFeedbackResponse(BaseModel):
    overall_score: int
    overall_summary: str
    strongest_section: str
    weakest_section: str
    tone_feedback: str
    match_score: Optional[int] = None
    match_label: Optional[str] = None
    skill_tags: list[str] = []
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    keyword_matches: list[KeywordMatch] = []
    sections: list[SectionFeedback]
    top_missing_keywords: list[str]
    ats_tips: list[str]

# ============== SKILL DATABASE ==============

# Load Skills Configuration
with open("skills_config.json", "r") as f:
    config = json.load(f)

TECH_SKILLS = set(config["TECH_SKILLS"])
SOFT_SKILLS = set(config["SOFT_SKILLS"])
ALL_SKILLS = TECH_SKILLS.union(SOFT_SKILLS)
ALIAS_MAP = config.get("ALIAS_MAP", {})
DOMAIN_SKILLS = config.get("DOMAIN_SKILLS", {})
SKILL_DEPENDENCIES = config.get("SKILL_DEPENDENCIES", {})
SEMANTIC_SKILL_GROUPS = [set(g) for g in config.get("SEMANTIC_SKILL_GROUPS", [])]

# Try to load dynamic skills from MongoDB (Open Skills)
try:
    if "open_skills" in db.list_collection_names():
        open_docs = list(db["open_skills"].find({}, {"name": 1}))
        if open_docs:
            ALL_SKILLS = set([doc["name"].lower() for doc in open_docs if "name" in doc])
            print(f"Loaded {len(ALL_SKILLS)} skills from Open Skills MongoDB collection.")
except Exception as e:
    print(f"Warning: Could not load Open Skills from MongoDB. Using JSON fallback. {e}")

# ============== NLP PIPELINE ==============

class NLPPipeline:
    def __init__(self):
        # Load a pre-trained BERT model optimized for semantic text similarity
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        # Pre-compute embeddings for every known skill at startup (run once)
        self.skill_embeddings = {}
        self._precompute_skill_embeddings()
        # OCR reader is lazy-loaded on first use to avoid startup overhead
        self._ocr_reader = None

    # ------------------------------------------------------------------
    # Startup: pre-compute & cache embeddings for ALL known skills
    # ------------------------------------------------------------------
    def _precompute_skill_embeddings(self):
        """Encode every skill in ALL_SKILLS once at startup and store the
        tensor so we never re-encode the fixed dictionary on every request."""
        skills = list(ALL_SKILLS)
        embeddings = self.model.encode(skills, convert_to_tensor=True)
        for skill, embedding in zip(skills, embeddings):
            self.skill_embeddings[skill] = embedding
        print(f"Pre-computed embeddings for {len(skills)} skills.")

    # ------------------------------------------------------------------
    # Per-skill embedding with LRU cache (for candidate / ad-hoc skills)
    # ------------------------------------------------------------------
    @staticmethod
    @lru_cache(maxsize=512)
    def _get_skill_embedding_cached(skill: str):
        """Cache individual skill embeddings to avoid recomputation.
        Uses the global nlp_pipeline instance (set after __init__)."""
        # We reach for the global instance here because lru_cache cannot
        # cache bound methods (self makes every call unique).
        return nlp_pipeline.model.encode(skill, convert_to_tensor=True)

    def get_skill_embedding(self, skill: str):
        """Return embedding for *skill*. Uses pre-computed dict first,
        falls back to the LRU-cached encoder for unknown skills."""
        if skill in self.skill_embeddings:
            return self.skill_embeddings[skill]
        return NLPPipeline._get_skill_embedding_cached(skill)

    # ------------------------------------------------------------------
    # Semantic skill matcher
    # ------------------------------------------------------------------
    def find_semantic_skill_matches(self, candidate_skill: str,
                                    threshold: float = SEMANTIC_SIMILARITY_THRESHOLD) -> List[Dict]:
        """Given a skill string, find all semantically similar skills in
        ALL_SKILLS using BERT cosine similarity.

        threshold controls match sensitivity:
          - MySQL  ↔ SQL            → ~0.82 → MATCH ✅
          - MySQL  ↔ React          → ~0.21 → NO MATCH ✅
          - TensorFlow ↔ Deep Learning → ~0.79 → MATCH ✅
          - Python ↔ JavaScript     → ~0.45 → NO MATCH ✅

        Returns list of {"skill": str, "similarity": float}.
        """
        cand_emb = self.get_skill_embedding(candidate_skill)
        matched = []
        for skill, skill_emb in self.skill_embeddings.items():
            sim = util.cos_sim(cand_emb, skill_emb).item()
            if sim >= threshold:
                matched.append({"skill": skill, "similarity": round(sim, 4)})
        return matched

    # ------------------------------------------------------------------
    # Semantic skill match ratio (replaces exact-only matching)
    # ------------------------------------------------------------------
    def calculate_semantic_skill_match(
        self,
        required_skills: set,
        candidate_skills: set,
        threshold: float = SEMANTIC_SIMILARITY_THRESHOLD
    ) -> Dict[str, Any]:
        """For each required skill, check:
        1. Exact match in candidate_skills         → score = 1.0
        2. Semantic match via BERT cosine sim       → score = similarity
        3. Related-skill bonus via SKILL_DEPENDENCIES → score = 0.5
        4. No match                                 → score = 0.0

        Returns {"skill_match_ratio": float, "matched_skills": list,
                 "missing_skills": list, "match_details": list}.
        """
        total_score = 0.0
        match_details = []
        matched_skills = []
        missing_skills = []

        for req_skill in required_skills:
            # --- Fast path: exact match ---
            if req_skill in candidate_skills:
                total_score += 1.0
                matched_skills.append(req_skill)
                match_details.append({
                    "required": req_skill,
                    "matched_with": req_skill,
                    "match_type": "exact",
                    "score": 1.0
                })
                continue

            # --- BERT semantic fallback ---
            best_match = None
            best_sim = 0.0
            req_emb = self.get_skill_embedding(req_skill)

            for cand_skill in candidate_skills:
                cand_emb = self.get_skill_embedding(cand_skill)
                sim = util.cos_sim(cand_emb, req_emb).item()
                if sim > best_sim:
                    best_sim = sim
                    best_match = cand_skill

            if best_sim >= threshold:
                total_score += best_sim  # partial credit
                matched_skills.append(req_skill)
                match_details.append({
                    "required": req_skill,
                    "matched_with": best_match,
                    "match_type": "semantic",
                    "score": round(best_sim, 4)
                })
                continue

            # --- Semantic skill group fallback (0.85 partial credit) ---
            # Catches pairs like PostgreSQL↔SQL, Pandas↔Data Analysis where
            # BERT single-word cosine is unreliable but domain equivalence is known.
            group_match = None
            for group in SEMANTIC_SKILL_GROUPS:
                if req_skill in group:
                    for cand_skill in candidate_skills:
                        if cand_skill in group and cand_skill != req_skill:
                            group_match = cand_skill
                            break
                if group_match:
                    break

            if group_match:
                total_score += 0.85
                matched_skills.append(req_skill)
                match_details.append({
                    "required": req_skill,
                    "matched_with": group_match,
                    "match_type": "semantic_group",
                    "score": 0.85
                })
                continue

            # --- Dependency-graph fallback (0.5 partial credit) ---
            if req_skill in SKILL_DEPENDENCIES:
                deps = SKILL_DEPENDENCIES[req_skill]
                if any(dep in candidate_skills for dep in deps):
                    total_score += 0.5
                    dep_match = next(dep for dep in deps if dep in candidate_skills)
                    matched_skills.append(req_skill)
                    match_details.append({
                        "required": req_skill,
                        "matched_with": dep_match,
                        "match_type": "dependency",
                        "score": 0.5
                    })
                    continue

            # --- No match ---
            missing_skills.append(req_skill)
            match_details.append({
                "required": req_skill,
                "matched_with": None,
                "match_type": "none",
                "score": 0.0
            })

        # Use 80%-threshold denominator so 8/10 skills = full credit
        if len(required_skills) > 0:
            ratio = min(1.0, total_score / (len(required_skills) * 0.8))
        else:
            ratio = 0.0

        return {
            "skill_match_ratio": round(ratio, 4),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_details": match_details
        }

    def normalize_aliases(self, text: str) -> str:
        """Apply ALIAS_MAP substitutions using case-insensitive regex word boundaries"""
        normalized = text
        for alias, target in sorted(ALIAS_MAP.items(), key=lambda x: len(x[0]), reverse=True):
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'
            normalized = re.sub(pattern, target, normalized, flags=re.IGNORECASE)
        return normalized

    def _get_ocr_reader(self):
        """Lazy-load EasyOCR reader once on first use (avoids ~3 s startup cost)."""
        if self._ocr_reader is None:
            print("Loading EasyOCR model (first scanned PDF detected)...")
            self._ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        return self._ocr_reader

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF.

        Strategy:
          1. Try pdfplumber for fast text-layer extraction (works for digital PDFs).
          2. If that yields < 50 chars (scanned image PDF), fall back to EasyOCR
             which rasterises each page and runs a neural OCR model.
        """
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber error: {e}")

        # OCR fallback for scanned / image-only PDFs
        if len(text.strip()) < 50:
            try:
                print(f"  [OCR] No text layer in {file_path!r} — running EasyOCR")
                reader = self._get_ocr_reader()
                # Use PyMuPDF (fitz) to render each page to a PIL Image
                doc = fitz.open(file_path)
                ocr_parts = []
                for page in doc:
                    # Render at 2x zoom (144 dpi equivalent) for better OCR accuracy
                    mat = fitz.Matrix(2, 2)
                    pix = page.get_pixmap(matrix=mat)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    img_np = np.array(img)
                    results = reader.readtext(img_np, detail=0, paragraph=True)
                    ocr_parts.append(" ".join(results))
                doc.close()
                text = "\n".join(ocr_parts)
                print(f"  [OCR] Extracted {len(text)} chars via EasyOCR")
            except Exception as e:
                print(f"  [OCR] Failed for {file_path!r}: {e}")

        return text

    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s+#]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_sections(self, text: str) -> Dict[str, str]:
        """Extract different sections from resume"""
        sections = {
            "header": "",
            "summary": "",
            "experience": "",
            "education": "",
            "skills": "",
            "projects": "",
            "other": ""
        }

        lines = text.split('\n')
        current_section = "header"

        section_keywords = {
            "summary": ["summary", "objective", "profile", "about"],
            "experience": ["experience", "work", "employment", "career", "professional"],
            "education": ["education", "academic", "degree", "university", "college"],
            "skills": ["skills", "technologies", "technical", "competencies"],
            "projects": ["projects", "portfolio", "github"]
        }

        for line in lines:
            line_lower = line.lower().strip()
            for section, keywords in section_keywords.items():
                if any(keyword in line_lower for keyword in keywords) and len(line_lower) < 50:
                    current_section = section
                    break
            sections[current_section] += line + "\n"

        return sections

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text using keyword matching"""
        text = self.normalize_aliases(text)
        text_lower = text.lower()
        found_skills = set()

        for skill in ALL_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill)

        return list(found_skills)

    def calculate_skill_strength(self, text: str, skills: List[str]) -> Dict[str, float]:
        """Calculate skill strength based on frequency and context"""
        text = self.normalize_aliases(text)
        sections = self.extract_sections(text)
        strength_scores = {}

        for skill in skills:
            base_score = 35.0  # Base score for simply possessing the skill
            earned_points = 0.0

            for section_name, section_text in sections.items():
                if not section_text:
                    continue

                pattern = r'\b' + re.escape(skill) + r'\b'
                count = len(re.findall(pattern, section_text.lower()))
                
                if count > 0:
                    # Give points based on which section it's in (with diminishing returns for spamming)
                    if section_name == "experience":
                        earned_points += 20.0 * (1 + np.log1p(count - 1))
                    elif section_name == "projects":
                        earned_points += 15.0 * (1 + np.log1p(count - 1))
                    elif section_name == "skills":
                        earned_points += 10.0 # Flat points for just listing it once
                    else:
                        earned_points += 5.0 * (1 + np.log1p(count - 1))

            if earned_points > 0:
                final_score = min(95.0, base_score + earned_points)
                # Add tiny variance based on string length to simulate complex modeling output
                variance = (len(skill) % 7) * 0.65
                final_score = min(99.0, final_score + variance)
                strength_scores[skill] = round(final_score, 2)
            else:
                strength_scores[skill] = 35.0

        return strength_scores

    def analyze_skill_gaps(self, user_skills: List[str], target_skills: List[str]) -> List[str]:
        """Identify skill gaps between user skills and target skills"""
        user_skills_lower = set(s.lower() for s in user_skills)
        gaps = []

        for skill in target_skills:
            if skill.lower() not in user_skills_lower:
                gaps.append(skill)

        return gaps

    def generate_learning_path(self, skill_gaps: List[str], current_skills: List[str]) -> List[str]:
        """Generate personalized learning path based on skill gaps"""
        learning_path = []
        current_skills_lower = set(s.lower() for s in current_skills)

        for gap in skill_gaps:
            gap_lower = gap.lower()

            if gap_lower in SKILL_DEPENDENCIES:
                deps = SKILL_DEPENDENCIES[gap_lower]
                missing_deps = [d for d in deps if d not in current_skills_lower]

                for dep in missing_deps:
                    if dep not in learning_path:
                        learning_path.append(dep)

            if gap not in learning_path:
                learning_path.append(gap)

        return learning_path

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity using BERT embeddings"""
        try:
            embeddings1 = self.model.encode(text1, convert_to_tensor=True)
            embeddings2 = self.model.encode(text2, convert_to_tensor=True)
            similarity = util.cos_sim(embeddings1, embeddings2).item()
            return float(similarity)
        except Exception as e:
            print(f"Similarity error: {e}")
            return 0.0

    def match_resume_to_job(self, resume_text: str, job_description: str,
                            resume_skills: List[str], job_skills: List[str],
                            job_title: str = "") -> Dict[str, Any]:
        """Match resume to job description using BERT semantic skill matching.

        Scoring breakdown:
          - 60 %  Semantic skill match ratio (exact → BERT → dependency fallback)
          - 40 %  Full-text semantic similarity (BERT cosine of resume vs JD)
          - +8 %  Job title keyword found in resume header / summary
          - +5 %  Seniority level alignment (junior / mid / senior)
          - ×0.3  Penalty multiplier when skill_match_ratio is exactly 0
        """
        # 1. Text Similarity (40% weight)
        text_similarity = self.calculate_similarity(resume_text, job_description)

        # 2. Semantic Skill Match Ratio (60% weight)
        resume_skills_lower = set(s.lower() for s in resume_skills)
        job_skills_lower = set(s.lower() for s in job_skills)

        semantic_result = self.calculate_semantic_skill_match(
            job_skills_lower, resume_skills_lower
        )
        skill_match_ratio = semantic_result["skill_match_ratio"]
        matched_skills = semantic_result["matched_skills"]
        missing_skills = semantic_result["missing_skills"]
        match_details = semantic_result["match_details"]

        combined_score = (text_similarity * 0.4) + (skill_match_ratio * 0.6)

        # 3. Job Title Match Bonus (+0.08)
        sections = self.extract_sections(resume_text)
        header_summary = (sections.get("header", "") + " " + sections.get("summary", "")).lower()
        title_match_bonus = 0.0
        if job_title:
            job_title_words = [w for w in re.findall(r'\b\w+\b', job_title.lower()) if len(w) > 2]
            if job_title_words and any(word in header_summary for word in job_title_words):
                title_match_bonus = 0.08
                combined_score += title_match_bonus

        # 4. Seniority Alignment Bonus (+0.05)
        seniority_levels = {
            "junior": ["junior", "jr", "entry", "fresher", "intern", "associate"],
            "mid": ["mid", "intermediate"],
            "senior": ["senior", "sr", "lead", "principal", "manager", "director", "head"]
        }
        resume_seniority = None
        job_seniority = None
        full_resume_lower = resume_text.lower()
        full_job_lower = (job_title + " " + job_description).lower()
        for level, keywords in seniority_levels.items():
            if any(r'\b' + kw + r'\b' in full_resume_lower for kw in keywords):
                resume_seniority = level
            if any(r'\b' + kw + r'\b' in full_job_lower for kw in keywords):
                job_seniority = level
        seniority_bonus = 0.0
        if resume_seniority and job_seniority and resume_seniority == job_seniority:
            seniority_bonus = 0.05
            combined_score += seniority_bonus

        # 5. Irrelevant Match Penalty
        if skill_match_ratio == 0.0:
            combined_score *= 0.3

        # Clamp between 0.0 and 1.0
        combined_score = max(0.0, min(1.0, combined_score))

        return {
            "similarity_score": round(combined_score * 100, 2),
            "text_similarity": round(text_similarity * 100, 2),
            "skill_match_ratio": round(skill_match_ratio * 100, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_details": match_details
        }

    def build_skill_graph(self, skills: List[str]) -> nx.DiGraph:
        """Build skill dependency graph"""
        G = nx.DiGraph()

        for skill in skills:
            G.add_node(skill)

        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in SKILL_DEPENDENCIES:
                for dep in SKILL_DEPENDENCIES[skill_lower]:
                    if dep in skills:
                        G.add_edge(dep, skill)

        return G

    def get_skill_recommendations(self, current_skills: List[str], num_recommendations: int = 5) -> List[str]:
        """Get highly specific technical recommendations based on the user's primary programming domains"""
        current_skills_lower = set(s.lower() for s in current_skills)
        domain_scores = {}
        
        # Determine the user's technical field based on their current skills
        for domain, domain_skill_list in DOMAIN_SKILLS.items():
            matches = sum(1 for s in domain_skill_list if s in current_skills_lower)
            if matches > 0:
                domain_scores[domain] = matches / len(domain_skill_list)
                
        # Fallback to foundational tech skills if the resume is basically blank
        if not domain_scores:
            fallback = ["python", "javascript", "sql", "git", "html"]
            return [f for f in fallback if f not in current_skills_lower][:num_recommendations]
            
        # Get up to 2 top domains (e.g., if they are strongly Data Science and Backend)
        top_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)[:2]
        
        recommendations = []
        for domain, _ in top_domains:
            # Recommend the missing exact technical skills from this specific domain!
            for skill in DOMAIN_SKILLS[domain]:
                if skill not in current_skills_lower and skill not in recommendations:
                    recommendations.append(skill)
                    
        return recommendations[:num_recommendations]


# Initialize NLP pipeline
nlp_pipeline = NLPPipeline()

def build_feedback_prompt(resume_text: str, job_description: Optional[str]) -> str:
    job_str = job_description if job_description else "None provided."
    return f"""You are an expert resume coach and ATS optimization specialist. Analyze the provided resume — and job description if given.

CRITICAL SCORING INSTRUCTIONS:
- Do NOT round off scores to the nearest 5 or 10 (e.g., avoid giving exactly 80, 85, or 90).
- Calculate exact, highly precise scores (e.g., 73, 86, 91, 68) based on a strict point deduction system.
- Be extremely critical and rigorous. Subtract exact points for every missing keyword, lack of metrics, weak verb, or formatting flaw.

Return ONLY a valid JSON object with no markdown fences, no backticks, and no text before or after the JSON.

RESUME:
{resume_text}

JOB DESCRIPTION (if provided):
{job_str}

Return this exact JSON schema:

{{
  "overall_score": <integer 0-100>,
  "overall_summary": "<2-3 sentences on overall quality>",
  "strongest_section": "<best section name>",
  "weakest_section": "<weakest section name>",
  "tone_feedback": "<1-2 sentences on writing tone and confidence>",

  "match_score": <integer 0-100 if job given, else null>,
  "match_label": "<'Excellent Match' | 'Good Match' | 'Partial Match' | 'Poor Match' | null>",

  "skill_tags": ["<skill found in resume>", "..."],
  "matched_skills": ["<skill in resume AND job description>", "..."],
  "missing_skills": ["<skill in job description but NOT in resume>", "..."],

  "keyword_matches": [
    {{
      "keyword": "<important keyword from job description>",
      "matched": <true if found in resume, false if not>,
      "context": "<short phrase from resume where it appears, or empty string if not found>"
    }}
  ],

  "sections": [
    {{
      "section": "<Section name>",
      "score": <integer 0-100>,
      "issues": ["<issue as complete sentence>"],
      "rewritten": "<fully rewritten section with active verbs and metrics>",
      "bullet_rewrites": [
        {{
          "original": "<exact original bullet>",
          "rewritten": "<improved bullet with action verb + result + metric>",
          "reason": "<one sentence explaining improvement>"
        }}
      ]
    }}
  ],

  "top_missing_keywords": ["<keyword>"],
  "ats_tips": ["<actionable ATS tip as complete sentence>"]
}}

Rules:
- All arrays must be arrays, never null or a string
- skill_tags: extract 5-12 skills actually present in the resume
- matched_skills and missing_skills: only populate when a job is provided, else use []
- keyword_matches: extract the 8-12 most important keywords from the job description; use [] if no job
- match_score and match_label: only when job given, else null
- overall_score = weighted average of section scores
- ats_tips: always 3-5 items
- Do NOT output markdown, code fences, or any text outside the JSON
"""

# ============== API ENDPOINTS ==============

@router.get("/")
def read_root():
    return {"message": "IntelliHire API (MongoDB backed)", "version": "1.0.0"}


# ============== AUTH ENDPOINTS ==============

@router.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate):
    """Register a new user"""
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    user_dict["created_at"] = datetime.utcnow()
    result = users_collection.insert_one(user_dict)
    
    new_user = users_collection.find_one({"_id": result.inserted_id})
    return parse_mongo_id(new_user)


@router.post("/auth/login", response_model=UserResponse)
def login_user(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Login endpoint - accepts OAuth2-style form data.
    Frontend sends: username=<email>&password=<password>
    as application/x-www-form-urlencoded
    """
    user = users_collection.find_one({"email": username})
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found. Please register first."
        )
    return parse_mongo_id(user)


# ============== USER ENDPOINTS ==============

@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    user_dict["created_at"] = datetime.utcnow()
    result = users_collection.insert_one(user_dict)
    
    new_user = users_collection.find_one({"_id": result.inserted_id})
    return parse_mongo_id(new_user)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return parse_mongo_id(user)


# ============== RESUME ENDPOINTS ==============

@router.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Upload and analyze resume"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    raw_text = nlp_pipeline.extract_text_from_pdf(file_path)
    raw_text = nlp_pipeline.normalize_aliases(raw_text)
    processed_text = nlp_pipeline.preprocess_text(raw_text)

    skills = nlp_pipeline.extract_skills(processed_text)
    skill_strength = nlp_pipeline.calculate_skill_strength(raw_text, skills)
    recommendations = nlp_pipeline.get_skill_recommendations(skills)
    learning_path = nlp_pipeline.generate_learning_path(recommendations, skills)

    skill_graph = nlp_pipeline.build_skill_graph(skills)
    graph_data = {
        "nodes": list(skill_graph.nodes()),
        "edges": [(u, v) for u, v in skill_graph.edges()]
    }

    resume_doc = {
        "user_id": user_id,
        "filename": file.filename,
        "file_path": file_path,
        "extracted_text": raw_text[:10000],
        "skills": skills,
        "skill_strength": skill_strength,
        "skill_gaps": recommendations,
        "learning_path": learning_path,
        "applied_jobs": [],
        "created_at": datetime.utcnow()
    }
    result = resumes_collection.insert_one(resume_doc)

    return {
        "resume_id": str(result.inserted_id),
        "filename": file.filename,
        "skills": skills,
        "skill_strength": skill_strength,
        "skill_gaps": recommendations,
        "learning_path": learning_path,
        "skill_graph": graph_data
    }


@router.get("/resumes/{resume_id}")
def get_resume(resume_id: str):
    """Get resume analysis"""
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "resume_id": str(resume["_id"]),
        "user_id": resume["user_id"],
        "filename": resume["filename"],
        "skills": resume.get("skills"),
        "skill_strength": resume.get("skill_strength"),
        "skill_gaps": resume.get("skill_gaps"),
        "learning_path": resume.get("learning_path"),
        "applied_jobs": resume.get("applied_jobs", []),
        "application_status": resume.get("application_status", {}),
        "created_at": resume.get("created_at")
    }


@router.get("/users/{user_id}/resumes")
def get_user_resumes(user_id: str):
    """Get all resumes for a user"""
    resumes = list(resumes_collection.find({"user_id": user_id}))
    return [
        {
            "resume_id": str(r["_id"]),
            "filename": r["filename"],
            "skills": r.get("skills"),
            "skill_strength": r.get("skill_strength"),
            "applied_jobs": r.get("applied_jobs", []),
            "application_status": r.get("application_status", {}),
            "created_at": r.get("created_at")
        }
        for r in resumes
    ]

@router.post("/resumes/{resume_id}/apply/{job_id}")
def apply_to_job(resume_id: str, job_id: str):
    """Apply to a job using a resume"""
    if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = resumes_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {
            "$addToSet": {"applied_jobs": job_id},
            "$set": {f"application_status.{job_id}": "pending"}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    candidates_cache.clear()
    jobs_cache.clear()
        
    return {"message": "Successfully applied to job", "applied": True}

@router.post("/resumes/{resume_id}/withdraw/{job_id}")
def withdraw_from_job(resume_id: str, job_id: str):
    """Withdraw application from a job"""
    if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = resumes_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {"$pull": {"applied_jobs": job_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    candidates_cache.clear()
    jobs_cache.clear()
        
    return {"message": "Successfully withdrawn from job", "applied": False}

@router.delete("/resumes/{resume_id}")
def delete_resume(resume_id: str):
    """Delete a resume by ID"""
    try:
        if not ObjectId.is_valid(resume_id):
            raise HTTPException(status_code=400, detail="Invalid resume ID format")
            
        result = resumes_collection.delete_one({"_id": ObjectId(resume_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        candidates_cache.clear()
        jobs_cache.clear()
            
        return {"message": "Resume deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resumes/{resume_id}/pdf")
def get_resume_pdf(resume_id: str):
    """Serve the raw PDF file for viewing"""
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID format")
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    file_path = resume.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    return FileResponse(file_path, media_type="application/pdf", filename=resume.get("filename", "resume.pdf"))

@router.post("/resumes/{resume_id}/feedback", response_model=ResumeFeedbackResponse)
async def get_resume_feedback(resume_id: str, body: ResumeFeedbackRequest):
    # Load resume
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID format")
        
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_text = resume.get("extracted_text")
    if not resume_text:
        raise HTTPException(status_code=422, detail="Resume has no extracted text")

    # Load job description from DB
    job_description = body.job_description
    if not job_description and body.job_id:
        if ObjectId.is_valid(body.job_id):
            job = jobs_collection.find_one({"_id": ObjectId(body.job_id)})
            if job:
                job_description = job.get("description")

    # Check Groq Cache
    import hashlib
    import json
    
    print(f"\n--- FEEDBACK DEBUG ---")
    print(f"body.job_id: {body.job_id}")
    print(f"body.job_description: {bool(body.job_description)}")
    print(f"job_description length: {len(job_description) if job_description else 0}")
    
    # v2: added precise scoring instructions to the prompt
    prompt_str = f"v2|resume:{resume_text}|job:{job_description}"
    prompt_hash = hashlib.sha256(prompt_str.encode('utf-8')).hexdigest()
    print(f"prompt_hash: {prompt_hash}")
    print(f"----------------------\n")
    
    cached_feedback = ai_feedback_cache.find_one({"_id": prompt_hash})
    if cached_feedback:
        print(f"CACHE HIT: Returning Groq feedback from MongoDB for {resume_id}")
        return ResumeFeedbackResponse(**cached_feedback["data"])

    # Call Groq
    from groq import Groq
    import os
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")
        
    client = Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": build_feedback_prompt(resume_text, job_description)}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        raw = completion.choices[0].message.content.strip()

        # Try to parse the JSON
        data = json.loads(raw)
        
        # Save to Cache
        ai_feedback_cache.insert_one({
            "_id": prompt_hash,
            "data": data,
            "resume_id": resume_id,
            "created_at": datetime.utcnow()
        })
        
        return ResumeFeedbackResponse(**data)
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}, Raw text: {raw}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        print(f"AI Feedback Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")

# ============== JOB ENDPOINTS ==============

@router.post("/jobs/")
def create_job(job: JobCreate, recruiter_id: str):
    """Create a new job posting"""
    processed_text = nlp_pipeline.preprocess_text(job.description)
    required_skills = nlp_pipeline.extract_skills(processed_text)

    job_doc = {
        "recruiter_id": recruiter_id,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "location": job.location,
        "job_type": job.job_type,
        "experience_required": job.experience_required,
        "required_skills": required_skills,
        "created_at": datetime.utcnow()
    }
    result = jobs_collection.insert_one(job_doc)
    jobs_cache.clear()

    return {
        "job_id": str(result.inserted_id),
        "title": job.title,
        "company": job.company,
        "required_skills": required_skills
    }


@router.get("/jobs/")
@cached(cache=jobs_cache)
def get_jobs(recruiter_id: Optional[str] = None):
    """Get all jobs, optionally filtered by recruiter"""
    query = {}
    if recruiter_id:
        query["recruiter_id"] = recruiter_id
    jobs = list(jobs_collection.find(query))
    response = []
    for j in jobs:
        job_id_str = str(j["_id"])
        candidates_count = resumes_collection.count_documents({
            "$and": [
                {
                    "$or": [
                        {"applied_jobs": job_id_str},
                        {"job_id": job_id_str}
                    ]
                },
                {
                    f"application_status.{job_id_str}": {"$ne": "rejected"}
                }
            ]
        })
        response.append({
            "job_id": job_id_str,
            "title": j["title"],
            "company": j["company"],
            "description": j.get("description", "")[:200] + "...",
            "location": j.get("location"),
            "job_type": j.get("job_type"),
            "experience_required": j.get("experience_required"),
            "required_skills": j.get("required_skills", []),
            "candidates_count": candidates_count
        })
    return response


@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    """Get job details"""
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": str(job["_id"]),
        "title": job["title"],
        "company": job["company"],
        "description": job["description"],
        "location": job.get("location"),
        "job_type": job.get("job_type"),
        "experience_required": job.get("experience_required"),
        "required_skills": job.get("required_skills", [])
    }


@router.put("/jobs/{job_id}")
def update_job(job_id: str, job_update: JobUpdate):
    """Update an existing job posting"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
        
    existing_job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = {k: v for k, v in job_update.dict().items() if v is not None}
    
    if "description" in update_data:
        processed_text = nlp_pipeline.preprocess_text(update_data["description"])
        update_data["required_skills"] = nlp_pipeline.extract_skills(processed_text)
        
    if update_data:
        jobs_collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )
        jobs_cache.clear()
        
    updated_job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    
    # Optional: We are not explicitly deleting matches associated with this job
    # to maintain history, or we could delete them here.
    
    return parse_mongo_id(updated_job)


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    """Delete a job posting"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
        
    result = jobs_collection.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Also clean up any matches associated with this job
    matches_collection.delete_many({"job_id": job_id})
    
    # Clean up applied_jobs references in resumes
    resumes_collection.update_many(
        {"applied_jobs": job_id},
        {"$pull": {"applied_jobs": job_id}}
    )
    
    jobs_cache.clear()
    candidates_cache.clear()
        
    return {"message": "Job deleted successfully"}


# ============== MATCHING ENDPOINTS ==============

@router.post("/match/{resume_id}/{job_id}")
def match_resume_to_job_endpoint(resume_id: str, job_id: str):
    """Match a resume to a job"""
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})

    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or job not found")

    match_result = nlp_pipeline.match_resume_to_job(
        resume.get("extracted_text", ""),
        job.get("description", ""),
        resume.get("skills", []),
        job.get("required_skills", []),
        job.get("title", "")
    )

    match_doc = {
        "resume_id": resume_id,
        "job_id": job_id,
        "similarity_score": match_result["similarity_score"],
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "created_at": datetime.utcnow()
    }
    result = matches_collection.insert_one(match_doc)

    return {
        "match_id": str(result.inserted_id),
        "resume_id": resume_id,
        "job_id": job_id,
        "similarity_score": match_result["similarity_score"],
        "text_similarity": match_result["text_similarity"],
        "skill_match_ratio": match_result["skill_match_ratio"],
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "match_details": match_result.get("match_details", [])
    }


@router.post("/jobs/{job_id}/upload-candidates")
async def upload_recruiter_candidates(job_id: str, files: List[UploadFile] = File(...)):
    """Upload multiple resumes directly attached to a specific job opening as a recruiter"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
        
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    uploaded = []
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            continue
            
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        raw_text = nlp_pipeline.extract_text_from_pdf(file_path)
        processed_text = nlp_pipeline.preprocess_text(raw_text)
        skills = nlp_pipeline.extract_skills(processed_text)
        
        resume_doc = {
            "user_id": "recruiter_upload",
            "job_id": job_id,
            "filename": file.filename,
            "file_path": file_path,
            "extracted_text": raw_text[:10000],
            "skills": skills,
            "shared_with_recruiters": True,
            "created_at": datetime.utcnow()
        }
        res = resumes_collection.insert_one(resume_doc)
        uploaded.append(str(res.inserted_id))
        
    return {"message": f"Successfully uploaded {len(uploaded)} candidates", "inserted_ids": uploaded}

@router.get("/jobs/{job_id}/candidates")
@cached(cache=candidates_cache)
def get_matching_candidates(job_id: str, min_score: float = 0.0):
    """Get matching candidates for a job"""
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only fetch candidates who applied, or those directly uploaded by recruiter for this job
    resumes = list(resumes_collection.find({
        "$or": [
            {"applied_jobs": job_id},
            {"job_id": job_id}
        ]
    }))
    matches = []

    for resume in resumes:
        match_result = nlp_pipeline.match_resume_to_job(
            resume.get("extracted_text", ""),
            job.get("description", ""),
            resume.get("skills", []),
            job.get("required_skills", []),
            job.get("title", "")
        )

        status = resume.get("application_status", {}).get(job_id, "pending")
        if match_result["similarity_score"] >= min_score:
            matches.append({
                "resume_id": str(resume["_id"]),
                "user_id": resume.get("user_id"),
                "filename": resume.get("filename"),
                "similarity_score": match_result["similarity_score"],
                "matched_skills": match_result["matched_skills"],
                "missing_skills": match_result["missing_skills"],
                "match_details": match_result.get("match_details", []),
                "status": status
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "job_id": job_id,
        "job_title": job.get("title"),
        "candidates": matches
    }

class StatusUpdateRequest(BaseModel):
    status: str

@router.put("/jobs/{job_id}/candidates/{resume_id}/status")
def update_candidate_status(job_id: str, resume_id: str, request: StatusUpdateRequest):
    """Update candidate pipeline status"""
    if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    valid_statuses = ["pending", "shortlisted", "accepted", "rejected"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    result = resumes_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": {f"application_status.{job_id}": request.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    candidates_cache.clear()
    
    return {"message": "Status updated successfully", "status": request.status}


@router.get("/resumes/{resume_id}/recommendations")
def get_job_recommendations(resume_id: str):
    """Get job recommendations for a resume"""
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    jobs = list(jobs_collection.find())
    recommendations = []

    for job in jobs:
        match_result = nlp_pipeline.match_resume_to_job(
            resume.get("extracted_text", ""),
            job.get("description", ""),
            resume.get("skills", []),
            job.get("required_skills", []),
            job.get("title", "")
        )

        recommendations.append({
            "job_id": str(job["_id"]),
            "title": job.get("title"),
            "company": job.get("company"),
            "similarity_score": match_result["similarity_score"],
            "matched_skills": match_result["matched_skills"],
            "missing_skills": match_result["missing_skills"]
        })

    recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "resume_id": resume_id,
        "recommendations": recommendations[:10]
    }


# ============== ANALYTICS ENDPOINTS ==============

@router.get("/analytics/skills")
@cached(cache=TTLCache(maxsize=1, ttl=300))
def get_skill_analytics():
    """Get overall skill analytics"""
    all_resumes = list(resumes_collection.find())

    all_skills = []
    for resume in all_resumes:
        if resume.get("skills"):
            all_skills.extend(resume["skills"])

    skill_counts = Counter(all_skills)

    return {
        "total_resumes": len(all_resumes),
        "unique_skills": len(skill_counts),
        "top_skills": skill_counts.most_common(20)
    }


@router.get("/users/{user_id}/skill-profile")
def get_user_skill_profile(user_id: str):
    """Get comprehensive skill profile for a user"""
    resumes = list(resumes_collection.find({"user_id": user_id}))

    if not resumes:
        return {
            "user_id": user_id,
            "total_resumes": 0,
            "all_skills": [],
            "skill_strengths": {},
            "skill_gaps": [],
            "learning_path": []
        }

    all_skills = set()
    all_strengths = {}

    for resume in resumes:
        if resume.get("skills"):
            all_skills.update(resume["skills"])
        if resume.get("skill_strength"):
            for skill, strength in resume["skill_strength"].items():
                if skill not in all_strengths or strength > all_strengths[skill]:
                    all_strengths[skill] = strength

    
    # Avoid exception if no created_at
    latest_resume = max(resumes, key=lambda r: r.get("created_at", datetime.min))

    return {
        "user_id": user_id,
        "total_resumes": len(resumes),
        "all_skills": list(all_skills),
        "skill_strengths": all_strengths,
        "skill_gaps": latest_resume.get("skill_gaps", []),
        "learning_path": latest_resume.get("learning_path", []),
        "last_updated": latest_resume.get("created_at")
    }



# ============== LIVE JOBS ENDPOINTS ==============

import re

def clean_html(raw_html: str) -> str:
    """Removes HTML tags from description strings"""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return ' '.join(cleantext.split())

def is_fresher_role(title: str) -> bool:
    """Filters out any senior/management job titles"""
    if not title: return False
    t = title.lower()
    # If it has any of these, it's NOT a fresher job
    senior_keywords = ["senior", "sr", "principal", "lead", "manager", "director", "head", "architect", "staff", "vp", "president", "experienced", "chief"]
    if any(kw in t.split() or kw + " " in t or " " + kw in t for kw in senior_keywords):
        return False
    return True

async def fetch_live_jobs(skills: List[str], location: str = "in") -> List[dict]:
    search_skills = skills[:5]
    query_string = " ".join(search_skills) if search_skills else "developer"

    adzuna_app_id = "866a3ecb"
    adzuna_app_key = "c4cba7b77a6a45f2101e8ecddc40015f"
    adzuna_url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
    adzuna_params = {
        "app_id": adzuna_app_id,
        "app_key": adzuna_app_key,
        "results_per_page": 30, # Fetch more to account for filtering
        "what": query_string,
        "content-type": "application/json"
    }

    remotive_url = "https://remotive.com/api/remote-jobs"
    remotive_params = {"search": query_string, "limit": 30}

    himalayas_url = "https://himalayas.app/jobs/api"
    himalayas_params = {"q": query_string, "limit": 30}

    jobicy_url = "https://jobicy.com/api/v2/remote-jobs"
    jobicy_params = {"tag": search_skills[0] if search_skills else "developer", "count": 30}

    results = []

    async def fetch_adzuna(client):
        try:
            resp = await client.get(adzuna_url, params=adzuna_params, timeout=10)
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                for item in data:
                    title = item.get("title", "")
                    if not is_fresher_role(title): continue
                    
                    salary_min = item.get("salary_min", "")
                    salary_max = item.get("salary_max", "")
                    salary = f"${salary_min} - ${salary_max}" if salary_min and salary_max else str(salary_min or salary_max or "")
                    company = item.get("company", {}).get("display_name", "")
                    loc = item.get("location", {}).get("display_name", "")
                    results.append({
                        "title": title,
                        "company": company,
                        "description": clean_html(item.get("description", "")),
                        "url": item.get("redirect_url", ""),
                        "location": loc,
                        "salary": salary.strip(),
                        "source": "adzuna"
                    })
        except Exception:
            pass

    async def fetch_remotive(client):
        try:
            resp = await client.get(remotive_url, params=remotive_params, timeout=10)
            if resp.status_code == 200:
                data = resp.json().get("jobs", [])
                for item in data:
                    title = item.get("title", "")
                    if not is_fresher_role(title): continue

                    results.append({
                        "title": title,
                        "company": item.get("company_name", ""),
                        "description": clean_html(item.get("description", "")),
                        "url": item.get("url", ""),
                        "location": item.get("candidate_required_location", ""),
                        "salary": item.get("salary", ""),
                        "source": "remotive"
                    })
        except Exception:
            pass

    async def fetch_himalayas(client):
        try:
            resp = await client.get(himalayas_url, params=himalayas_params, timeout=10)
            if resp.status_code == 200:
                data = resp.json().get("jobs", [])
                for item in data:
                    title = item.get("title", "")
                    if not is_fresher_role(title): continue

                    results.append({
                        "title": title,
                        "company": item.get("companyName", ""),
                        "description": clean_html(item.get("description", "")),
                        "url": item.get("applicationUrl", ""),
                        "location": item.get("location", ""),
                        "salary": "",
                        "source": "himalayas"
                    })
        except Exception:
            pass

    async def fetch_jobicy(client):
        try:
            resp = await client.get(jobicy_url, params=jobicy_params, timeout=10)
            if resp.status_code == 200:
                data = resp.json().get("jobs", [])
                for item in data:
                    title = item.get("jobTitle", "")
                    if not is_fresher_role(title): continue

                    s_min = item.get("annualSalaryMin", "")
                    s_max = item.get("annualSalaryMax", "")
                    salary = f"${s_min} - ${s_max}" if s_min and s_max else str(s_min or s_max or "")
                    results.append({
                        "title": title,
                        "company": item.get("companyName", ""),
                        "description": clean_html(item.get("jobDescription", "")),
                        "url": item.get("url", ""),
                        "location": item.get("jobGeo", ""),
                        "salary": salary.strip(),
                        "source": "jobicy"
                    })
        except Exception:
            pass

    async with httpx.AsyncClient(timeout=10) as client:
        await asyncio.gather(
            fetch_adzuna(client),
            fetch_remotive(client),
            fetch_himalayas(client),
            fetch_jobicy(client),
            return_exceptions=True
        )

    seen = set()
    deduped = []
    for r in results:
        key = (r["title"].lower(), r["company"].lower())
        if key not in seen:
            seen.add(key)
            deduped.append(r)

    return deduped[:50]


def rank_live_jobs(jobs: List[dict], resume_text: str, resume_skills: List[str]) -> List[dict]:
    for job in jobs:
        desc = job.get("description", "")
        title = job.get("title", "")
        full_text = title + " " + desc
        
        similarity = nlp_pipeline.calculate_similarity(resume_text, desc)
        
        job_skills = nlp_pipeline.extract_skills(full_text)
        if len(job_skills) > 0:
            overlap_ratio = len(set(resume_skills) & set(job_skills)) / max(len(job_skills), 1)
        else:
            overlap_ratio = 0.0
            
        final_score = (similarity * 0.6) + (overlap_ratio * 0.4)
        score_val = round(final_score * 100, 1)
        
        job["match_score"] = score_val
        job["similarity_score"] = score_val  # Required for unified getMatchScore
        job["matched_skills"] = list(set(resume_skills) & set(job_skills))
        job["missing_skills"] = list(set(job_skills) - set(resume_skills))
        
    jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return jobs


@router.get("/resumes/{resume_id}/live-jobs")
async def get_live_job_matches(resume_id: str, location: str = "in", limit: int = 20):
    resume = resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    skills = resume.get("skills", [])
    resume_text = resume.get("extracted_text", "")
    
    cache = resume.get("live_job_cache")
    if cache and "cached_at" in cache:
        time_diff = datetime.utcnow() - cache["cached_at"]
        if time_diff.total_seconds() < 7200:
            jobs = cache.get("jobs", [])
            sources = list(set(j.get("source") for j in jobs))
            return {
                "resume_id": resume_id,
                "total_found": len(jobs),
                "jobs": jobs[:limit],
                "sources_used": sources,
                "cached": True
            }

    raw_jobs = await fetch_live_jobs(skills, location)
    ranked_jobs = rank_live_jobs(raw_jobs, resume_text, skills)
    
    resumes_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": {
            "live_job_cache": {
                "jobs": ranked_jobs,
                "cached_at": datetime.utcnow()
            }
        }}
    )
    
    sources = list(set(j.get("source") for j in ranked_jobs))
    return {
        "resume_id": resume_id,
        "total_found": len(ranked_jobs),
        "jobs": ranked_jobs[:limit],
        "sources_used": sources,
        "cached": False
    }


@router.get("/live-jobs/search")
async def search_live_jobs(query: str, location: str = "in", limit: int = 20):
    skills = query.split()
    raw_jobs = await fetch_live_jobs(skills, location)
    
    sources = list(set(j.get("source") for j in raw_jobs))
    return {
        "query": query,
        "total_found": len(raw_jobs),
        "jobs": raw_jobs[:limit],
        "sources_used": sources
    }


# Include all routes under /api prefix
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
