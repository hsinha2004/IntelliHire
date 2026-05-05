import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  motion, 
  AnimatePresence, 
  LayoutGroup,
  useInView 
} from "framer-motion";
import {
  springs,
  easing,
  viewport,
  fadeUp,
  fadeIn,
  staggerContainer,
  staggerItem,
  cardHover,
  cardHoverSubtle,
  pageVariants,
  scalePop
} from "../lib/motion";
import { FloatingHint } from "../components/FloatingHint";
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
  Edit,
  Trash2,
  Award,
  Cpu,
  Activity,
  ArrowUpRight,
  Upload,
  ArrowDownRight,
  Minus,
  FileText,
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { jobsAPI, aiAPI, resumeAPI } from "../services/api";
import "../Dashboard.css";

function useCountUp(to, duration = 1.2, delay = 0, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const startDelay = delay * 1000;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp + startDelay;
      if (timestamp < startTime) { requestAnimationFrame(step); return; }
      const elapsed = (timestamp - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration, delay]);
  return count;
}

const AnimatedScore = ({ value, delay }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, 1.0, delay, inView);
  return <span ref={ref}>{count.toFixed(1)}</span>;
};

const AnimatedStat = ({ value, duration = 1.2, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, duration, delay, inView);
  return <h3 ref={ref}>{count}</h3>;
};

