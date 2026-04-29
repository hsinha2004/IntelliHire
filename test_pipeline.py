"""
IntelliHire — Full Pipeline Integration Test
=============================================
Tests the complete recruiter workflow against real resume PDFs:
  1. Register & login a test recruiter
  2. For each job category, post a job and upload matching resumes
  3. Fetch match scores and evaluate whether the NLP pipeline is working
  4. Report pass/fail per category with detailed diagnostics

Adapted for the actual IntelliHire API (FastAPI + MongoDB, no auth tokens).
"""

import os
import json
import requests
import time
from pathlib import Path
from datetime import datetime

# ── CONFIG ──────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8001/api"   # FastAPI backend with /api prefix
DATASET_PATH = "./Resumes PDF"           # Path to the resume dataset
RESULTS_LOG = "./test_results.json"      # Output report
MIN_MATCH_THRESHOLD = 50.0              # Minimum acceptable avg match score %

# ── JOB TEMPLATES per category ──────────────────────────────────────────
JOB_TEMPLATES = {
    "accountant": {
        "title": "Senior Accountant",
        "company": "IntelliHire Test Corp",
        "description": """We are looking for an experienced Accountant
        with strong knowledge of financial reporting, tax preparation,
        and bookkeeping. Must have experience with Tally, QuickBooks,
        SAP, or similar accounting software. CPA certification preferred.
        Skills: accounting, financial reporting, tally, quickbooks,
        taxation, auditing, balance sheet, excel, gst, tds""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Accountant"
    },
    "agriculture": {
        "title": "Agricultural Manager",
        "company": "IntelliHire Test Corp",
        "description": """Seeking an Agriculture professional with expertise
        in crop management, soil science, irrigation systems, and
        agricultural technology. Experience with farm management software
        and sustainable farming practices required.
        Skills: crop management, soil science, irrigation,
        agronomy, fertilizers, pest control, farm management""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Agricultural"
    },
    "blockchain": {
        "title": "Blockchain Developer",
        "company": "IntelliHire Test Corp",
        "description": """Looking for a Blockchain Developer with hands-on
        experience in Solidity, Ethereum, Web3.js, and smart contract
        development. Experience with DeFi protocols and NFT platforms
        is a strong plus.
        Skills: blockchain, solidity, ethereum, web3, smart contracts,
        cryptocurrency, defi, nft, python, javascript""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Blockchain"
    },
    "data science": {
        "title": "Data Scientist",
        "company": "IntelliHire Test Corp",
        "description": """We need a Data Scientist proficient in machine
        learning, statistical modeling, and data visualization. Must
        know Python, SQL, TensorFlow or PyTorch, and have experience
        with large datasets and model deployment.
        Skills: python, machine learning, sql, tensorflow, pytorch,
        pandas, numpy, scikit-learn, data visualization, statistics,
        deep learning, nlp""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "data science"
    },
    "devops": {
        "title": "DevOps Engineer",
        "company": "IntelliHire Test Corp",
        "description": """Hiring a DevOps Engineer with expertise in CI/CD
        pipelines, Docker, Kubernetes, AWS or Azure, and infrastructure
        as code. Strong scripting skills in Python or Bash required.
        Skills: docker, kubernetes, jenkins, aws, azure, terraform,
        ansible, linux, python, bash, git, monitoring""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "DevOps Engineer"
    },
    "java": {
        "title": "Java Developer",
        "company": "IntelliHire Test Corp",
        "description": """Looking for a Java Developer with strong experience
        in Spring Boot, microservices, REST APIs, and SQL databases.
        Knowledge of JUnit, Maven, and Agile methodology preferred.
        Skills: java, spring boot, microservices, rest api, sql,
        hibernate, maven, junit, mysql, postgresql, git, agile""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Java Developer"
    },
    "python": {
        "title": "Python Developer",
        "company": "IntelliHire Test Corp",
        "description": """Seeking a Python Developer experienced in Django
        or FastAPI, REST API development, SQL/NoSQL databases, and
        cloud platforms. Data processing and automation experience valued.
        Skills: python, django, fastapi, flask, rest api, sql,
        mongodb, postgresql, aws, docker, git""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Python Developer"
    },
    "react": {
        "title": "React Frontend Developer",
        "company": "IntelliHire Test Corp",
        "description": """We need a React Developer with strong skills in
        ReactJS, TypeScript, Redux, and modern frontend tooling. Experience
        with REST APIs, testing frameworks, and responsive design required.
        Skills: react, javascript, typescript, redux, html, css,
        nodejs, git, jest, webpack, tailwind""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "React Developer"
    },
    "sql": {
        "title": "SQL Database Developer",
        "company": "IntelliHire Test Corp",
        "description": """Hiring a SQL Developer with expertise in database
        design, query optimization, stored procedures, and ETL processes.
        Experience with MySQL, PostgreSQL, or SQL Server required.
        Skills: sql, mysql, postgresql, database design,
        stored procedures, etl, query optimization, python, tableau""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "SQL Developer"
    },
    "etl": {
        "title": "ETL Developer",
        "company": "IntelliHire Test Corp",
        "description": """Looking for an ETL Developer with experience in
        data warehousing, Informatica, SSIS, or Apache Spark. Strong SQL
        skills and knowledge of data pipeline architecture required.
        Skills: etl, informatica, ssis, sql, python, spark,
        data warehouse, talend, pentaho, tableau, postgresql""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "ETL Developer"
    },
    "hr": {
        "title": "HR Manager",
        "company": "IntelliHire Test Corp",
        "description": """Seeking an HR professional with expertise in
        recruitment, employee relations, payroll management, and HR
        analytics. Experience with HRMS tools and labor law compliance.
        Skills: recruitment, payroll, hr management, employee
        relations, hrms, labor law, performance management, onboarding""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "HR"
    },
    "finance": {
        "title": "Finance Analyst",
        "company": "IntelliHire Test Corp",
        "description": """We need a Finance Analyst with strong skills in
        financial modeling, budgeting, forecasting, and investment analysis.
        Must be proficient in Excel, Python, and financial reporting tools.
        Skills: financial modeling, excel, python, budgeting,
        forecasting, investment analysis, sql, tableau, accounting""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Finance"
    },
    "banking": {
        "title": "Banking Operations Specialist",
        "company": "IntelliHire Test Corp",
        "description": """Hiring a Banking professional with knowledge of
        core banking systems, KYC/AML compliance, credit analysis, and
        financial products. Experience with FINACLE or Temenos preferred.
        Skills: banking, kyc, aml, credit analysis, core banking,
        finacle, financial products, compliance, excel, sql""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Banking"
    },
    "civil engineer": {
        "title": "Civil Engineer",
        "company": "IntelliHire Test Corp",
        "description": """Looking for a Civil Engineer with expertise in
        structural design, AutoCAD, project management, and construction
        supervision. Knowledge of IS codes and site management required.
        Skills: autocad, structural design, project management,
        construction, staad pro, revit, ms project, civil engineering""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Civil Engineer"
    },
    "network security": {
        "title": "Network Security Engineer",
        "company": "IntelliHire Test Corp",
        "description": """Seeking a Network Security Engineer with expertise
        in firewall configuration, penetration testing, SIEM, and
        vulnerability assessment. CISSP or CEH certification preferred.
        Skills: network security, firewall, penetration testing,
        siem, vulnerability assessment, python, linux, cissp, ceh,
        wireshark""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Network Security Engineer"
    },
    "testing": {
        "title": "QA Test Engineer",
        "company": "IntelliHire Test Corp",
        "description": """We need a QA Engineer with experience in manual
        and automation testing, Selenium, API testing, and bug tracking
        tools. ISTQB certification and Agile experience preferred.
        Skills: selenium, manual testing, automation testing,
        jira, api testing, python, java, testng, agile""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Testing"
    },
    "business analyst": {
        "title": "Business Analyst",
        "company": "IntelliHire Test Corp",
        "description": """Hiring a Business Analyst with strong skills in
        requirements gathering, process mapping, data analysis, and
        stakeholder communication. Experience with JIRA, SQL, and
        Agile methodology required.
        Skills: business analysis, requirements gathering, sql,
        jira, agile, process mapping, uml, excel, tableau""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Business Analyst"
    },
    "sales": {
        "title": "Sales Manager",
        "company": "IntelliHire Test Corp",
        "description": """Looking for a Sales Manager with proven track
        record in B2B sales, CRM management, lead generation, and team
        leadership. Experience with Salesforce or HubSpot preferred.
        Skills: sales, crm, salesforce, lead generation, b2b,
        negotiation, team management, excel, communication""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Sales"
    },
    "dotnet": {
        "title": ".NET Developer",
        "company": "IntelliHire Test Corp",
        "description": """Seeking a .NET Developer with expertise in C#,
        ASP.NET Core, MVC, Entity Framework, and SQL Server. Experience
        with Azure and microservices architecture is a plus.
        Skills: c#, asp.net, dotnet, entity framework, sql server,
        azure, mvc, rest api, git, visual studio, microservices""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "DotNet Developer"
    },
    "sap": {
        "title": "SAP Developer",
        "company": "IntelliHire Test Corp",
        "description": """We need an SAP Developer with hands-on experience
        in SAP ABAP, SAP HANA, SAP Fiori, and module configuration.
        Experience with SAP S/4HANA migration is highly valued.
        Skills: sap, abap, sap hana, sap fiori, s4hana,
        sap basis, sap mm, sap fi, sap sd, sql""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "SAP Developer"
    },
    "digital media": {
        "title": "Digital Media Specialist",
        "company": "IntelliHire Test Corp",
        "description": """Looking for a Digital Media professional with
        expertise in social media marketing, content creation, SEO/SEM,
        and analytics. Experience with Adobe Creative Suite preferred.
        Skills: social media, content creation, seo, sem,
        google analytics, adobe photoshop, canva, marketing,
        email marketing, copywriting""",
        "location": "Remote",
        "job_type": "full-time",
        "resume_folder_hint": "Digital Media"
    },
}


