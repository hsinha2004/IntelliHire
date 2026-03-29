# IntelliHire - Career Intelligence System

A full-stack web application that uses NLP and machine learning to analyze resumes, extract skills, identify skill gaps, and match candidates with job opportunities.

## Features

### For Students/Users
- **Resume Upload & Analysis**: Upload PDF resumes for AI-powered analysis
- **Skill Extraction**: Automatically extract technical and soft skills from your resume
- **Skill Strength Scoring**: Get proficiency scores based on experience and project context
- **Skill Gap Analysis**: Identify skills to develop for better career opportunities
- **Personalized Learning Path**: Get recommended learning sequences based on skill dependencies
- **Job Matching**: Find internships and jobs matched to your skills using AI similarity analysis

### For Recruiters
- **Job Posting**: Create job listings with skill requirements
- **AI Candidate Matching**: Find the best candidates using cosine similarity on resume embeddings
- **Skill-Based Filtering**: See matched and missing skills for each candidate
- **Recruitment Analytics**: Track job postings and candidate match scores

## Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Lightweight database for data storage
- **pdfplumber**: PDF text extraction
- **scikit-learn**: TF-IDF vectorization and cosine similarity
- **NetworkX**: Skill dependency graph construction
- **NumPy/Pandas**: Data processing and analysis

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful UI components
- **Recharts**: Data visualization charts
- **Axios**: HTTP client for API requests
- **Lucide React**: Icon library

## Project Structure

```
intellihire/
├── backend/
│   ├── main.py              # FastAPI application with NLP pipeline
│   ├── uploads/             # Uploaded resume storage
│   └── intellihire.db       # SQLite database
├── app/                     # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── App.css          # Custom styles
│   │   └── components/      # UI components
│   ├── dist/                # Production build
│   └── package.json
├── start_backend.py         # Backend startup script
└── README.md
```

## API Endpoints

### Users
- `POST /users/` - Create a new user (student or recruiter)
- `GET /users/{user_id}` - Get user details

### Resumes
- `POST /upload-resume/` - Upload and analyze a resume PDF
- `GET /resumes/{resume_id}` - Get resume analysis
- `GET /users/{user_id}/resumes` - Get all resumes for a user

### Jobs
- `POST /jobs/` - Create a new job posting
- `GET /jobs/` - List all jobs
- `GET /jobs/{job_id}` - Get job details

### Matching
- `POST /match/{resume_id}/{job_id}` - Match a resume to a job
- `GET /jobs/{job_id}/candidates` - Get matching candidates for a job
- `GET /resumes/{resume_id}/recommendations` - Get job recommendations

### Analytics
- `GET /analytics/skills` - Get overall skill analytics
- `GET /users/{user_id}/skill-profile` - Get user's skill profile

## NLP Pipeline

The system uses a sophisticated NLP pipeline for resume analysis:

1. **Text Extraction**: Extract text from PDF using pdfplumber
2. **Text Preprocessing**: Clean and normalize text
3. **Section Extraction**: Identify resume sections (experience, education, projects, etc.)
4. **Skill Extraction**: Match skills against comprehensive skill database
5. **Skill Strength Calculation**: Score skills based on:
   - Frequency of mentions
   - Section context (experience > skills section)
   - TF-IDF weighting
6. **Skill Gap Analysis**: Compare user skills with job requirements
7. **Learning Path Generation**: Build paths using skill dependency graph
8. **Job Matching**: Calculate similarity using TF-IDF and cosine similarity

## Running the Application

### Start the Backend

```bash
# Option 1: Using the startup script
python3 start_backend.py

# Option 2: Directly
cd backend
python3 main.py
```

The backend will start on `http://localhost:8000`

### Start the Frontend

```bash
cd app
npm run dev
```

The frontend will start on `http://localhost:5173`

### Build for Production

```bash
cd app
npm run build
```

The production build will be in `app/dist/`

## Usage

1. **Open the application** in your browser
2. **Select your role**: Student/User or Recruiter
3. **Create a profile** with your email and name
4. **For Students**:
   - Upload your resume PDF
   - View extracted skills and strength scores
   - See skill gaps and learning paths
   - Browse recommended jobs
5. **For Recruiters**:
   - Post job descriptions
   - View AI-matched candidates
   - See skill match details

## Skill Database

The system includes a comprehensive skill database:

- **Programming Languages**: Python, Java, JavaScript, TypeScript, C++, Go, Rust, etc.
- **Web Development**: React, Vue, Angular, Django, Flask, Node.js, etc.
- **Data Science & ML**: TensorFlow, PyTorch, Pandas, NumPy, Scikit-learn, etc.
- **Cloud & DevOps**: AWS, Azure, GCP, Docker, Kubernetes, etc.
- **Mobile Development**: React Native, Flutter, Android, iOS
- **Databases**: MySQL, PostgreSQL, MongoDB, Redis, etc.
- **Soft Skills**: Communication, Leadership, Teamwork, Problem Solving, etc.

## Skill Dependencies

The system models skill dependencies for learning path generation:

- Machine Learning → Python, Statistics, Linear Algebra
- Deep Learning → Machine Learning, Python, TensorFlow
- Data Science → Python, Statistics, SQL, Pandas
- Full Stack → HTML, CSS, JavaScript, React, Node.js
- DevOps → Linux, Docker, Kubernetes, AWS

## License

MIT License

## Author

IntelliHire Team
