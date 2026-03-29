import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Users,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Brain,
  Zap,
  Sparkles,
  MapPin,
  Clock,
  Building2,
  ChevronRight,
  Filter,
  Search,
  X,
  Award,
  Cpu,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { jobsAPI } from "../services/api";

// ✅ FIXED: Removed aiAPI import — those endpoints don't exist in backend.
// All candidate ranking now uses jobsAPI.getCandidates() which works correctly.

const RecruiterDashboard = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    job_type: "full-time",
    experience_required: "",
  });



  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getAll();
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchCandidates = async (jobId) => {
    setIsLoading(true);
    try {
      const response = await jobsAPI.getCandidates(jobId);
      setCandidates(response.data.candidates || []);
      setSelectedJob(jobs.find((j) => j.job_id === jobId));
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await jobsAPI.create(jobForm, user.id);
      setShowCreateJob(false);
      setJobForm({
        title: "",
        company: "",
        description: "",
        location: "",
        job_type: "full-time",
        experience_required: "",
      });
      fetchJobs();
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setIsLoading(false);
    }
  };



  const getScoreColor = (score) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--warning)";
    return "var(--error)";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "rgba(34, 197, 94, 0.15)";
    if (score >= 60) return "rgba(245, 158, 11, 0.15)";
    return "rgba(239, 68, 68, 0.15)";
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Recruiter Dashboard</h1>
              <p>Welcome back, {user?.name || "Recruiter"}</p>
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
            className={`tab ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            <Briefcase size={18} />
            Job Postings
          </button>
          <button
            className={`tab ${activeTab === "candidates" ? "active" : ""}`}
            onClick={() => setActiveTab("candidates")}
            disabled={!selectedJob}
          >
            <Users size={18} />
            Candidates
          </button>
        </div>

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="tab-content">
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Briefcase size={24} />
                </div>
                <div className="stat-info">
                  <h3>{jobs.length}</h3>
                  <p>Active Jobs</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>{candidates.length}</h3>
                  <p>Total Candidates</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <h3>
                    {candidates.length > 0
                      ? (
                          candidates.reduce((acc, c) => acc + c.similarity_score, 0) /
                          candidates.length
                        ).toFixed(1)
                      : 0}
                    %
                  </h3>
                  <p>Avg. Match Score</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">
                  <Brain size={24} />
                </div>
                <div className="stat-info">
                  <h3>1</h3>
                  <p>AI Model (BERT)</p>
                </div>
              </div>
            </div>

            {/* Create Job Button */}
            <div className="section-header">
              <h2>Your Job Postings</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateJob(true)}
              >
                <Plus size={18} />
                Create Job
              </button>
            </div>

            {/* Create Job Modal */}
            {showCreateJob && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Create New Job Posting</h3>
                    <button
                      className="modal-close"
                      onClick={() => setShowCreateJob(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateJob} className="modal-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., Senior Software Engineer"
                          value={jobForm.title}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Company</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., Tech Corp"
                          value={jobForm.company}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, company: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe the role, responsibilities, and required skills..."
                        value={jobForm.description}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, description: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., New York, NY"
                          value={jobForm.location}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, location: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Job Type</label>
                        <select
                          className="form-select"
                          value={jobForm.job_type}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, job_type: e.target.value })
                          }
                        >
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience Required</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 3-5 years"
                        value={jobForm.experience_required}
                        onChange={(e) =>
                          setJobForm({
                            ...jobForm,
                            experience_required: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowCreateJob(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner"></span>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            Create Job
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Jobs List */}
            <div className="jobs-grid">
              {jobs.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={48} />
                  <h3>No Job Postings Yet</h3>
                  <p>Create your first job posting to start finding candidates</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className={`job-card ${selectedJob?.job_id === job.job_id ? "selected" : ""}`}
                    onClick={() => {
                      fetchCandidates(job.job_id);
                      setActiveTab("candidates");
                    }}
                  >
                    <div className="job-card-header">
                      <div className="job-info">
                        <h3>{job.title}</h3>
                        <div className="job-meta">
                          <span>
                            <Building2 size={14} />
                            {job.company}
                          </span>
                          {job.location && (
                            <span>
                              <MapPin size={14} />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} className="job-arrow" />
                    </div>
                    <p className="job-description">{job.description}</p>
                    <div className="job-footer">
                      <div className="job-tags">
                        <span className="job-tag">{job.job_type || "full-time"}</span>
                        {job.experience_required && (
                          <span className="job-tag">
                            <Clock size={12} />
                            {job.experience_required}
                          </span>
                        )}
                      </div>
                      <div className="job-skills-preview">
                        {job.required_skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-mini">
                            {skill}
                          </span>
                        ))}
                        {job.required_skills?.length > 3 && (
                          <span className="skill-mini more">
                            +{job.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === "candidates" && selectedJob && (
          <div className="tab-content">

            {/* Candidates List */}
            <div className="section-header">
              <h2>
                Matched Candidates
                <span className="candidate-count">({candidates.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Analyzing candidates with BERT...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Candidates Found</h3>
                <p>No resumes have been uploaded yet that match this job</p>
              </div>
            ) : (
              <div className="candidates-list">
                {candidates.map((candidate, index) => (
                  <div key={index} className="candidate-card">
                    <div className="candidate-rank">#{index + 1}</div>
                    <div className="candidate-avatar">
                      {candidate.filename?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="candidate-info">
                      <h4>Candidate #{candidate.resume_id}</h4>
                      <p>{candidate.filename}</p>
                    </div>
                    <div className="candidate-score">
                      <div
                        className="score-circle"
                        style={{
                          background: getScoreBg(candidate.similarity_score),
                          color: getScoreColor(candidate.similarity_score),
                        }}
                      >
                        <span>{candidate.similarity_score?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="candidate-skills">
                      <div className="skills-matched">
                        <span className="skills-label">Matched</span>
                        <div className="skills-tags">
                          {candidate.matched_skills?.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="skill-tag matched">
                              {skill}
                            </span>
                          ))}
                          {candidate.matched_skills?.length > 4 && (
                            <span className="skill-tag more">
                              +{candidate.matched_skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      {candidate.missing_skills?.length > 0 && (
                        <div className="skills-missing">
                          <span className="skills-label">Missing</span>
                          <div className="skills-tags">
                            {candidate.missing_skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="skill-tag missing">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx="true">{`
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

        .tab-content {
          padding-bottom: var(--space-3xl);
        }

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

        .stat-icon.blue { background: rgba(59, 130, 246, 0.15); color: var(--primary); }
        .stat-icon.purple { background: rgba(168, 85, 247, 0.15); color: var(--secondary); }
        .stat-icon.green { background: rgba(34, 197, 94, 0.15); color: var(--success); }
        .stat-icon.orange { background: rgba(245, 158, 11, 0.15); color: var(--warning); }

        .stat-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .candidate-count {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 400;
          margin-left: var(--space-sm);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border-primary);
        }

        .modal-header h3 { font-size: 1.125rem; font-weight: 600; }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .modal-close:hover { background: var(--bg-tertiary); color: var(--text-primary); }

        .modal-form {
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .modal-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: flex-end;
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-primary);
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
        }

        .job-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .job-card:hover { border-color: var(--primary); box-shadow: var(--shadow-glow); }
        .job-card.selected { border-color: var(--primary); background: rgba(59, 130, 246, 0.05); }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .job-info h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-xs); }

        .job-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .job-meta span { display: flex; align-items: center; gap: var(--space-xs); }

        .job-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .job-card:hover .job-arrow { transform: translateX(4px); color: var(--primary); }

        .job-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-footer { display: flex; justify-content: space-between; align-items: center; }
        .job-tags { display: flex; gap: var(--space-sm); }

        .job-tag {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .job-skills-preview { display: flex; gap: var(--space-xs); }

        .skill-mini {
          padding: 2px 8px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: var(--radius-full);
          font-size: 0.625rem;
          color: var(--primary-light);
        }

        .skill-mini.more { background: var(--bg-tertiary); color: var(--text-muted); }

        .model-selection { margin-bottom: var(--space-xl); }
        .model-selection h3 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-md); }

        .model-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
        }

        .model-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--bg-card);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .model-card:hover:not(:disabled) { border-color: var(--border-secondary); }
        .model-card.active { border-color: var(--primary); background: rgba(59, 130, 246, 0.05); }
        .model-card:disabled { opacity: 0.5; cursor: not-allowed; }

        .model-icon {
          width: 48px;
          height: 48px;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .model-info h4 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-xs); }
        .model-info p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
        .model-active { margin-left: auto; color: var(--success); }
        .compare-section { margin-bottom: var(--space-xl); }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-3xl);
          color: var(--text-secondary);
        }

        .candidates-list { display: flex; flex-direction: column; gap: var(--space-md); }

        .candidate-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .candidate-rank {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .candidate-avatar {
          width: 48px;
          height: 48px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-light);
          flex-shrink: 0;
        }

        .candidate-info { flex: 1; min-width: 0; }
        .candidate-info h4 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-xs); }
        .candidate-info p { font-size: 0.875rem; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .candidate-score { flex-shrink: 0; }

        .score-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-circle span { font-size: 0.875rem; font-weight: 700; }

        .candidate-skills {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          min-width: 200px;
        }

        .skills-matched, .skills-missing { display: flex; flex-direction: column; gap: var(--space-xs); }
        .skills-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .skills-tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); }

        .comparison-header { margin-bottom: var(--space-xl); }
        .comparison-header h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-xs); }
        .comparison-header p { color: var(--text-secondary); }

        .comparison-table {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: var(--space-xl);
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          align-items: center;
        }

        .table-header {
          background: var(--bg-tertiary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .table-row { border-top: 1px solid var(--border-primary); }
        .candidate-cell { font-weight: 600; }
        .score-cell { display: flex; justify-content: center; }

        .score-badge {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .model-insights { margin-top: var(--space-2xl); }
        .model-insights h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-lg); }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }

        .insight-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          text-align: center;
        }

        .insight-card svg { color: var(--primary); margin-bottom: var(--space-md); }
        .insight-card h4 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-xs); }
        .insight-card p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-3xl);
          color: var(--text-muted);
          text-align: center;
        }

        .empty-state svg { opacity: 0.5; }
        .empty-state h3 { color: var(--text-secondary); }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .jobs-grid { grid-template-columns: 1fr; }
          .model-cards { grid-template-columns: 1fr; }
          .candidate-card { flex-wrap: wrap; }
          .candidate-skills { width: 100%; min-width: auto; }
          .table-header, .table-row { grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
          .table-cell:nth-child(4), .table-cell:nth-child(5) { display: none; }
          .insights-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .header-content { flex-direction: column; gap: var(--space-md); text-align: center; }
          .stats-grid { grid-template-columns: 1fr; }
          .section-header { flex-direction: column; gap: var(--space-md); }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
export default RecruiterDashboard;