# ═══════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════

def find_resume_folder(hint: str, dataset_path: str):
    """Find the 'resumes' subfolder matching the hint keyword."""
    dataset = Path(dataset_path)
    hint_lower = hint.lower().replace(" ", "")

    # Pass 1: exact-ish match  (e.g. "Python Developer resumes")
    for folder in sorted(dataset.iterdir()):
        if not folder.is_dir():
            continue
        folder_lower = folder.name.lower().replace(" ", "")
        if "resume" in folder_lower and hint_lower in folder_lower:
            return str(folder)

    # Pass 2: partial prefix match
    for folder in sorted(dataset.iterdir()):
        if not folder.is_dir():
            continue
        folder_lower = folder.name.lower().replace(" ", "")
        if "resume" in folder_lower and hint_lower[:6] in folder_lower:
            return str(folder)

    return None


def get_pdf_files(folder_path: str, limit: int = 5):
    """Get up to `limit` PDF files from a folder."""
    folder = Path(folder_path)
    pdfs = sorted(folder.glob("*.pdf"))
    return [str(p) for p in pdfs[:limit]]


# ═══════════════════════════════════════════════════════════════════════
# API WRAPPERS  (adapted for IntelliHire's actual endpoints)
# ═══════════════════════════════════════════════════════════════════════

