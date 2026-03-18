"""
IntelliHire - Career Intelligence System
Backend API with FastAPI (MongoDB Migration)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import pdfplumber
import re
import numpy as np
from sentence_transformers import SentenceTransformer, util
import networkx as nx
import json
import os
from dotenv import load_dotenv

load_dotenv()
from collections import Counter
import uuid
from pymongo import MongoClient
from bson import ObjectId

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

# ============== SKILL DATABASE ==============

TECH_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php",
    "swift", "kotlin", "scala", "r", "matlab", "perl", "shell", "bash", "powershell",

    # Web Development
    "html", "css", "react", "vue", "angular", "svelte", "nextjs", "nuxt", "django",
    "flask", "fastapi", "spring", "express", "nodejs", "webpack", "vite", "tailwind",
    "bootstrap", "sass", "less",

    # Data Science & ML
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "scipy",
    "matplotlib", "seaborn", "plotly", "jupyter", "opencv", "nlp", "machine learning",
    "deep learning", "data analysis", "statistics", "sql", "mongodb", "postgresql",

    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab", "github",
    "terraform", "ansible", "prometheus", "grafana", "elasticsearch", "kafka",
    "redis", "nginx", "apache",

    # Mobile Development
    "react native", "flutter", "android", "ios", "xamarin", "ionic",

    # Databases
    "mysql", "postgresql", "mongodb", "sqlite", "redis", "elasticsearch", "dynamodb",
    "cassandra", "neo4j", "firebase",

    # Tools & Others
    "git", "linux", "agile", "scrum", "jira", "confluence", "figma", "sketch",
    "photoshop", "illustrator", "tableau", "power bi"
}

SOFT_SKILLS = {
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "time management", "adaptability", "creativity", "collaboration", "presentation",
    "negotiation", "conflict resolution", "decision making", "emotional intelligence",
    "project management", "strategic thinking", "analytical thinking"
}

ALL_SKILLS = TECH_SKILLS.union(SOFT_SKILLS)

# Skill dependencies for learning path generation
SKILL_DEPENDENCIES = {
    "machine learning": ["python", "statistics", "linear algebra"],
    "deep learning": ["machine learning", "python", "tensorflow"],
    "data science": ["python", "statistics", "sql", "pandas"],
    "full stack": ["html", "css", "javascript", "react", "nodejs"],
    "devops": ["linux", "docker", "kubernetes", "aws"],
    "cloud": ["aws", "azure", "gcp", "linux"],
    "mobile": ["javascript", "react native"],
    "backend": ["python", "java", "sql"],
    "frontend": ["html", "css", "javascript"],
}

# ============== NLP PIPELINE ==============

class NLPPipeline:
    def __init__(self):
        # Load a pre-trained BERT model optimized for semantic text similarity
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting PDF: {e}")
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
        text_lower = text.lower()
        found_skills = set()

        for skill in ALL_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill)

        return list(found_skills)

    def calculate_skill_strength(self, text: str, skills: List[str]) -> Dict[str, float]:
        """Calculate skill strength based on frequency and context"""
        sections = self.extract_sections(text)
        strength_scores = {}

        section_weights = {
            "experience": 2.0,
            "projects": 1.8,
            "skills": 1.5,
            "summary": 1.2,
            "education": 1.0,
            "header": 0.5,
            "other": 0.3
        }

        for skill in skills:
            total_score = 0
            total_weight = 0

            for section_name, section_text in sections.items():
                if not section_text:
                    continue

                weight = section_weights.get(section_name, 0.5)
                pattern = r'\b' + re.escape(skill) + r'\b'
                count = len(re.findall(pattern, section_text.lower()))

                section_words = len(section_text.split())
                if section_words > 0:
                    tf = count / section_words * 1000
                    total_score += tf * weight * (1 + np.log1p(count))
                    total_weight += weight

            if total_weight > 0:
                normalized_score = min(100, (total_score / total_weight) * 10)
                strength_scores[skill] = round(normalized_score, 2)
            else:
                strength_scores[skill] = 50.0

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
                            resume_skills: List[str], job_skills: List[str]) -> Dict[str, Any]:
        """Match resume to job description"""
        text_similarity = self.calculate_similarity(resume_text, job_description)

        resume_skills_lower = set(s.lower() for s in resume_skills)
        job_skills_lower = set(s.lower() for s in job_skills)

        matched_skills = list(resume_skills_lower.intersection(job_skills_lower))
        missing_skills = list(job_skills_lower - resume_skills_lower)

        if len(job_skills) > 0:
            skill_match_ratio = len(matched_skills) / len(job_skills)
        else:
            skill_match_ratio = 0

        combined_score = (text_similarity * 0.5) + (skill_match_ratio * 0.5)

        return {
            "similarity_score": round(combined_score * 100, 2),
            "text_similarity": round(text_similarity * 100, 2),
            "skill_match_ratio": round(skill_match_ratio * 100, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
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
        """Get skill recommendations based on current skills"""
        recommendations = []
        current_skills_lower = set(s.lower() for s in current_skills)

        for skill, deps in SKILL_DEPENDENCIES.items():
            if skill not in current_skills_lower:
                has_prereqs = all(dep in current_skills_lower for dep in deps)
                if has_prereqs:
                    recommendations.append(skill)
                elif any(dep in current_skills_lower for dep in deps):
                    recommendations.append(skill)

        return recommendations[:num_recommendations]


# Initialize NLP pipeline
nlp_pipeline = NLPPipeline()

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
            "created_at": r.get("created_at")
        }
        for r in resumes
    ]


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
        "required_skills": required_skills,
        "created_at": datetime.utcnow()
    }
    result = jobs_collection.insert_one(job_doc)

    return {
        "job_id": str(result.inserted_id),
        "title": job.title,
        "company": job.company,
        "required_skills": required_skills
    }


@router.get("/jobs/")
def get_jobs():
    """Get all jobs"""
    jobs = list(jobs_collection.find())
    return [
        {
            "job_id": str(j["_id"]),
            "title": j["title"],
            "company": j["company"],
            "description": j.get("description", "")[:200] + "...",
            "required_skills": j.get("required_skills", [])
        }
        for j in jobs
    ]


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
        "required_skills": job.get("required_skills", [])
    }


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
        job.get("required_skills", [])
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
        "missing_skills": match_result["missing_skills"]
    }


@router.get("/jobs/{job_id}/candidates")
def get_matching_candidates(job_id: str, min_score: float = 0.0):
    """Get matching candidates for a job"""
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resumes = list(resumes_collection.find())
    matches = []

    for resume in resumes:
        match_result = nlp_pipeline.match_resume_to_job(
            resume.get("extracted_text", ""),
            job.get("description", ""),
            resume.get("skills", []),
            job.get("required_skills", [])
        )

        if match_result["similarity_score"] >= min_score:
            matches.append({
                "resume_id": str(resume["_id"]),
                "user_id": resume.get("user_id"),
                "filename": resume.get("filename"),
                "similarity_score": match_result["similarity_score"],
                "matched_skills": match_result["matched_skills"],
                "missing_skills": match_result["missing_skills"]
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "job_id": job_id,
        "job_title": job.get("title"),
        "candidates": matches
    }


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
            job.get("required_skills", [])
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
        raise HTTPException(status_code=404, detail="No resumes found for user")

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



# Include all routes under /api prefix
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