const RecruiterDashboard = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editJobForm, setEditJobForm] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    job_type: "full-time",
    experience_required: "",
  });
  const [selectedModel, setSelectedModel] = useState("bert");
  const [modelComparison, setModelComparison] = useState(null);
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

  const aiModels = [
    { id: "bert", name: "BERT", description: "Deep learning model for semantic understanding", icon: Brain },
    { id: "tfidf", name: "TF-IDF", description: "Traditional statistical approach", icon: Activity },
    { id: "xgboost", name: "XGBoost", description: "Gradient boosting for ranking", icon: Cpu },
  ];

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchJobs(parsedUser.id);
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "comparison" && selectedJob) {
      if (!modelComparison || modelComparison.jobId !== selectedJob.job_id) {
        setIsLoading(true);
        aiAPI.compareModels(selectedJob.job_id).then(res => {
          setModelComparison({ ...res.data, jobId: selectedJob.job_id });
          setIsLoading(false);
        }).catch(err => {
          console.error(err);
          setIsLoading(false);
        });
      }
    }
  }, [activeTab, selectedJob, modelComparison]);

  const fetchJobs = async (userId) => {
    try {
      const currentUserId = userId || user?.id;
      if (!currentUserId) return;
      const response = await jobsAPI.getAll(currentUserId);
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchCandidates = async (jobId) => {
    setIsLoading(true);
    try {
      const response = await jobsAPI.getCandidates(jobId);
      setCandidates(response.data.candidates);
      setSelectedJob(jobs.find((j) => j.job_id === jobId));
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (resumeId, status) => {
    try {
      await jobsAPI.updateCandidateStatus(selectedJob.job_id, resumeId, status);
      setCandidates(candidates.map(c => 
        c.resume_id === resumeId ? { ...c, status } : c
      ));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case "accepted": return "var(--success)";
      case "rejected": return "var(--error)";
      case "shortlisted": return "var(--warning)";
      default: return "var(--text-secondary)";
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

  const handleEditJobClick = (e, job) => {
    e.stopPropagation();
    setEditingJobId(job.job_id);
    setEditJobForm({
      title: job.title || "",
      company: job.company || "",
      description: job.description || "",
      location: job.location || "",
      job_type: job.job_type || "full-time",
      experience_required: job.experience_required || "",
    });
    setShowEditJob(true);
  };

  const submitEditJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await jobsAPI.update(editingJobId, editJobForm);
      setShowEditJob(false);
      setEditingJobId(null);
      fetchJobs();
      if (selectedJob?.job_id === editingJobId) {
        const updated = await jobsAPI.getById(editingJobId);
        setSelectedJob(updated.data);
      }
    } catch (error) {
      console.error("Error updating job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (e, jobId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this job?")) {
      setIsLoading(true);
      try {
        await jobsAPI.delete(jobId);
        if (selectedJob?.job_id === jobId) {
          setSelectedJob(null);
          setCandidates([]);
        }
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const rankCandidates = async (jobId, model) => {
    setIsLoading(true);
    setSelectedModel(model);
    try {
      const response = await aiAPI.rankCandidates(jobId, model);
      setCandidates(response.data.candidates);
    } catch (error) {
      console.error("Error ranking candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      await jobsAPI.uploadCandidates(selectedJob.job_id, files);
      await fetchCandidates(selectedJob.job_id);
      alert(`Successfully uploaded and analyzed ${files.length} candidate(s)!`);
    } catch (error) {
      console.error("Error batch uploading candidates:", error);
      alert("Failed to upload candidates. Please try again.");
    } finally {
      setIsLoading(false);
      e.target.value = null; // Reset input
    }
  };

  const compareModels = async (jobId) => {
    setIsLoading(true);
    try {
      const response = await aiAPI.compareModels(jobId);
      setModelComparison({ ...response.data, jobId });
      setActiveTab("comparison");
    } catch (error) {
      console.error("Error comparing models:", error);
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

  const avgMatchScoreNum = candidates.length > 0 
    ? parseFloat((candidates.reduce((acc, c) => acc + c.similarity_score, 0) / candidates.length).toFixed(1))
    : 0;

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <h1>Recruiter Dashboard</h1>
              <p>Welcome back, {user?.name || "Recruiter"}</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="dashboard-tabs">
          <LayoutGroup>
            {[
              { id: "jobs", label: "Job Postings", disabled: false },
              { id: "candidates", label: "Candidates", disabled: false },
              { id: "comparison", label: "Model Comparison", disabled: false }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.disabled}
                style={{ position: "relative" }}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="recruiterActiveTabPill"
                    style={{
                      position: "absolute", inset: 0,
                      background: "rgba(232,82,26,0.08)",
                      borderRadius: "8px",
                      border: "1px solid rgba(232,82,26,0.2)",
                      zIndex: 0
                    }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  />
                )}
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="recruiterActiveTabLine"
                    style={{
                      position: "absolute", bottom: -1,
                      left: "10%", width: "80%", height: "2px",
                      background: "linear-gradient(90deg, #E8521A, #9b8ec4)",
                      borderRadius: "2px", zIndex: 1
                    }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {tab.label}
                </span>
              </button>
            ))}
          </LayoutGroup>
        </div>

        <AnimatePresence mode="wait">

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <motion.div 
            key="jobs"
            className="tab-content"
            variants={pageVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Stats Row */}
            <motion.div 
              className="stats-row"
              variants={staggerContainer(0.1, 0.10)}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              key={activeTab}
            >
              <motion.div className="stat-item" variants={staggerItem} whileHover={cardHoverSubtle} style={{ cursor: "default" }}>
                <AnimatedStat value={jobs.length} delay={0} />
                <p>Active Jobs</p>
              </motion.div>
              <div className="stat-divider"></div>
              <motion.div className="stat-item" variants={staggerItem} whileHover={cardHoverSubtle} style={{ cursor: "default" }}>
                <AnimatedStat value={jobs.reduce((acc, j) => acc + (j.candidates_count || 0), 0)} delay={0.1} />
                <p>Total Candidates</p>
              </motion.div>
              <div className="stat-divider"></div>
              <motion.div className="stat-item" variants={staggerItem} whileHover={cardHoverSubtle} style={{ cursor: "default" }}>
                {candidates.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatedStat value={avgMatchScoreNum} delay={0.2} />
                    <h3 style={{ marginLeft: 2 }}>%</h3>
                  </div>
                ) : (
                  <h3>N/A</h3>
                )}
                <p>Avg. Match Score</p>
              </motion.div>
              <div className="stat-divider"></div>
              <motion.div className="stat-item" variants={staggerItem} whileHover={cardHoverSubtle} style={{ cursor: "default" }}>
                <AnimatedStat value={3} delay={0.3} />
                <p>AI Models</p>
              </motion.div>
            </motion.div>

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
            <AnimatePresence>
              {showCreateJob && (
                <motion.div 
                  className="modal-overlay"
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="modal"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={springs.bouncy}
                  >
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
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Job Modal */}
            <AnimatePresence>
              {showEditJob && (
                <motion.div 
                  className="modal-overlay" 
                  style={{zIndex: 1000}}
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="modal"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={springs.bouncy}
                  >
                  <div className="modal-header">
                    <h3>Edit Job Posting</h3>
                    <button
                      className="modal-close"
                      onClick={() => setShowEditJob(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={submitEditJob} className="modal-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., Senior Software Engineer"
                          value={editJobForm.title}
                          onChange={(e) =>
                            setEditJobForm({ ...editJobForm, title: e.target.value })
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
                          value={editJobForm.company}
                          onChange={(e) =>
                            setEditJobForm({ ...editJobForm, company: e.target.value })
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
                        value={editJobForm.description}
                        onChange={(e) =>
                          setEditJobForm({ ...editJobForm, description: e.target.value })
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
                          value={editJobForm.location}
                          onChange={(e) =>
                            setEditJobForm({ ...editJobForm, location: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Job Type</label>
                        <select
                          className="form-select"
                          value={editJobForm.job_type}
                          onChange={(e) =>
                            setEditJobForm({ ...editJobForm, job_type: e.target.value })
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
                        value={editJobForm.experience_required}
                        onChange={(e) =>
                          setEditJobForm({
                            ...editJobForm,
                            experience_required: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowEditJob(false)}
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <Edit size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Jobs List */}
            <motion.div 
              className="jobs-grid"
              variants={staggerContainer(0.08, 0.09)}
              initial="hidden"
              animate="show"
              key={activeTab + jobs.length}
            >
              {jobs.map((job) => (
                <motion.div
                  key={job.job_id}
                  className={`job-card ${selectedJob?.job_id === job.job_id ? "selected" : ""}`}
                  variants={staggerItem}
                  whileHover={cardHover}
                  whileTap={{ scale: 0.98 }}
                  style={{ willChange: "transform" }}
                  onClick={() => {
                    setSelectedJob(job);
                    fetchCandidates(job.job_id);
                    setActiveTab("candidates");
                  }}
                >
                  <div className="job-card-header">
                    <div className="job-info">
                      <h3 style={{ display: 'flex', alignItems: 'center' }}>
                        {job.title}
                        {job.created_at && new Date(job.created_at).toDateString() === new Date().toDateString() && (
                          <motion.span
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                              display: "inline-block",
                              width: 7, height: 7,
                              borderRadius: "50%",
                              background: "#E8521A",
                              marginLeft: 8,
                              verticalAlign: "middle"
                            }}
                          />
                        )}
                      </h3>
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
                    <div className="job-actions" style={{display: 'flex', gap: '8px', zIndex: 10, marginLeft: 'auto', marginRight: '10px'}}>
                      <button 
                        className="icon-btn" 
                        onClick={(e) => handleEditJobClick(e, job)} 
                        title="Edit Job"
                        style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}
                      >
                         <Edit size={18} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={(e) => handleDeleteJob(e, job.job_id)} 
                        title="Delete Job" 
                        style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)'}}
                      >
                         <Trash2 size={18} />
                      </button>
                    </div>
                    <ChevronRight size={20} className="job-arrow" />
                  </div>
                  <p className="job-description">{job.description}</p>
                  <div className="job-footer">
                    <div className="job-tags">
                      <span className="job-tag">{job.job_type}</span>
                      {job.experience_required && (
                        <span className="job-tag">
                          <Clock size={12} />
                          {job.experience_required}
                        </span>
                      )}
                    </div>
                    <motion.div 
                      className="job-skills-preview"
                      style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      variants={staggerContainer(0.05, 0.05)}
                      initial="hidden"
                      animate="show"
                    >
                      {job.required_skills?.slice(0, 3).map((skill, idx) => (
                        <motion.span key={idx} variants={scalePop} className="skill-mini">
                          {skill}
                        </motion.span>
                      ))}
                      {job.required_skills?.length > 3 && (
                        <motion.span variants={scalePop} className="skill-mini more">
                          +{job.required_skills.length - 3}
                        </motion.span>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Candidates Tab */}
        {activeTab === "candidates" && (
          <motion.div 
            key="candidates"
            className="tab-content"
            variants={pageVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {selectedJob ? (
              <>
            {/* Model Selection */}
            <div className="model-selection">
              <h3>Select AI Model for Ranking</h3>
              <LayoutGroup>
                <motion.div 
                  className="model-cards"
                  variants={staggerContainer(0.1, 0.12)}
                  initial="hidden"
                  animate="show"
                >
                  {aiModels.map((model) => (
                    <motion.button
                      key={model.id}
                      className={`model-card ${selectedModel === model.id ? "active" : ""}`}
                      onClick={() => rankCandidates(selectedJob.job_id, model.id)}
                      disabled={isLoading}
                      variants={staggerItem}
                      whileHover={{ 
                        y: -3, 
                        boxShadow: "0 8px 24px rgba(155,142,196,0.2)",
                        borderColor: "rgba(155,142,196,0.4)",
                        transition: springs.snappy
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ cursor: isLoading ? "not-allowed" : "pointer", position: "relative" }}
                    >
                      {selectedModel === model.id && (
                        <motion.div
                          layoutId="selectedModelIndicator"
                          style={{
                            position: "absolute", inset: 0,
                            borderRadius: "inherit",
                            border: "2px solid #9b8ec4",
                            boxShadow: "0 0 20px rgba(155,142,196,0.2)",
                            pointerEvents: "none"
                          }}
                          transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        />
                      )}
                      <div className="model-icon" style={{ position: "relative", zIndex: 1 }}>
                        <model.icon size={24} />
                      </div>
                      <div className="model-info" style={{ position: "relative", zIndex: 1 }}>
                        <h4>{model.name}</h4>
                        <p>{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="model-active" style={{ position: "relative", zIndex: 1 }}>
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </LayoutGroup>
            </div>

            {/* Compare Models Button */}
            <div className="compare-section" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
              <button
                className="btn btn-secondary"
                onClick={() => compareModels(selectedJob.job_id)}
                disabled={isLoading}
              >
                <BarChart3 size={18} />
                Compare All Models
              </button>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="batch-upload"
                  multiple
                  accept=".pdf"
                  onChange={handleBatchUpload}
                  style={{ position: 'absolute', width: '0', height: '0', opacity: 0, overflow: 'hidden' }}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById('batch-upload').click()}
                  disabled={isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
                >
                  <Upload size={18} />
                  Upload Offline Resumes
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>
                Matched Candidates
                <span className="candidate-count">({candidates.length})</span>
              </h2>
              
              <div className="status-filter">
                <select 
                  className="form-select" 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Analyzing candidates with {selectedModel.toUpperCase()}...</p>
              </div>
            ) : (
              <motion.div 
                className="candidates-list"
                variants={staggerContainer(0.05, 0.07)}
                initial="hidden"
                animate="show"
                key={activeTab + selectedJob.job_id}
              >
                {candidates
                  .filter(c => statusFilter === "all" ? (c.status || "pending") !== "rejected" : (c.status || "pending") === statusFilter)
                  .map((candidate, index) => (
                  <motion.div 
                    key={candidate.resume_id} 
                    className="candidate-card"
                    variants={staggerItem}
                    whileHover={cardHoverSubtle}
                    whileTap={{ scale: 0.99 }}
                    layout
                    style={{ willChange: "transform" }}
                  >
                    <div className="candidate-left-content">
                      <motion.div 
                        className="candidate-rank"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.07, type: "spring", damping: 18, stiffness: 280 }}
                      >
                        #{index + 1}
                      </motion.div>
                      <motion.div 
                        className="candidate-avatar"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.07 + 0.05, type: "spring", damping: 20, stiffness: 300 }}
                      >
                        {candidate.filename.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="candidate-info">
                        <h4>Candidate #{candidate.resume_id.substring(0, 8)}</h4>
                        <p className="line-clamp-2">{candidate.filename}</p>
                      </div>
                      <div className="candidate-score">
                        <motion.div
                          className="score-circle"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                          style={{
                            background: getScoreBg(candidate.similarity_score),
                            color: getScoreColor(candidate.similarity_score),
                          }}
                        >
                          <span>{candidate.similarity_score.toFixed(1)}%</span>
                        </motion.div>
                      </div>
                    </div>
                    
                    <div className="candidate-right-content">
                      {/* Pipeline Actions */}
                      <div className="candidate-pipeline-actions">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Status:</span>
                          <AnimatePresence mode="wait">
                            <motion.span 
                              key={candidate.status || "pending"}
                              initial={{ opacity: 0, scale: 0.8, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 4 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              style={{ fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "12px", border: `1px solid ${getStatusColor(candidate.status || "pending")}`, color: getStatusColor(candidate.status || "pending"), background: `${getStatusColor(candidate.status || "pending")}20` }}
                            >
                              {(candidate.status || "pending").charAt(0).toUpperCase() + (candidate.status || "pending").slice(1)}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => window.open(resumeAPI.getPdfUrl(candidate.resume_id), "_blank")}
                            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseOver={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                            onMouseOut={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
                          >
                            <FileText size={16} /> View CV
                          </button>
                          
                          {(candidate.status || "pending") !== "rejected" && (
                            <button 
                              onClick={() => handleStatusUpdate(candidate.resume_id, "rejected")}
                              title="Reject & Remove Candidate"
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-md)", background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", border: "1px solid rgba(239, 68, 68, 0.3)", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              <Trash2 size={16} /> Remove
                            </button>
                          )}
                          
                          {(candidate.status || "pending") !== "shortlisted" && (
                            <button 
                              onClick={() => handleStatusUpdate(candidate.resume_id, "shortlisted")}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", border: "1px solid rgba(245, 158, 11, 0.3)", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              <Award size={16} /> Shortlist
                            </button>
                          )}
                          
                          {(candidate.status || "pending") !== "accepted" && (
                            <button 
                              onClick={() => handleStatusUpdate(candidate.resume_id, "accepted")}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-md)", background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", border: "1px solid rgba(34, 197, 94, 0.3)", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              <ThumbsUp size={16} /> Accept
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="candidate-skills">
                        <div className="skills-matched">
                          <span className="skills-label">Matched</span>
                          <motion.div 
                            className="skills-tags"
                            style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                            variants={staggerContainer(0.02, 0.04)}
                            initial="hidden"
                            animate="show"
                          >
                            {candidate.matched_skills.slice(0, 4).map((skill, idx) => (
                              <motion.span key={idx} variants={scalePop} className="skill-tag matched">
                                {skill}
                              </motion.span>
                            ))}
                            {candidate.matched_skills.length > 4 && (
                              <motion.span variants={scalePop} className="skill-tag more">
                                +{candidate.matched_skills.length - 4}
                              </motion.span>
                            )}
                          </motion.div>
                        </div>
                        {candidate.missing_skills.length > 0 && (
                          <div className="skills-missing">
                            <span className="skills-label">Missing</span>
                            <motion.div 
                              className="skills-tags"
                              style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                              variants={staggerContainer(0.02, 0.04)}
                              initial="hidden"
                              animate="show"
                            >
                              {candidate.missing_skills.slice(0, 3).map((skill, idx) => (
                                <motion.span key={idx} variants={scalePop} className="skill-tag missing">
                                  {skill}
                                </motion.span>
                              ))}
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
              </>
            ) : (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Job Selected</h3>
                <p>Please select a job from the Job Postings tab to view matched candidates</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Model Comparison Tab */}
        {activeTab === "comparison" && (
          <div className="tab-content">
            <div className="comparison-header">
              <h2>AI Model Comparison</h2>
              <p>Compare how different AI models rank candidates</p>
            </div>

            {modelComparison ? (
              <div className="comparison-content">
                {/* Comparison Table */}
                <div className="comparison-table">
                  <div className="table-header">
                    <div className="table-cell" style={{ textAlign: 'left' }}>CANDIDATE</div>
                    <div className="table-cell" style={{ textAlign: 'center' }}>BERT</div>
                    <div className="table-cell" style={{ textAlign: 'center' }}>TF-IDF</div>
                    <div className="table-cell" style={{ textAlign: 'center' }}>XGBOOST</div>
                    <div className="table-cell" style={{ textAlign: 'center' }}>VARIANCE</div>
                  </div>
                  <motion.div
                    variants={staggerContainer(0.05, 0.06)}
                    initial="hidden"
                    animate="show"
                    key={activeTab}
                  >
                    {modelComparison.comparisons?.map((comp, idx) => (
                      <motion.div 
                        key={idx} 
                        className="table-row"
                        variants={fadeUp}
                        whileHover={{ 
                          backgroundColor: "rgba(232,82,26,0.03)",
                          transition: { duration: 0.15 }
                        }}
                      >
                        <div className="table-cell candidate-cell">
                          #{comp.candidate_id}
                        </div>
                        <div className="table-cell score-cell">
                          <span
                            className="score-badge"
                            style={{
                              background: getScoreBg(comp.bert_score),
                              color: getScoreColor(comp.bert_score),
                            }}
                          >
                            <AnimatedScore value={comp.bert_score} delay={idx * 0.06} />%
                          </span>
                        </div>
                        <div className="table-cell score-cell">
                          <span
                            className="score-badge"
                            style={{
                              background: getScoreBg(comp.tfidf_score),
                              color: getScoreColor(comp.tfidf_score),
                            }}
                          >
                            <AnimatedScore value={comp.tfidf_score} delay={idx * 0.06} />%
                          </span>
                        </div>
                        <div className="table-cell score-cell">
                          <span
                            className="score-badge"
                            style={{
                              background: getScoreBg(comp.xgboost_score),
                              color: getScoreColor(comp.xgboost_score),
                            }}
                          >
                            <AnimatedScore value={comp.xgboost_score} delay={idx * 0.06} />%
                          </span>
                        </div>
                        <div className="table-cell variance-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getVarianceIndicator(comp.variance)}
                          <motion.div
                            style={{
                              display: "inline-block",
                              marginLeft: 8,
                              width: 40, height: 4,
                              background: "rgba(0,0,0,0.07)",
                              borderRadius: 2,
                              verticalAlign: "middle",
                              overflow: "hidden"
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(comp.variance * 10, 100)}%` }}
                              transition={{ duration: 0.7, ease: [0.16,1,0.3,1], delay: idx * 0.06 }}
                              style={{
                                height: "100%", borderRadius: 2,
                                background: comp.variance > 5
                                  ? "#E8521A"
                                  : comp.variance > 2
                                    ? "#9b8ec4"
                                    : "#34d399"
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Model Insights */}
                <div className="model-insights">
                  <h3>Model Insights</h3>
                  <motion.div 
                    className="insights-grid"
                    variants={staggerContainer(0.1, 0.12)}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                  >
                    <motion.div className="insight-card" variants={staggerItem} whileHover={cardHoverSubtle}>
                      <Brain size={24} />
                      <h4>BERT</h4>
                      <p>Best for semantic understanding of resume content and job requirements</p>
                    </motion.div>
                    <motion.div className="insight-card" variants={staggerItem} whileHover={cardHoverSubtle}>
                      <Activity size={24} />
                      <h4>TF-IDF</h4>
                      <p>Traditional approach focusing on keyword frequency and exact matches</p>
                    </motion.div>
                    <motion.div className="insight-card" variants={staggerItem} whileHover={cardHoverSubtle}>
                      <Cpu size={24} />
                      <h4>XGBoost</h4>
                      <p>Machine learning ensemble for complex pattern recognition</p>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 size={48} />
                <h3>No Comparison Data</h3>
                <p>Select a job and click "Compare All Models" to see model comparison</p>
              </div>
            )}
          </div>
        )}
        </AnimatePresence>
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

        .header-badge {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--lilac-bg);
          border: 1px solid rgba(155, 142, 196, 0.25);
          border-radius: var(--radius-full);
          color: var(--lilac-dark);
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

        /* Section Header */
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

        /* Modal */
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

        .modal-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

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

        .modal-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

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

        /* Jobs Grid */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
        }

        .job-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .job-card:hover {
          border-color: rgba(255,255,255,0.2);
          background: var(--bg-secondary);
        }

        .job-card.selected {
          border-color: var(--text-primary);
          background: var(--bg-card);
        }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .job-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .job-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .job-meta span {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .job-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .job-card:hover .job-arrow {
          transform: translateX(4px);
          color: var(--primary);
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

        .job-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .job-tags {
          display: flex;
          gap: var(--space-sm);
        }

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

        .job-skills-preview {
          display: flex;
          gap: var(--space-xs);
        }

        .skill-mini {
          padding: 2px 8px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: var(--radius-full);
          font-size: 0.625rem;
          color: var(--primary-light);
        }

        .skill-mini.more {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        /* Model Selection */
        .model-selection {
          margin-bottom: var(--space-xl);
        }

        .model-selection h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-md);
        }

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

        .model-card:hover:not(:disabled) {
          border-color: var(--border-secondary);
        }

        .model-card.active {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .model-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

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

        .model-info h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .model-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }

        .model-active {
          margin-left: auto;
          color: var(--success);
        }

        .compare-section {
          margin-bottom: var(--space-xl);
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-3xl);
          color: var(--text-secondary);
        }

        /* Candidates List */
        .candidates-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

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
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
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

        .candidate-info {
          flex: 1;
          min-width: 0;
        }

        .candidate-info h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .candidate-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .candidate-score {
          flex-shrink: 0;
        }

        .score-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-circle span {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .candidate-skills {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          min-width: 200px;
        }

        .skills-matched,
        .skills-missing {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .skills-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        /* Comparison */
        .comparison-header {
          margin-bottom: var(--space-xl);
        }

        .comparison-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .comparison-header p {
          color: var(--text-secondary);
        }

        .comparison-table {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: var(--space-xl);
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1fr 1fr 1fr;
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

        .table-row {
          border-top: 1px solid var(--border-primary);
        }

        .candidate-cell {
          font-weight: 600;
        }

        .score-cell {
          display: flex;
          justify-content: center;
        }

        .score-badge {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .variance-cell {
          display: flex;
          justify-content: center;
        }

        /* Model Insights */
        .model-insights {
          margin-top: var(--space-2xl);
        }

        .model-insights h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
        }

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

        .insight-card svg {
          color: var(--primary);
          margin-bottom: var(--space-md);
        }

        .insight-card h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .insight-card p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-3xl);
          color: var(--text-muted);
          text-align: center;
        }

        .empty-state svg {
          opacity: 0.5;
        }

        .empty-state h3 {
          color: var(--text-secondary);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .model-cards {
            grid-template-columns: 1fr;
          }

          .candidate-card {
            flex-wrap: wrap;
          }

          .candidate-skills {
            width: 100%;
            min-width: auto;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-sm);
          }

          .table-cell:nth-child(4),
          .table-cell:nth-child(5) {
            display: none;
          }

          .insights-grid {
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

          .section-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <FloatingHint 
        message={
          activeTab === 'jobs' ? "Click 'Create Job' to start hiring" :
          activeTab === 'candidates' ? "Select a model to rank your candidates" :
          "Compare models to find the best match"
        } 
      />
    </motion.div>
  );
};

// Helper function for variance indicator
function getVarianceIndicator(variance) {
  if (variance < 5) {
    return <Minus size={16} style={{ color: "var(--success)" }} />;
  } else if (variance < 15) {
    return <ArrowUpRight size={16} style={{ color: "var(--warning)" }} />;
  } else {
    return <ArrowDownRight size={16} style={{ color: "var(--error)" }} />;
  }
}

export default RecruiterDashboard;