def register_recruiter(name: str, email: str):
    """Register a recruiter via POST /api/auth/register (JSON body)."""
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "role": "recruiter"
    })
    return resp.status_code, resp.json()


def login_recruiter(email: str):
    """Login via POST /api/auth/login (form-encoded). Returns user dict."""
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": "unused"     # backend doesn't validate passwords
    })
    return resp.status_code, resp.json()


def post_job(recruiter_id: str, job: dict):
    """Create a job via POST /api/jobs/?recruiter_id=... (JSON body)."""
    payload = {
        "title": job["title"],
        "company": job["company"],
        "description": job["description"],
        "location": job.get("location", "Remote"),
        "job_type": job.get("job_type", "full-time"),
    }
    resp = requests.post(
        f"{BASE_URL}/jobs/",
        params={"recruiter_id": recruiter_id},
        json=payload
    )
    return resp.status_code, resp.json()


def upload_candidates(job_id: str, pdf_paths: list):
    """Upload PDFs as recruiter candidates via POST /api/jobs/{job_id}/upload-candidates."""
    files = []
    open_handles = []
    for path in pdf_paths:
        fh = open(path, "rb")
        open_handles.append(fh)
        files.append(("files", (Path(path).name, fh, "application/pdf")))

    resp = requests.post(f"{BASE_URL}/jobs/{job_id}/upload-candidates", files=files)

    for fh in open_handles:
        fh.close()

    return resp.status_code, resp.json()


