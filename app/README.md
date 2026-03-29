# IntelliHire Frontend

A modern React frontend for the IntelliHire AI-powered recruitment platform.

## Features

- **Dark Modern UI** - Sleek, professional dark theme with gradient accents
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Role-Based Access** - Separate dashboards for Candidates and Recruiters
- **AI Model Comparison** - Compare BERT, TF-IDF, and XGBoost models
- **Skill Simulation** - What-if analysis for skill development

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast development and optimized builds
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library

## Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   └── Navbar.jsx
    ├── pages/
    │   ├── LandingPage.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── CandidateDashboard.jsx
    │   └── RecruiterDashboard.jsx
    └── services/
        └── api.js
```

## Getting Started

### Prerequisites

- Node.js 18+ with npm

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | LandingPage | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/candidate` | CandidateDashboard | Candidate only |
| `/recruiter` | RecruiterDashboard | Recruiter only |

## API Configuration

The frontend expects the backend API at `/api`. In development, Vite proxies requests to `http://localhost:8000`.

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#3b82f6` | Buttons, links, highlights |
| Secondary | `#a855f7` | Accents, badges |
| Success | `#22c55e` | Positive states |
| Warning | `#f59e0b` | Caution states |
| Error | `#ef4444` | Error states |
| Background | `#0f0f23` | Main background |
| Card | `#16162a` | Card backgrounds |
| Border | `#2e2e4a` | Borders, dividers |

## Features by Role

### Candidate
- Resume upload with AI analysis
- Skill extraction and strength scoring
- Skill gap analysis
- Personalized learning paths
- Job recommendations
- What-if skill simulation

### Recruiter
- Create and manage job postings
- AI-powered candidate ranking
- Multiple AI model selection (BERT, TF-IDF, XGBoost)
- Model comparison visualization
- Candidate skill matching
- Recruitment analytics

## License

MIT
