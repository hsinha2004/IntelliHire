import os

BACKEND_DIR = r"c:\Users\harsh\Desktop\Kimi_Agent_IntelliHire Profile Bug-3\backend"
MAIN_PY_PATH = os.path.join(BACKEND_DIR, "main.py")

with open(MAIN_PY_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find start of SKILL DATABASE
start_idx = 0
for i, line in enumerate(lines):
    if line.startswith("# ============== SKILL DATABASE =============="):
        start_idx = i
        break

# Find end of NLPPipeline initialization
end_idx = 0
for i, line in enumerate(lines):
    if line.startswith("# ============== API ENDPOINTS =============="):
        end_idx = i
        break

middle_content = "".join(lines[start_idx:end_idx])

PREFIX = """\"\"\"
IntelliHire - Career Intelligence System
Backend API with FastAPI (MongoDB Migration)
\"\"\"

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import pdfplumber
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
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

"""

POSTFIX = """# ============== API ENDPOINTS ==============

@router.get("/")
def read_root():
    return {"message": "IntelliHire API (MongoDB backed)", "version": "1.0.0"}


# ============== AUTH ENDPOINTS ==============

@router.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate):
    \"\"\"Register a new user\"\"\"
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
    \"\"\"
    Login endpoint - accepts OAuth2-style form data.
    Frontend sends: username=<email>&password=<password>
    as application/x-www-form-urlencoded
    \"\"\"
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
    \"\"\"Upload and analyze resume\"\"\"
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
    \"\"\"Get resume analysis\"\"\"
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
    \"\"\"Get all resumes for a user\"\"\"
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
    \"\"\"Create a new job posting\"\"\"
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
    \"\"\"Get all jobs\"\"\"
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
    \"\"\"Get job details\"\"\"
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
    \"\"\"Match a resume to a job\"\"\"
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
    \"\"\"Get matching candidates for a job\"\"\"
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
    \"\"\"Get job recommendations for a resume\"\"\"
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
    \"\"\"Get overall skill analytics\"\"\"
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
    \"\"\"Get comprehensive skill profile for a user\"\"\"
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
"""

with open(MAIN_PY_PATH, "w", encoding="utf-8") as f:
    f.write(PREFIX + middle_content + POSTFIX)

print("Rewrote main.py successfully!")