def get_candidates(job_id: str):
    """Fetch match scores via GET /api/jobs/{job_id}/candidates."""
    resp = requests.get(f"{BASE_URL}/jobs/{job_id}/candidates")
    return resp.status_code, resp.json()


# ═══════════════════════════════════════════════════════════════════════
# MAIN TEST RUNNER
# ═══════════════════════════════════════════════════════════════════════

def run_full_pipeline_test():
    results = {
        "run_at": datetime.now().isoformat(),
        "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0, "skipped": 0},
        "category_results": [],
        "critical_issues": [],
        "warnings": []
    }

    # ── STEP A: Register & login test recruiter ──────────────────────
    print("🔐 Registering test recruiter...")
    email = f"pipeline_test_{int(time.time())}@intellihire.ai"
    code, reg = register_recruiter("Pipeline Tester", email)
    if code not in (200, 400):  # 400 = already exists, that's ok
        results["critical_issues"].append(f"❌ CRITICAL: Registration returned {code}: {reg}")
        print(f"   ❌ Registration failed: {reg}")
        return results
    print(f"   ✅ Registered: {email}")

    code, user = login_recruiter(email)
    if code != 200:
        results["critical_issues"].append(f"❌ CRITICAL: Login returned {code}: {user}")
        print(f"   ❌ Login failed. Stopping.")
        return results

    recruiter_id = user.get("id")
    print(f"   ✅ Logged in. Recruiter ID: {recruiter_id}")

    # ── STEP B: Loop through each job category ───────────────────────
    for cat_key, template in JOB_TEMPLATES.items():
        print(f"\n{'='*60}")
        print(f"📂 Testing category: {cat_key.upper()}")
        results["summary"]["total"] += 1

        cat = {
            "category": cat_key,
            "job_title": template["title"],
            "resume_folder": None,
            "pdfs_found": 0,
            "job_posted": False,
            "job_id": None,
            "required_skills": [],
            "resumes_uploaded": 0,
            "match_scores": [],
            "avg_match_score": 0,
            "status": "pending",
            "issues": []
        }

        # ── Find resume folder ──
        hint = template.get("resume_folder_hint", cat_key)
        folder = find_resume_folder(hint, DATASET_PATH)
        if not folder:
            msg = f"⚠️  No resume folder found for '{cat_key}' (hint: {hint})"
            print(f"   {msg}")
            cat["issues"].append(msg)
            cat["status"] = "skipped"
            results["summary"]["skipped"] += 1
            results["warnings"].append(msg)
            results["category_results"].append(cat)
            continue

        cat["resume_folder"] = folder
        pdfs = get_pdf_files(folder, limit=5)
        cat["pdfs_found"] = len(pdfs)
        print(f"   📄 Found {len(pdfs)} PDFs in: {Path(folder).name}")

        if not pdfs:
            msg = f"⚠️  Folder exists but no PDFs in '{folder}'"
            cat["issues"].append(msg)
            cat["status"] = "skipped"
            results["summary"]["skipped"] += 1
            results["warnings"].append(msg)
            results["category_results"].append(cat)
            continue

        # ── Post job ──
        try:
            code, job_resp = post_job(recruiter_id, template)
            if code != 200:
                raise Exception(f"HTTP {code}: {job_resp}")
            job_id = job_resp.get("job_id")
            cat["job_posted"] = True
            cat["job_id"] = job_id
            cat["required_skills"] = job_resp.get("required_skills", [])
            print(f"   ✅ Job posted: {job_id}  (skills: {cat['required_skills']})")
        except Exception as e:
            msg = f"❌ Job posting failed for '{cat_key}': {e}"
            cat["issues"].append(msg)
            cat["status"] = "failed"
            results["critical_issues"].append(msg)
            results["summary"]["failed"] += 1
            results["category_results"].append(cat)
            continue

        # ── Upload resumes as recruiter candidates ──
        try:
            code, upload_resp = upload_candidates(job_id, pdfs)
            if code != 200:
                raise Exception(f"HTTP {code}: {upload_resp}")
            cat["resumes_uploaded"] = len(upload_resp.get("inserted_ids", []))
            print(f"   📤 Uploaded: {cat['resumes_uploaded']}/{len(pdfs)} resumes")
        except Exception as e:
            msg = f"❌ Upload failed for '{cat_key}': {e}"
            cat["issues"].append(msg)
            cat["status"] = "failed"
            results["critical_issues"].append(msg)
            results["summary"]["failed"] += 1
            results["category_results"].append(cat)
            continue

        # ── Fetch match scores ──
        try:
            code, cand_resp = get_candidates(job_id)
            if code != 200:
                raise Exception(f"HTTP {code}: {cand_resp}")
            candidates = cand_resp.get("candidates", [])
            scores = [c.get("similarity_score", 0) for c in candidates]
            cat["match_scores"] = scores

            if scores:
                avg = sum(scores) / len(scores)
                cat["avg_match_score"] = round(avg, 2)
                print(f"   📊 Scores: {[round(s,1) for s in scores]}")
                print(f"   📊 Average: {avg:.2f}%")

                # Show match details for first candidate
                if candidates and "match_details" in candidates[0]:
                    print(f"   🔍 Top candidate match details:")
                    for d in candidates[0]["match_details"][:3]:
                        print(f"      {d['required']} → {d['matched_with']} ({d['match_type']}, {d['score']})")

                # ── Evaluate ──
                if avg >= MIN_MATCH_THRESHOLD:
                    cat["status"] = "passed"
                    results["summary"]["passed"] += 1
                    print(f"   ✅ PASS — avg {avg:.1f}% >= {MIN_MATCH_THRESHOLD}%")
                elif avg >= 30:
                    cat["status"] = "warning"
                    results["summary"]["warnings"] += 1
                    msg = f"⚠️  LOW SCORE '{cat_key}': avg {avg:.1f}% (expected >= {MIN_MATCH_THRESHOLD}%)"
                    cat["issues"].append(msg)
                    results["warnings"].append(msg)
                    print(f"   ⚠️  WARNING — {msg}")
                else:
                    cat["status"] = "failed"
                    results["summary"]["failed"] += 1
                    msg = f"❌ FAIL '{cat_key}': avg {avg:.1f}% — very poor match"
                    cat["issues"].append(msg)
                    results["critical_issues"].append(msg)
                    print(f"   ❌ FAIL — {msg}")
            else:
                msg = f"❌ No candidates returned for job '{job_id}'"
                cat["issues"].append(msg)
                cat["status"] = "failed"
                results["critical_issues"].append(msg)
                results["summary"]["failed"] += 1

        except Exception as e:
            msg = f"❌ Candidate fetch failed for '{cat_key}': {e}"
            cat["issues"].append(msg)
            cat["status"] = "failed"
            results["critical_issues"].append(msg)
            results["summary"]["failed"] += 1

        results["category_results"].append(cat)

    # ── STEP C: Final Report ─────────────────────────────────────────
    print(f"\n{'='*60}")
    print("📋 FINAL TEST REPORT")
    print(f"{'='*60}")
    s = results["summary"]
    print(f"  Total categories tested : {s['total']}")
    print(f"  ✅ Passed               : {s['passed']}")
    print(f"  ⚠️  Warnings             : {s['warnings']}")
    print(f"  ❌ Failed               : {s['failed']}")
    print(f"  ⏭️  Skipped              : {s['skipped']}")

    if results["critical_issues"]:
        print(f"\n🚨 CRITICAL ISSUES:")
        for issue in results["critical_issues"]:
            print(f"  {issue}")

    if results["warnings"]:
        print(f"\n⚠️  WARNINGS:")
        for w in results["warnings"]:
            print(f"  {w}")

    # Save results
    with open(RESULTS_LOG, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Full results saved to: {RESULTS_LOG}")

    return results


if __name__ == "__main__":
    run_full_pipeline_test()
