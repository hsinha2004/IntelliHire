import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  TrendingUp,
  Target,
  BookOpen,
  Zap,
  CheckCircle2,
  AlertCircle,
  Brain,
  BarChart3,
  Briefcase,
  Award,
  Sparkles,
  X,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Globe,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { resumeAPI, jobsAPI, getLiveJobs } from "../services/api";
import ResumeFeedback from "../components/ResumeFeedback";

const CandidateDashboard = () => {
  const [user, setUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [skillProfile, setSkillProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [simulatedSkills, setSimulatedSkills] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [liveJobs, setLiveJobs] = useState([]);
  const [isFetchingLiveJobs, setIsFetchingLiveJobs] = useState(false);
  const [liveJobsLocation, setLiveJobsLocation] = useState("in");
  const [liveJobsSort, setLiveJobsSort] = useState("match");
  const [liveJobsCached, setLiveJobsCached] = useState(false);
  const [liveJobsSources, setLiveJobsSources] = useState([]);
  const [hasSearchedLiveJobs, setHasSearchedLiveJobs] = useState(false);
  const [liveJobsError, setLiveJobsError] = useState(null);
  const [resumesList, setResumesList] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);
  const navigate = useNavigate();

  const groupedSkills = useMemo(() => {
    if (!analysis?.skills) return {};
    const groups = {
      "Engineering": [],
      "Data & AI": [],
      "Infrastructure": [],
      "Core Skills": []
    };
    
    // Skill categorization logic based on the image's groupings
    const engKeywords = ["javascript", "python", "java", "c++", "c#", "html", "css", "react", "node", "angular", "typescript", "ruby", "php", "swift", "django", "flask", "spring", "vue", "android", "ios"];
    const dataKeywords = ["data", "machine", "deep", "tensorflow", "pytorch", "nlp", "pandas", "numpy", "sql", "statistics", "math", "analytics", "scikit", "tableau", "power bi", "r", "opencv"];
    const infraKeywords = ["aws", "azure", "cloud", "docker", "kubernetes", "git", "linux", "jenkins", "devops", "mongo", "postgres", "mysql", "redis", "nginx", "kafka", "elasticsearch", "cassandra", "github", "agile"];
    
    analysis.skills.forEach(skill => {
      const s = skill.toLowerCase();
      if (dataKeywords.some(k => s.includes(k))) groups["Data & AI"].push(skill);
      else if (infraKeywords.some(k => s.includes(k))) groups["Infrastructure"].push(skill);
      else if (engKeywords.some(k => s.includes(k))) groups["Engineering"].push(skill);
      else groups["Core Skills"].push(skill);
    });
    
    // Only return groups that actually have skills
    return Object.fromEntries(Object.entries(groups).filter(([_, arr]) => arr.length > 0));
  }, [analysis?.skills]);

  // Coordinates and organic SVG paths mapping to the visual positions
  const cloudLayouts = [
    { top: '5%', left: '5%', path: "M 50 50 C 40 30, 20 45, 20 25" },
    { top: '5%', right: '5%', path: "M 50 50 C 60 30, 80 45, 80 25" },
    { bottom: '5%', left: '5%', path: "M 50 50 C 40 70, 20 55, 20 75" },
    { bottom: '5%', right: '5%', path: "M 50 50 C 60 70, 80 55, 80 75" },
    { top: '35%', left: '0%', path: "M 50 50 Q 25 50, 10 50" }
  ];

  const fetchLiveJobs = async () => {
    if (!analysis?.resume_id) return;
    
    setIsFetchingLiveJobs(true);
    setLiveJobsError(null);
    setHasSearchedLiveJobs(true);
    
    try {
      const response = await getLiveJobs(analysis.resume_id, liveJobsLocation, 30);
      setLiveJobs(response.data.jobs || []);
      setLiveJobsCached(response.data.cached || false);
      setLiveJobsSources(response.data.sources_used || []);
    } catch (error) {
      console.error("Error fetching live jobs:", error);
      setLiveJobsError("Could not fetch jobs right now. Try again.");
    } finally {
      setIsFetchingLiveJobs(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      
      // 1. Fetch overall skill profile for stats
      const profileResponse = await resumeAPI.getSkillProfile(userData.id);
      setSkillProfile(profileResponse.data);
      
      // 2. Fetch user's resumes to load the most recent one
      const resumesResponse = await resumeAPI.getUserResumes(userData.id);
      const resumes = resumesResponse.data;
      setResumesList(resumes || []);
      
      if (resumes && resumes.length > 0) {
        // Last one is typically the newest
        const latestResume = resumes[resumes.length - 1];
        
        // Get full analysis for this resume
        const analysisResponse = await resumeAPI.getById(latestResume.resume_id);
        setAnalysis(analysisResponse.data);
        
        // Fetch job recommendations
        const recResponse = await resumeAPI.getRecommendations(latestResume.resume_id);
        setRecommendations(recResponse.data.recommendations || []);
      } else {
        setAnalysis(null);
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    
    setIsDeleting(resumeId);
    try {
      await resumeAPI.delete(resumeId);
      
      // If the deleted resume was the currently loaded active one
      if (analysis && analysis.resume_id === resumeId) {
        setAnalysis(null);
        setRecommendations([]);
        setActiveTab("upload");
      }
      
      // Refresh the dashboard data (this will auto-select the next most recent resume)
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert(error.response?.data?.detail || "Failed to delete resume");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith(".pdf")) {
      setUploadError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await resumeAPI.upload(file, user.id);
      setAnalysis(response.data);

      // Fetch job recommendations
      const recResponse = await resumeAPI.getRecommendations(
        response.data.resume_id
      );
      setRecommendations(recResponse.data.recommendations);

      // Refresh skill profile
      fetchDashboardData();

      setActiveTab("skills");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error.response?.data?.detail || "Error uploading resume. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyToJob = async (jobId) => {
    if (!analysis?.resume_id) return;
    try {
      await resumeAPI.applyToJob(analysis.resume_id, jobId);
      setAnalysis({
        ...analysis,
        applied_jobs: [...(analysis.applied_jobs || []), jobId]
      });
      setResumesList(resumesList.map(r => 
        r.resume_id === analysis.resume_id ? { ...r, applied_jobs: [...(r.applied_jobs || []), jobId] } : r
      ));
    } catch (error) {
      console.error("Error applying to job:", error);
      alert("Failed to apply. Please try again.");
    }
  };

  const handleWithdrawFromJob = async (jobId) => {
    if (!analysis?.resume_id) return;
    try {
      await resumeAPI.withdrawFromJob(analysis.resume_id, jobId);
      setAnalysis({
        ...analysis,
        applied_jobs: (analysis.applied_jobs || []).filter(id => id !== jobId)
      });
      setResumesList(resumesList.map(r => 
        r.resume_id === analysis.resume_id ? { ...r, applied_jobs: (r.applied_jobs || []).filter(id => id !== jobId) } : r
      ));
    } catch (error) {
      console.error("Error withdrawing from job:", error);
      alert("Failed to withdraw. Please try again.");
    }
  };

  const handleSkillSimulation = (skill) => {
    if (simulatedSkills.includes(skill)) {
      setSimulatedSkills(simulatedSkills.filter((s) => s !== skill));
    } else {
      setSimulatedSkills([...simulatedSkills, skill]);
    }
  };

  const getMatchScore = (job) => {
    if (!analysis) return job.similarity_score || job.match_score || 0;
    
    // Calculate simulated score with added skills
    const baseScore = job.similarity_score || job.match_score || 0;
    const missingSkills = job.missing_skills || [];
    const missingSkillsLower = missingSkills.map(s => s.toLowerCase());
    
    const matchedSimulated = simulatedSkills.filter((s) =>
      missingSkillsLower.includes(s.toLowerCase())
    );
    
    if (missingSkills.length > 0 && matchedSimulated.length > 0) {
      const boost = (matchedSimulated.length / missingSkills.length) * 20;
      return Math.min(100, baseScore + boost);
    }
    return baseScore;
  };

  const renderSimulationBlock = () => {
    if (!analysis) return null;
    return (
      <div className="simulation-section" style={{ marginBottom: "2rem" }}>
        <div className="simulation-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={20} color="#a855f7" />
              What-If Skill Simulation
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Toggle your learning gaps to dynamically boost your job match score</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSimulation(!showSimulation)}
            style={{ padding: '0.4rem 0.8rem', background: "rgba(232, 82, 26, 0.08)", color: "var(--primary)", border: "1px solid rgba(232, 82, 26, 0.2)" }}
          >
            {showSimulation ? "Hide" : "Show"} Simulation
          </button>
        </div>

        {showSimulation && (
          <div className="simulation-skills" style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {analysis.skill_gaps?.map((skill, index) => (
              <label key={index} className="simulation-skill" style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", 
                background: simulatedSkills.includes(skill) ? "rgba(232, 82, 26, 0.1)" : "var(--bg-secondary)", 
                border: simulatedSkills.includes(skill) ? "1px solid var(--primary)" : "1px solid var(--border-primary)",
                borderRadius: "20px", cursor: "pointer", transition: "all 0.2s"
              }}>
                <input
                  type="checkbox"
                  checked={simulatedSkills.includes(skill)}
                  onChange={() => handleSkillSimulation(skill)}
                  style={{ accentColor: "#a855f7", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: simulatedSkills.includes(skill) ? "#fff" : "var(--text-secondary)" }}>{skill}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const skillStrengthData = analysis
    ? Object.entries(analysis.skill_strength)
        .map(([name, strength]) => ({ name, strength }))
        .sort((a, b) => b.strength - a.strength)
    : [];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Candidate Dashboard</h1>
              <p>Welcome back, {user?.name || "Candidate"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            Upload Resume
          </button>
          <button
            className={`tab ${activeTab === "skills" ? "active" : ""}`}
            onClick={() => setActiveTab("skills")}
            disabled={!analysis}
          >
            Skills Analysis
          </button>
          <button
            className={`tab ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
            disabled={recommendations.length === 0}
          >
            Job Matches
          </button>
          <button
            className={`tab ${activeTab === "live_jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("live_jobs")}
            disabled={!analysis}
          >
            Live Jobs
          </button>
          <button
            className={`tab ${activeTab === "ai_feedback" ? "active" : ""}`}
            onClick={() => setActiveTab("ai_feedback")}
            disabled={!analysis}
          >
            AI Feedback
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content">
            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-item">
                <h3>{skillProfile?.total_resumes || 0}</h3>
                <p>Resumes Uploaded</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <h3>{skillProfile?.all_skills?.length || 0}</h3>
                <p>Skills Identified</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <h3>
                  {skillProfile?.all_skills?.length > 0
                    ? Math.round(
                        Object.values(skillProfile.skill_strengths || {}).reduce(
                          (a, b) => a + b,
                          0
                        ) / Object.values(skillProfile.skill_strengths || {}).length
                      )
                    : 0}
                %
                </h3>
                <p>Avg. Skill Strength</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <h3>{recommendations.length}</h3>
                <p>Job Matches</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <div
                  className="action-card"
                  onClick={() => setActiveTab("upload")}
                >
                  <div className="action-icon">
                    <Upload size={28} />
                  </div>
                  <h3>Upload Resume</h3>
                  <p>Get AI-powered skill analysis</p>
                </div>
                <div
                  className="action-card"
                  onClick={() => analysis && setActiveTab("skills")}
                  style={{ opacity: analysis ? 1 : 0.5 }}
                >
                  <div className="action-icon">
                    <BarChart3 size={28} />
                  </div>
                  <h3>View Skills</h3>
                  <p>See your skill strengths and gaps</p>
                </div>
                <div
                  className="action-card"
                  onClick={() =>
                    recommendations.length > 0 && setActiveTab("jobs")
                  }
                  style={{ opacity: recommendations.length > 0 ? 1 : 0.5 }}
                >
                  <div className="action-icon">
                    <Briefcase size={28} />
                  </div>
                  <h3>Find Jobs</h3>
                  <p>Discover matching opportunities</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="tab-content">
            <div className="upload-section">
              <div
                className={`file-upload ${isUploading ? "uploading" : ""}`}
                onClick={() =>
                  !isUploading && document.getElementById("resume-input").click()
                }
              >
                <input
                  type="file"
                  id="resume-input"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
                <div className="upload-icon">
                  {isUploading ? (
                    <RefreshCw size={48} className="animate-spin" />
                  ) : (
                    <Upload size={48} />
                  )}
                </div>
                <h3>{isUploading ? "Analyzing Resume..." : "Upload Your Resume"}</h3>
                <p>Drag and drop your PDF resume here, or click to browse</p>
                <span className="upload-hint">Supports PDF files up to 10MB</span>
              </div>

              {uploadError && (
                <div className="upload-error">
                  <AlertCircle size={20} />
                  <span>{uploadError}</span>
                </div>
              )}

              {analysis && (
                <div className="upload-success" style={{ marginBottom: "2rem" }}>
                  <CheckCircle2 size={20} />
                  <span>Resume analyzed successfully! Found {analysis.skills?.length || 0} skills.</span>
                </div>
              )}

              {/* My Resumes List */}
              {resumesList && resumesList.length > 0 && (
                <div className="my-resumes-section" style={{ marginTop: "3rem", width: "100%", maxWidth: "800px", margin: "3rem auto 0" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--text-primary)" }}>My Previous Resumes</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[...resumesList].reverse().map((r, idx) => (
                      <div key={r.resume_id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", transition: "transform 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                          <div style={{ padding: "0.75rem", background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)", borderRadius: "var(--radius-md)" }}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", fontSize: "1.05rem" }}>{r.filename}</p>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span>{new Date(r.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{Object.keys(r.skill_strength || {}).length} Skills Extracted</span>
                              {analysis?.resume_id === r.resume_id && (
                                <span style={{ marginLeft: "0.5rem", color: "var(--primary-light)", fontSize: "0.75rem", background: "var(--bg-tertiary)", padding: "0.2rem 0.6rem", borderRadius: "10px", fontWeight: 500 }}>Active Dashboard Resume</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <button
                            onClick={() => handleDeleteResume(r.resume_id)}
                            disabled={isDeleting === r.resume_id}
                            style={{ background: "transparent", border: "none", color: "var(--error)", cursor: isDeleting === r.resume_id ? "not-allowed" : "pointer", padding: "0.75rem", borderRadius: "var(--radius-md)", opacity: isDeleting === r.resume_id ? 0.5 : 1, transition: "background 0.2s" }}
                            onMouseOver={e => !isDeleting && (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
                            onMouseOut={e => !isDeleting && (e.currentTarget.style.background = "transparent")}
                            title="Delete Resume"
                          >
                            {isDeleting === r.resume_id ? <RefreshCw size={22} className="animate-spin" /> : <Trash2 size={22} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && analysis && (
          <div className="tab-content">
            <div className="skills-grid">
              {/* Skill Pill Tags */}
              <div className="skills-card" style={{ gridColumn: '1 / -1', padding: '2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', boxShadow: 'none' }}>
                <div className="card-header" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Skill Extraction</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Categorized skills extracted from your resume</p>
                </div>
                
                <div className="skills-groups">
                  {Object.entries(groupedSkills).map(([category, skills]) => (
                    <div key={category} className="skill-group" style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        {category}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skills.map((skill, index) => {
                          const strength = analysis.skill_strength?.[skill] || 50;
                          return (
                            <span 
                              key={index} 
                              style={{ 
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                padding: '0.5rem 1rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '100px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              {skill}
                              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{strength}%</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Strength */}
              <div className="skills-card wide" style={{ 
                background: 'var(--bg-card)', 
                border: 'none', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                padding: '2rem'
              }}>
                <div className="card-header" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <BarChart3 size={24} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>Skill Strength Analysis</h3>
                </div>
                <div className="skill-bars" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {skillStrengthData.slice(0, 10).map((skill, index) => {
                    const isHigh = skill.strength > 80;
                    const isMed = skill.strength > 60;
                    
                    const barColor = isHigh 
                      ? 'linear-gradient(90deg, #0f766e, #2dd4bf)' 
                      : isMed 
                        ? 'linear-gradient(90deg, #1e3a8a, #3b82f6)' 
                        : 'linear-gradient(90deg, #4c1d95, #8b5cf6)';
                        
                    const glowColor = isHigh 
                      ? 'rgba(45, 212, 191, 0.5)' 
                      : isMed 
                        ? 'rgba(59, 130, 246, 0.5)' 
                        : 'rgba(139, 92, 246, 0.5)';

                    return (
                      <div key={index} className="premium-skill-bar" style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.5))',
                        padding: '1.25rem 1.5rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))';
                        e.currentTarget.style.transform = 'translateX(8px)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.boxShadow = `0 15px 30px rgba(0,0,0,0.4), -4px 0 0 ${isHigh ? '#2dd4bf' : isMed ? '#3b82f6' : '#8b5cf6'}`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.5))';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                          <span style={{ 
                            fontWeight: '600', 
                            color: '#f8fafc',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%',
                              background: isHigh ? '#2dd4bf' : isMed ? '#3b82f6' : '#8b5cf6',
                              boxShadow: `0 0 12px ${glowColor}`
                            }}></div>
                            {skill.name}
                          </span>
                          <span style={{ 
                            fontWeight: '700', 
                            color: isHigh ? '#2dd4bf' : isMed ? '#38bdf8' : '#a78bfa',
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            letterSpacing: '1px',
                            textShadow: `0 0 10px ${glowColor}`
                          }}>
                            {skill.strength}%
                          </span>
                        </div>
                        
                        <div style={{ 
                          height: '8px', 
                          background: 'rgba(0,0,0,0.5)', 
                          borderRadius: '4px',
                          overflow: 'hidden',
                          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)',
                          position: 'relative'
                        }}>
                          <div style={{ 
                            width: `${skill.strength}%`, 
                            height: '100%',
                            background: barColor,
                            borderRadius: '4px',
                            boxShadow: `0 0 15px ${glowColor}`,
                            position: 'relative',
                            transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
                          }}>
                            {/* Glowing leading edge */}
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: '30px',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9))',
                              borderRadius: '0 4px 4px 0'
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="skills-card" style={{ 
                background: 'var(--bg-card)', 
                border: 'none', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                padding: '2rem'
              }}>
                <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <AlertCircle size={24} color="#f43f5e" style={{ filter: 'drop-shadow(0 0 8px rgba(244,63,94,0.5))' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>Skill Gaps</h3>
                </div>
                <p className="card-description" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Critical technical missing dependencies holding back your primary domains
                </p>
                <div className="skills-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {analysis.skill_gaps.map((gap, index) => (
                    <span key={index} className="premium-gap-tag" style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#fecdd3',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 15px rgba(244, 63, 94, 0.15)',
                      textTransform: 'capitalize',
                      transition: 'all 0.3s ease',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.3)';
                      e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 63, 94, 0.15)';
                      e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                    }}>
                      {gap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Path */}
              <div className="skills-card wide" style={{ 
                background: 'var(--bg-card)', 
                border: 'none', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                padding: '2rem'
              }}>
                <div className="card-header" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <BookOpen size={24} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>Recommended Tech Tree</h3>
                </div>
                
                <div className="premium-learning-path" style={{ position: 'relative', paddingLeft: '24px' }}>
                  {/* Vertical glowing line connecting nodes */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    bottom: '30px',
                    left: '24px',
                    width: '3px',
                    background: 'linear-gradient(180deg, #8b5cf6, rgba(139, 92, 246, 0.1))',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px'
                  }}></div>

                  {analysis.learning_path.slice(0, 8).map((skill, index) => (
                    <div key={index} className="premium-learning-step" style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateX(8px)';
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      {/* Connected Timeline Node Bulb */}
                      <div className="step-number" style={{
                        position: 'absolute',
                        left: '-24px',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        background: '#0f172a',
                        border: '2px solid #a855f7',
                        color: '#ddd6fe',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: '0 0 15px rgba(168, 85, 247, 0.8), inset 0 0 5px rgba(168, 85, 247, 0.5)',
                        zIndex: 2,
                        transition: 'all 0.3s ease'
                      }}>
                        {index + 1}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="step-skill" style={{
                          color: '#f8fafc',
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          textShadow: '0 0 8px rgba(139, 92, 246, 0.3)'
                        }}>
                          {skill}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '6px', letterSpacing: '0.5px' }}>
                          Priority Sequence • {index === 0 ? 'Urgent Need' : index < 3 ? 'High Priority' : 'Progressive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="tab-content">
            {/* Skill Simulation */}
            {/* Skill Simulation */}
            {renderSimulationBlock()}

            {/* Job Listings */}
            <div className="jobs-list">
              {recommendations.map((job, index) => {
                const score = getMatchScore(job);
                return (
                  <div key={index} className="job-card">
                    <div className="job-header">
                      <div className="job-title-section">
                        <h3>{job.title}</h3>
                        <p>{job.company}</p>
                      </div>
                      <div
                        className={`match-score ${
                          score > 70 ? "high" : score > 40 ? "medium" : "low"
                        }`}
                      >
                        <span className="score-value">{score.toFixed(1)}%</span>
                        <span className="score-label">Match</span>
                      </div>
                    </div>

                    <p className="job-description">{job.description}</p>

                    <div className="job-skills">
                      <div className="skills-section">
                        <span className="section-label">Matched Skills</span>
                        <div className="skills-list">
                          {job.matched_skills?.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="skill-tag matched">
                              <CheckCircle2 size={12} />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {job.missing_skills?.length > 0 && (
                        <div className="skills-section">
                          <span className="section-label">Missing Skills</span>
                          <div className="skills-list">
                            {job.missing_skills?.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className={`skill-tag missing ${
                                  simulatedSkills.includes(skill) ? "simulated" : ""
                                }`}
                              >
                                <AlertCircle size={12} />
                                {skill}
                                {simulatedSkills.includes(skill) && (
                                  <span className="simulated-badge">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="job-actions" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                      {analysis?.applied_jobs?.includes(job.job_id) ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Status:</span>
                            {(() => {
                              const status = analysis?.application_status?.[job.job_id] || "pending";
                              let color = "var(--text-secondary)";
                              if (status === "accepted") color = "var(--success)";
                              else if (status === "rejected") color = "var(--error)";
                              else if (status === "shortlisted") color = "var(--warning)";
                              
                              return (
                                <span style={{ fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "12px", border: `1px solid ${color}`, color: color, background: `${color}20` }}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              );
                            })()}
                          </div>
                          
                          {(!analysis?.application_status?.[job.job_id] || analysis.application_status[job.job_id] === "pending") && (
                            <button 
                              onClick={() => handleWithdrawFromJob(job.job_id)}
                              style={{ padding: "0.5rem 1rem", background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }}
                            >
                              <X size={16} /> Withdraw Application
                            </button>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApplyToJob(job.job_id)}
                          style={{ padding: "0.5rem 1.5rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s", fontWeight: 600, boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)" }}
                        >
                          <Briefcase size={16} /> Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Jobs Tab */}
        {activeTab === "live_jobs" && (
          <div className="tab-content">
            {!analysis ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0' }}>
                <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                <h3>Upload your resume first to see live job matches</h3>
              </div>
            ) : (
              <div className="live-jobs-container">
                {renderSimulationBlock()}
                <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <div className="filter-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Job market</label>
                    <select
                      value={liveJobsLocation}
                      onChange={(e) => setLiveJobsLocation(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      <option value="in">India</option>
                      <option value="us">United States</option>
                      <option value="gb">United Kingdom</option>
                      <option value="au">Australia</option>
                      <option value="ca">Canada</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={fetchLiveJobs}
                    disabled={isFetchingLiveJobs}
                    style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isFetchingLiveJobs ? 'not-allowed' : 'pointer' }}
                  >
                    {isFetchingLiveJobs ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
                    Fetch Live Jobs
                  </button>
                  
                  {liveJobs.length > 0 && (
                    <div className="filter-group" style={{ marginLeft: 'auto' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Sort by</label>
                      <select
                        value={liveJobsSort}
                        onChange={(e) => setLiveJobsSort(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      >
                        <option value="match">Best match</option>
                        <option value="salary">Salary</option>
                      </select>
                    </div>
                  )}
                </div>

                {isFetchingLiveJobs && (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                    <p>Searching Adzuna, Remotive, Himalayas & more...</p>
                  </div>
                )}

                {liveJobsError && !isFetchingLiveJobs && (
                  <div className="upload-error">
                    <AlertCircle size={20} />
                    <span>{liveJobsError}</span>
                  </div>
                )}

                {hasSearchedLiveJobs && !isFetchingLiveJobs && !liveJobsError && liveJobs.length === 0 && (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                    <p>No jobs found for your skills. Try a different location.</p>
                  </div>
                )}

                {liveJobs.length > 0 && !isFetchingLiveJobs && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                        Found {liveJobs.length} jobs across {liveJobsSources.length} sources
                      </h3>
                      {liveJobsSources.map(source => (
                        <span key={source} style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                          {source} {liveJobs.filter(j => j.source === source).length}
                        </span>
                      ))}
                      {liveJobsCached && (
                        <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                          Cached result
                        </span>
                      )}
                    </div>

                    <div className="live-jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                      {[...liveJobs]
                        .sort((a, b) => {
                          if (liveJobsSort === 'match') return (getMatchScore(b) || 0) - (getMatchScore(a) || 0);
                          return b.salary.localeCompare(a.salary); 
                        })
                        .map((job, idx) => (
                        <div key={idx} className="job-card" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div className="job-header" style={{ marginBottom: '1rem' }}>
                            <div className="job-title-section" style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{job.title}</h3>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                {job.company} • {job.location || 'Remote'}
                              </p>
                            </div>
                            <div className={`match-score ${getMatchScore(job) > 70 ? 'high' : getMatchScore(job) > 40 ? 'medium' : 'low'}`}>
                              <span className="score-value">{getMatchScore(job)?.toFixed(1) || 0}%</span>
                              <span className="score-label">Match</span>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '1rem', flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {job.description.length > 120 ? job.description.substring(0, 120) + '...' : job.description}
                            </p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                              {job.matched_skills?.slice(0, 5).map((s, i) => (
                                <span key={i} className="skill-tag matched" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                  <CheckCircle2 size={12} /> {s}
                                </span>
                              ))}
                              {job.matched_skills?.length > 5 && (
                                <span className="skill-tag" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                  +{job.matched_skills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {job.salary && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--success)' }}>{job.salary}</span>}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>via {job.source}</span>
                            </div>
                            
                            <a 
                              href={job.url} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                              onMouseOver={e => Object.assign(e.currentTarget.style, { background: 'var(--primary)', color: 'white' })}
                              onMouseOut={e => Object.assign(e.currentTarget.style, { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' })}
                            >
                              Apply Now <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Feedback Tab */}
        {activeTab === "ai_feedback" && analysis && (
          <div className="tab-content">
            <ResumeFeedback
              resumeId={analysis.resume_id}
              jobs={recommendations}
            />
          </div>
        )}
      </div>

      <style>{`
        .dashboard {
          min-height: calc(100vh - 72px);
          background: var(--bg-primary);
        }

        .dashboard-header {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-primary);
          padding: var(--space-2xl) 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: var(--space-xs);
        }

        .header-content p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Tabs */
        .dashboard-tabs {
          display: flex;
          padding: var(--space-lg) 0;
          border-bottom: 1px solid var(--border-primary);
          margin-bottom: var(--space-xl);
          overflow-x: auto;
        }

        .tab {
          padding: var(--space-sm) 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          margin-right: var(--space-2xl);
        }

        .tab:hover:not(:disabled) {
          color: var(--text-primary);
        }

        .tab.active {
          color: var(--lilac-dark);
          border-bottom-color: var(--lilac);
        }

        .tab:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Tab Content */
        .tab-content {
          padding-bottom: var(--space-3xl);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-2xl);
        }

        /* Stats Row */
        .stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          margin-bottom: var(--space-3xl);
          box-shadow: var(--shadow-md);
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-item h3 {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: var(--space-xs);
          letter-spacing: -0.03em;
        }

        .stat-item p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          margin: 0;
        }

        .stat-divider {
          width: 1px;
          height: 60px;
          background: var(--border-primary);
        }

        /* Quick Actions */
        .quick-actions {
          margin-top: var(--space-2xl);
        }

        .quick-actions h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }

        .action-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-card:hover {
          border-color: rgba(255,255,255,0.2);
          background: var(--bg-secondary);
        }

        .action-icon {
          color: var(--primary);
          margin-bottom: var(--space-md);
        }

        .action-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
          color: var(--text-primary);
        }

        .action-card p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Upload Section */
        .upload-section {
          max-width: 600px;
          margin: 0 auto;
        }

        .file-upload {
          border: 2px dashed var(--border-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-3xl);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .file-upload:hover:not(.uploading) {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .file-upload.uploading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .upload-icon {
          width: 80px;
          height: 80px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin: 0 auto var(--space-lg);
        }

        .file-upload h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .file-upload p {
          color: var(--text-secondary);
          margin-bottom: var(--space-sm);
        }

        .upload-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .upload-error {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-top: var(--space-lg);
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          color: var(--error);
        }

        .upload-success {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-top: var(--space-lg);
          padding: var(--space-md);
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: var(--radius-lg);
          color: var(--success);
        }

        /* Skills Grid */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
        }

        .skills-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .skills-card.wide {
          grid-column: span 2;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }

        .card-header svg {
          color: var(--primary);
        }

        .card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .card-description {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: var(--space-md);
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .skill-bar-item {
          margin-bottom: var(--space-md);
        }

        .skill-bar-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-xs);
        }

        .skill-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .skill-score {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-light);
        }

        .learning-path {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .learning-step {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .step-number {
          width: 28px;
          height: 28px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        .step-skill {
          font-size: 0.875rem;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        /* Simulation Section */
        .simulation-section {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .simulation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .simulation-header h3 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .simulation-header p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .simulation-skills {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-primary);
        }

        .simulation-skill {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .simulation-skill:hover {
          border-color: var(--primary);
        }

        .simulation-skill input {
          accent-color: var(--primary);
        }

        .simulation-skill span {
          font-size: 0.875rem;
        }

        /* Jobs List */
        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .job-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          transition: all var(--transition-fast);
        }

        .job-card:hover {
          border-color: var(--border-secondary);
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .job-title-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .job-title-section p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .match-score {
          text-align: center;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-lg);
          min-width: 80px;
        }

        .match-score.high {
          background: rgba(34, 197, 94, 0.15);
        }

        .match-score.medium {
          background: rgba(245, 158, 11, 0.15);
        }

        .match-score.low {
          background: rgba(239, 68, 68, 0.15);
        }

        .score-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .match-score.high .score-value {
          color: var(--success);
        }

        .match-score.medium .score-value {
          color: var(--warning);
        }

        .match-score.low .score-value {
          color: var(--error);
        }

        .score-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .job-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-skills {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .skills-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .simulated-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: var(--success);
          border-radius: 50%;
          font-size: 0.625rem;
          font-weight: 700;
          color: white;
          margin-left: var(--space-xs);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: var(--space-md);
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .skills-grid {
            grid-template-columns: 1fr;
          }

          .skills-card.wide {
            grid-column: span 1;
          }

          .simulation-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .job-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .match-score {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateDashboard;
