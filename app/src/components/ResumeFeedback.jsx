import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { resumeAPI } from "../services/api";
import { staggerContainer, staggerItem, scalePop, springs } from "../lib/motion";

const shimmerStyle = `
  @keyframes shimmer {
    0%   { background-position: -400px 0 }
    100% { background-position: 400px 0 }
  }
`;

const ResumeFeedback = ({ resumeId, jobs = [], onTabChange }) => {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const [activeTabs, setActiveTabs] = useState({});
  const [copiedSection, setCopiedSection] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const runAnalysis = async () => {
    if (!resumeId) return;
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const selectedJob = jobs.find(j => j.job_id === selectedJobId || j.id === selectedJobId);
      const requestData = {
        job_id: selectedJobId || null,
        job_description: selectedJob ? selectedJob.description : null
      };
      
      const response = await resumeAPI.getFeedback(resumeId, requestData);
      setData(response.data);
      
      const initialTabs = {};
      response.data.sections?.forEach((sec, i) => {
        initialTabs[i] = "issues";
      });
      setActiveTabs(initialTabs);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "An error occurred while analyzing the resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const uniqueJobs = jobs.filter((job, index, self) =>
    index === self.findIndex((t) => (
      t.title === job.title && t.company === job.company
    ))
  );

  const visibleJobs = uniqueJobs.slice(0, 3);
  const hiddenJobs = uniqueJobs.slice(3);

  const score = data ? (data.overall_score || data.match_score || 0) : 0;
  const arcColor = score >= 75 ? "#E8521A" : score >= 50 ? "#9b8ec4" : "#d4a5a0";
  const scoreLabel = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Needs Work';

  if (!resumeId) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "64px 24px", textAlign: "center", gap: 16
      }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 72, height: 72, borderRadius: 18,
            background: "rgba(232,82,26,0.08)", border: "1px solid rgba(232,82,26,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
          }}
        >
          📄
        </motion.div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "rgba(0,0,0,0.85)" }}>
          No resume uploaded yet
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(0,0,0,0.45)", maxWidth: 300, lineHeight: 1.6 }}>
          Upload your resume in the Upload Resume tab to get AI-powered section-by-section feedback
        </p>
        <button
          onClick={() => onTabChange && onTabChange("upload")}
          style={{
            marginTop: 8, padding: "10px 24px", background: "#E8521A", color: "white", 
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}
        >
          Upload Resume →
        </button>
      </div>
    );
  }

  const renderJobPill = (id, label) => {
    const isSelected = selectedJobId === id;
    return (
      <button
        key={id}
        onClick={() => { setSelectedJobId(id); setShowDropdown(false); }}
        style={{
          padding: "7px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer",
          border: isSelected ? "none" : "1px solid rgba(0,0,0,0.12)",
          background: isSelected ? "#E8521A" : "white",
          color: isSelected ? "white" : "rgba(0,0,0,0.6)",
          boxShadow: isSelected ? "0 2px 8px rgba(232,82,26,0.3)" : "none",
          transition: "all 0.2s ease", fontFamily: "inherit", whiteSpace: "nowrap"
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ background: "transparent", padding: 0, fontFamily: "inherit", maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{shimmerStyle}</style>

      {/* SECTION A - HEADER CARD */}
      <div style={{ background: "#ffffff", border: "1px solid rgba(232,82,26,0.1)", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Row 1 */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <div style={{ background: "rgba(232,82,26,0.08)", border: "1px solid rgba(232,82,26,0.15)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#E8521A", fontSize: 18, flexShrink: 0 }}>
            ✦
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "rgba(0,0,0,0.85)" }}>AI Resume Feedback</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>Get section-by-section critique and a rewritten version ready to paste</p>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, position: "relative" }}>
          {renderJobPill("", "General feedback")}
          {visibleJobs.map(job => renderJobPill(job.id || job.job_id, `${job.title} — ${job.company}`))}
          
          {hiddenJobs.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: "7px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  border: "1px solid rgba(0,0,0,0.12)", background: "white", color: "rgba(0,0,0,0.6)",
                  transition: "all 0.2s ease", fontFamily: "inherit", whiteSpace: "nowrap"
                }}
              >
                +{hiddenJobs.length} more ▾
              </button>
              {showDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 8, background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 8, display: "flex", flexDirection: "column", gap: 6, zIndex: 10, minWidth: 200 }}>
                  {hiddenJobs.map(job => (
                    <div key={job.id || job.job_id} style={{ width: "100%", display: "block" }}>
                      {renderJobPill(job.id || job.job_id, `${job.title} — ${job.company}`)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 3 */}
        <motion.button
          onClick={runAnalysis}
          disabled={loading}
          whileHover={!loading ? { scale: 1.01, boxShadow: "0 6px 24px rgba(232,82,26,0.4)" } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          transition={springs?.snappy}
          style={{
            background: loading ? "rgba(232,82,26,0.5)" : "linear-gradient(135deg, #E8521A, #f07a52)",
            color: "white", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", width: "100%",
            boxShadow: loading ? "none" : "0 4px 16px rgba(232,82,26,0.3)",
            transition: "all 0.2s ease", fontFamily: "inherit", letterSpacing: "0.01em"
          }}
        >
          {loading ? "⏳ Analysing your resume…" : "✦ Analyse Resume"}
        </motion.button>
      </div>

      {/* SECTION B - LOADING STATE */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", textAlign: "center", marginBottom: 16 }}>🤖 Analysing your resume with AI…</p>
          {[100, 200, 160, 140].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 16,
              background: "linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%)",
              backgroundSize: "800px 100%",
              animation: "shimmer 1.4s infinite"
            }} />
          ))}
        </div>
      )}

      {/* SECTION C - ERROR STATE */}
      {error && !loading && (
        <div style={{ background: "#fff5f5", border: "1px solid rgba(232,82,26,0.2)", borderLeft: "4px solid #E8521A", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ background: "#fff8e6", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
            ⚠️
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: "#c0392b", lineHeight: 1.5 }}>{error}</p>
            <button onClick={runAnalysis} style={{ background: "transparent", border: "none", color: "#E8521A", fontWeight: 600, fontSize: 13, padding: 0, marginTop: 8, cursor: "pointer" }}>
              Try again →
            </button>
          </div>
        </div>
      )}

      {/* RESULTS BLOCK */}
      <AnimatePresence mode="wait">
        {data && !loading && !error && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {/* SECTION D - OVERALL SCORE HERO CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
              style={{ background: "#ffffff", border: "1px solid rgba(232,82,26,0.1)", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "row", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ position: "relative", width: 140, height: 140 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="10" />
                    <motion.circle
                      cx="70" cy="70" r="60" fill="none" stroke={arcColor} strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 60}
                      initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 60) - ((score / 100) * (2 * Math.PI * 60)) }}
                      transition={{ duration: 1.4, ease: [0.16,1,0.3,1], delay: 0.2 }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: arcColor }}>{score}</span>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>/100</span>
                  </div>
                </div>
                <motion.div variants={scalePop} initial="hidden" animate="show" style={{ padding: "4px 14px", borderRadius: 9999, background: `${arcColor}18`, border: `1px solid ${arcColor}35`, color: arcColor, fontSize: 12, fontWeight: 600, marginTop: 12 }}>
                  {scoreLabel}
                </motion.div>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>RESUME SCORE</div>
                <p style={{ margin: 0, fontSize: 15, color: "rgba(0,0,0,0.75)", lineHeight: 1.7, marginBottom: 16 }}>{data.overall_summary}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(232,82,26,0.07)", border: "1px solid rgba(232,82,26,0.2)", color: "#E8521A", padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                    ✦ Strongest: {data.strongest_section}
                  </div>
                  <div style={{ background: "rgba(155,142,196,0.1)", border: "1px solid rgba(155,142,196,0.25)", color: "#9b8ec4", padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                    ↓ Weakest: {data.weakest_section}
                  </div>
                </div>
                {data.tone_feedback && (
                  <div style={{ marginTop: 16, borderLeft: "3px solid #E8521A", background: "rgba(232,82,26,0.04)", borderRadius: "0 10px 10px 0", padding: "12px 16px", fontSize: 13, color: "rgba(0,0,0,0.65)", fontStyle: "italic", lineHeight: 1.6 }}>
                    💬 {data.tone_feedback}
                  </div>
                )}
              </div>
            </motion.div>

            {/* SECTION E - SECTION BREAKDOWN */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.35)", marginBottom: 8 }}>
                DETAILED SECTION BREAKDOWN
              </div>
              <motion.div style={{ display: "flex", flexDirection: "column", gap: 12 }} variants={staggerContainer(0.05, 0.10)} initial="hidden" animate="show">
                {data.sections?.map((s, i) => {
                  const sectionScore = s.score;
                  const secScoreColor = sectionScore >= 75 ? "#E8521A" : sectionScore >= 50 ? "#9b8ec4" : "#d4a5a0";
                  const activeTab = activeTabs[i] || "issues";
                  const issueCount = s.issues?.length || 0;

                  return (
                    <motion.div key={i} variants={staggerItem} style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 0 }}>
                      {/* Card Header */}
                      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.85)" }}>{s.section}</h4>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, background: `${secScoreColor}15`, color: secScoreColor, marginLeft: 8 }}>
                            {sectionScore}/100
                          </span>
                        </div>
                        <div style={{ background: issueCount === 0 ? "#f0fff4" : "#fff5f5", color: issueCount === 0 ? "#16a34a" : "#E8521A", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 9999 }}>
                          {issueCount === 0 ? "✓ Clean" : `${issueCount} Issue${issueCount === 1 ? '' : 's'}`}
                        </div>
                      </div>

                      {/* Tab Bar */}
                      <div style={{ padding: "0 24px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 20 }}>
                        <LayoutGroup id={`sectionTab-${i}`}>
                          {["issues", "ai_rewrite", "bullet_fixes"].map(tabKey => {
                            const labels = { issues: "Issues", ai_rewrite: "AI Rewrite", bullet_fixes: "Bullet Fixes" };
                            const isActive = activeTab === tabKey;
                            const hasBulletFixes = s.bullet_rewrites?.length > 0;
                            return (
                              <button
                                key={tabKey}
                                onClick={() => setActiveTabs({ ...activeTabs, [i]: tabKey })}
                                style={{
                                  position: "relative", padding: "11px 0", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", transition: "color 0.15s ease",
                                  color: isActive ? "#E8521A" : "rgba(0,0,0,0.4)"
                                }}
                              >
                                {labels[tabKey]}
                                {tabKey === "bullet_fixes" && hasBulletFixes && (
                                  <span style={{ background: "#E8521A", color: "white", width: 16, height: 16, borderRadius: "50%", fontSize: 10, fontWeight: 700, marginLeft: 4, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    {s.bullet_rewrites.length}
                                  </span>
                                )}
                                {isActive && (
                                  <motion.div
                                    layoutId={`activeIndicator-${i}`}
                                    style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 2, background: "#E8521A" }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </LayoutGroup>
                      </div>

                      {/* Tab Content */}
                      <div style={{ padding: "20px 24px" }}>
                        {activeTab === "issues" && (
                          <div>
                            {issueCount === 0 ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 14 }}>
                                <CheckCircle2 size={18} />
                                <span style={{ fontWeight: 500 }}>This section looks great!</span>
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                {s.issues.map((issue, idx) => (
                                  <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 12, borderBottom: idx !== s.issues.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", marginBottom: idx !== s.issues.length - 1 ? 12 : 0 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(232,82,26,0.08)", color: "#E8521A", fontSize: 13, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                      ⚠
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>{issue}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === "ai_rewrite" && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>IMPROVED VERSION</span>
                              <button
                                onClick={() => handleCopy(s.rewritten, i)}
                                style={{ display: "flex", gap: 5, alignItems: "center", padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: copiedSection === i ? "rgba(232,82,26,0.06)" : "#f5f5f5", color: copiedSection === i ? "#E8521A" : "rgba(0,0,0,0.5)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}
                              >
                                {copiedSection === i ? "✓ Copied!" : "📋 Copy"}
                              </button>
                            </div>
                            <div style={{ background: "rgba(232,82,26,0.03)", border: "1px solid rgba(232,82,26,0.1)", borderRadius: 12, padding: "16px 18px", fontSize: 14, color: "rgba(0,0,0,0.75)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                              {s.rewritten || "No rewrite available for this section."}
                            </div>
                          </div>
                        )}

                        {activeTab === "bullet_fixes" && (
                          <div>
                            {(!s.bullet_rewrites || s.bullet_rewrites.length === 0) ? (
                              <p style={{ margin: 0, color: "rgba(0,0,0,0.4)", fontSize: 14 }}>No bullet rewrites for this section.</p>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                {s.bullet_rewrites.map((br, idx) => (
                                  <div key={idx} style={{ paddingBottom: 16, borderBottom: idx !== s.bullet_rewrites.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", marginBottom: idx !== s.bullet_rewrites.length - 1 ? 16 : 0 }}>
                                    <div style={{ background: "rgba(239,68,68,0.05)", borderLeft: "3px solid #ef4444", borderRadius: "0 8px 8px 0", padding: "10px 14px" }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", display: "block", marginBottom: 4 }}>BEFORE</span>
                                      <p style={{ margin: 0, fontSize: 13, color: "rgba(0,0,0,0.65)", lineHeight: 1.5 }}>{br.original}</p>
                                    </div>
                                    <div style={{ textAlign: "center", color: "rgba(0,0,0,0.3)", fontSize: 18, margin: "6px auto", display: "block" }}>↓</div>
                                    <div style={{ background: "rgba(34,197,94,0.05)", borderLeft: "3px solid #22c55e", borderRadius: "0 8px 8px 0", padding: "10px 14px" }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", display: "block", marginBottom: 4 }}>AFTER</span>
                                      <p style={{ margin: 0, fontSize: 13, color: "rgba(0,0,0,0.8)", lineHeight: 1.5 }}>{br.rewritten}</p>
                                    </div>
                                    {br.reason && (
                                      <p style={{ margin: "8px 0 0 0", fontSize: 12, fontStyle: "italic", color: "rgba(0,0,0,0.4)", lineHeight: 1.5 }}>{br.reason}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* SECTION F - MISSING KEYWORDS */}
            {data.top_missing_keywords?.length > 0 && (
              <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.85)" }}>Missing Keywords for This Job</h3>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(0,0,0,0.4)", marginTop: 4 }}>Add these naturally to your Skills or Experience sections</p>
                <motion.div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }} variants={staggerContainer(0.05, 0.06)} initial="hidden" animate="show">
                  {data.top_missing_keywords.map((kw, i) => (
                    <motion.span key={i} variants={scalePop} style={{ padding: "6px 14px", borderRadius: 9999, background: "rgba(232,82,26,0.07)", border: "1px solid rgba(232,82,26,0.18)", color: "#E8521A", fontSize: 13, fontWeight: 500 }}>
                      {kw}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            )}

            {/* SECTION G - ATS TIPS */}
            {data.ats_tips?.length > 0 && (
              <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.85)" }}>ATS Formatting Tips</h3>
                </div>
                <motion.div style={{ display: "flex", flexDirection: "column", gap: 0 }} variants={staggerContainer(0.05, 0.1)} initial="hidden" animate="show">
                  {data.ats_tips.map((tip, i) => (
                    <motion.div key={i} variants={staggerItem} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: i !== data.ats_tips.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #E8521A, #f07a52)", color: "white", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>{tip}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeFeedback;
