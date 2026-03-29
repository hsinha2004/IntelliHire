import React, { useState, useEffect } from "react";
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

  const handleSkillSimulation = (skill) => {
    if (simulatedSkills.includes(skill)) {
      setSimulatedSkills(simulatedSkills.filter((s) => s !== skill));
    } else {
      setSimulatedSkills([...simulatedSkills, skill]);
    }
  };

  const getMatchScore = (job) => {
    if (!analysis) return job.similarity_score || 0;
    
    // Calculate simulated score with added skills
    const baseScore = job.similarity_score || 0;
    const missingSkills = job.missing_skills || [];
    const matchedSimulated = simulatedSkills.filter((s) =>
      missingSkills.includes(s.toLowerCase())
    );
    
    if (missingSkills.length > 0 && matchedSimulated.length > 0) {
      const boost = (matchedSimulated.length / missingSkills.length) * 20;
      return Math.min(100, baseScore + boost);
    }
    return baseScore;
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
            <div className="header-badge">
              <Sparkles size={16} />
              <span>AI Powered</span>
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
            <TrendingUp size={18} />
            Overview
          </button>
          <button
            className={`tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload size={18} />
            Upload Resume
          </button>
          <button
            className={`tab ${activeTab === "skills" ? "active" : ""}`}
            onClick={() => setActiveTab("skills")}
            disabled={!analysis}
          >
            <Brain size={18} />
            Skills Analysis
          </button>
          <button
            className={`tab ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
            disabled={recommendations.length === 0}
          >
            <Briefcase size={18} />
            Job Matches
          </button>
          <button
            className={`tab ${activeTab === "live_jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("live_jobs")}
            disabled={!analysis}
          >
            <Globe size={18} />
            Live Jobs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <FileText size={24} />
                </div>
                <div className="stat-info">
                  <h3>{skillProfile?.total_resumes || 0}</h3>
                  <p>Resumes Uploaded</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <Award size={24} />
                </div>
                <div className="stat-info">
                  <h3>{skillProfile?.all_skills?.length || 0}</h3>
                  <p>Skills Identified</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  <Target size={24} />
                </div>
                <div className="stat-info">
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
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">
                  <Briefcase size={24} />
                </div>
                <div className="stat-info">
                  <h3>{recommendations.length}</h3>
                  <p>Job Matches</p>
                </div>
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
              {/* Extracted Skills */}
              <div className="skills-card">
                <div className="card-header">
                  <Brain size={20} />
                  <h3>Extracted Skills</h3>
                </div>
                <div className="skills-list">
                  {analysis.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Strength */}
              <div className="skills-card wide">
                <div className="card-header">
                  <BarChart3 size={20} />
                  <h3>Skill Strength Analysis</h3>
                </div>
                <div className="skill-bars">
                  {skillStrengthData.slice(0, 10).map((skill, index) => (
                    <div key={index} className="skill-bar-item">
                      <div className="skill-bar-header">
                        <span className="skill-name">{skill.name}</span>
                        <span className="skill-score">{skill.strength}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${skill.strength}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="skills-card">
                <div className="card-header">
                  <AlertCircle size={20} />
                  <h3>Skill Gaps</h3>
                </div>
                <p className="card-description">
                  Skills you may want to develop for better opportunities
                </p>
                <div className="skills-list">
                  {analysis.skill_gaps.map((gap, index) => (
                    <span key={index} className="skill-tag missing">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Path */}
              <div className="skills-card wide">
                <div className="card-header">
                  <BookOpen size={20} />
                  <h3>Recommended Learning Path</h3>
                </div>
                <div className="learning-path">
                  {analysis.learning_path.slice(0, 8).map((skill, index) => (
                    <div key={index} className="learning-step">
                      <div className="step-number">{index + 1}</div>
                      <span className="step-skill">{skill}</span>
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
            <div className="simulation-section">
              <div className="simulation-header">
                <div>
                  <h3>
                    <Lightbulb size={20} />
                    What-If Skill Simulation
                  </h3>
                  <p>Toggle skills to see how they affect your job match scores</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSimulation(!showSimulation)}
                >
                  {showSimulation ? "Hide" : "Show"} Simulation
                </button>
              </div>

              {showSimulation && analysis && (
                <div className="simulation-skills">
                  {analysis.skill_gaps.map((skill, index) => (
                    <label key={index} className="simulation-skill">
                      <input
                        type="checkbox"
                        checked={simulatedSkills.includes(skill)}
                        onChange={() => handleSkillSimulation(skill)}
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

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
                <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
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
                          if (liveJobsSort === 'match') return (b.match_score || 0) - (a.match_score || 0);
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
                            <div className={`match-score ${job.match_score > 70 ? 'high' : job.match_score > 40 ? 'medium' : 'low'}`}>
                              <span className="score-value">{job.match_score?.toFixed(1) || 0}%</span>
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
      </div>

      <style jsx>{`
        .dashboard {
          min-height: calc(100vh - 72px);
          background: var(--bg-primary);
        }

        .dashboard-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          padding: var(--space-xl) 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .header-content p {
          color: var(--text-secondary);
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: var(--radius-full);
          color: var(--secondary-light);
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Tabs */
        .dashboard-tabs {
          display: flex;
          gap: var(--space-xs);
          padding: var(--space-lg) 0;
          border-bottom: 1px solid var(--border-primary);
          margin-bottom: var(--space-xl);
          overflow-x: auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .tab.active {
          color: var(--primary-light);
          background: rgba(59, 130, 246, 0.15);
        }

        .tab:disabled {
          opacity: 0.5;
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

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue {
          background: rgba(59, 130, 246, 0.15);
          color: var(--primary);
        }

        .stat-icon.purple {
          background: rgba(168, 85, 247, 0.15);
          color: var(--secondary);
        }

        .stat-icon.green {
          background: rgba(34, 197, 94, 0.15);
          color: var(--success);
        }

        .stat-icon.orange {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning);
        }

        .stat-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
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
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .action-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }

        .action-icon {
          width: 56px;
          height: 56px;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: var(--space-md);
        }

        .action-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .action-card p {
          font-size: 0.875rem;
          color: var(--text-muted);
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
