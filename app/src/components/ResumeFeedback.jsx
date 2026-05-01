import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { staggerContainer, staggerItem } from "../lib/motion";
import { resumeAPI } from "../services/api";

/* ── Animated Score Ring ───────────────────────────────── */
function AnimatedScoreRing({ score, size = 140, strokeWidth = 10 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const r = (size / 2) - strokeWidth;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? '#E8521A' : score >= 50 ? '#9b8ec4' : '#d4a5a0';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Needs Work';
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: circ - filled } : { strokeDashoffset: circ }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ transformOrigin: `${size/2}px ${size/2}px`, transform: 'rotate(-90deg)' }}
        />
        <text x={size/2} y={size/2 - 6} textAnchor="middle" dominantBaseline="central"
              fontSize={size * 0.2} fontWeight={700} fill={color}
              fontFamily="Inter, system-ui, sans-serif">
          {score}
        </text>
        <text x={size/2} y={size/2 + 16} textAnchor="middle"
              fontSize={size * 0.085} fill="#71717a"
              fontFamily="Inter, system-ui, sans-serif">
          /100
        </text>
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.2, type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          padding: '3px 12px', borderRadius: 9999,
          fontSize: 12, fontWeight: 600,
          background: color + '18', border: `1px solid ${color}40`, color: color
        }}
      >
        {label}
      </motion.span>
    </div>
  );
}

const Card = ({ children, style = {} }) => (
  <div style={{
    background: '#16162a',
    borderRadius: 18,
    boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    border: '1px solid #2e2e4a',
    ...style
  }}>
    {children}
  </div>
);

const ResumeFeedback = ({ resumeId, jobs = [] }) => {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const [activeTabs, setActiveTabs] = useState({});
  const [copiedSection, setCopiedSection] = useState(null);

  const getTab = (i) => activeTabs[i] ?? 'issues';
  const setTab = (i, tab) => setActiveTabs(prev => ({ ...prev, [i]: tab }));

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
      
      // Initialize tabs
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

  let arcColor, arcLabel, R, CIRC, filled;
  if (data && !loading) {
    arcColor = data.overall_score >= 75 ? '#34c759' 
             : data.overall_score >= 50 ? '#ff9f0a' 
             : '#ff3b30';
    arcLabel = data.overall_score >= 75 ? 'Strong' 
             : data.overall_score >= 50 ? 'Average' 
             : 'Needs Work';
    R = 52;
    CIRC = 2 * Math.PI * R;
    filled = (data.overall_score / 100) * CIRC;
  }

  return (
    <div style={{
      background: 'transparent',
      minHeight: '100vh',
      padding: '24px 0',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* SECTION 1 — HEADER CARD */}
        <Card>
          <div style={{ padding: '28px 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22, color: '#3b82f6' }}>✦</span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
                AI Resume Feedback
              </h2>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#a1a1aa', lineHeight: 1.5 }}>
              Get section-by-section critique and a rewritten version ready to paste.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setSelectedJobId('')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 980,
                  border: selectedJobId === '' ? 'none' : '1px solid #2e2e4a',
                  background: selectedJobId === '' ? '#3b82f6' : 'transparent',
                  color: selectedJobId === '' ? '#ffffff' : '#a1a1aa',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit'
                }}
              >
                General feedback
              </button>
              {jobs.map(job => (
                <button
                  key={job.id || job.job_id}
                  onClick={() => setSelectedJobId(job.id || job.job_id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 980,
                    border: selectedJobId === (job.id || job.job_id) ? 'none' : '1px solid #2e2e4a',
                    background: selectedJobId === (job.id || job.job_id) ? '#3b82f6' : 'transparent',
                    color: selectedJobId === (job.id || job.job_id) ? '#ffffff' : '#a1a1aa',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  {job.title}{job.company ? ` — ${job.company}` : ''}
                </button>
              ))}
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: loading ? '#2a2a4a' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 980,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s ease',
                letterSpacing: '0.01em'
              }}
            >
              {loading ? '⏳ Analysing your resume…' : '✦ Analyse Resume'}
            </button>
          </div>
        </Card>

        {/* SECTION 2 — ERROR STATE */}
        {error && (
          <Card>
            <div style={{ padding: '20px 24px', background: '#2d1515', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 14, color: '#fca5a5' }}>{error}</p>
            </div>
          </Card>
        )}

        {/* SECTION 3 — LOADING SKELETONS */}
        {loading && (
          <>
            <style>{`
              @keyframes shimmer {
                0%   { background-position: -600px 0 }
                100% { background-position: 600px 0 }
              }
            `}</style>
            {[140, 200, 120].map((h, i) => (
              <div key={i} style={{
                height: h,
                borderRadius: 18,
                background: 'linear-gradient(90deg, #16162a 25%, #252542 50%, #16162a 75%)',
                backgroundSize: '1200px 100%',
                animation: 'shimmer 1.4s infinite',
                border: '1px solid #2e2e4a'
              }} />
            ))}
          </>
        )}

        {/* SECTION 4 — OVERALL SCORE HERO CARD */}
        {data && !loading && (
          <>
            <Card>
              <div style={{ padding: '32px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <AnimatedScoreRing score={data.overall_score} />
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Resume Score
                    </p>
                    <p style={{ margin: '0 0 16px', fontSize: 15, color: '#cbd5e1', lineHeight: 1.7 }}>
                      {data.overall_summary}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '5px 12px', borderRadius: 980, fontSize: 13, fontWeight: 500,
                        background: '#0d2818', color: '#4ade80', border: '1px solid #1a4731'
                      }}>
                        ✦ Strongest &nbsp; {data.strongest_section}
                      </span>
                      <span style={{
                        padding: '5px 12px', borderRadius: 980, fontSize: 13, fontWeight: 500,
                        background: '#2d1515', color: '#f87171', border: '1px solid #5c2323'
                      }}>
                        ↓ Weakest &nbsp; {data.weakest_section}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  borderLeft: '3px solid #3b82f6', background: '#0d1e35',
                  borderRadius: '0 10px 10px 0', padding: '12px 16px'
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#93c5fd', fontStyle: 'italic', lineHeight: 1.6 }}>
                    💬 {data.tone_feedback}
                  </p>
                </div>
              </div>
            </Card>

            {/* SECTION 5 — SECTION BREAKDOWN CARDS */}
            <p style={{ margin: '4px 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>
              Detailed Section Breakdown
            </p>

            {data.sections?.map((section, i) => {
              const sectionArcColor = section.score >= 75 ? '#34c759' 
                                    : section.score >= 50 ? '#ff9f0a' 
                                    : '#ff3b30';
              return (
                <Card key={i}>
                  <div style={{
                    padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: '#121222',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                        {section.section}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: sectionArcColor,
                        background: sectionArcColor + '26',
                        padding: '3px 10px', borderRadius: 980
                      }}>
                        {section.score}/100
                      </span>
                    </div>
                    {section.issues.length === 0 ? (
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        background: '#0d2818', color: '#4ade80',
                        padding: '4px 10px', borderRadius: 980
                      }}>✓ No issues</span>
                    ) : (
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        background: '#2d1515', color: '#f87171',
                        padding: '4px 10px', borderRadius: 980
                      }}>
                        {section.issues.length} Issue{section.issues.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '0 24px', gap: 0
                  }}>
                    {[
                      { key: 'issues', label: 'Issues' },
                      { key: 'rewrite', label: 'AI Rewrite' },
                      { key: 'bullets', label: `Bullet Fixes ${section.bullet_rewrites?.length > 0 ? `(${section.bullet_rewrites.length})` : ''}` }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setTab(i, tab.key)}
                        style={{
                          padding: '12px 16px',
                          border: 'none',
                          borderBottom: getTab(i) === tab.key 
                            ? '2px solid #3b82f6' 
                            : '2px solid transparent',
                          background: 'transparent',
                          color: getTab(i) === tab.key ? '#3b82f6' : '#64748b',
                          fontSize: 14, fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {getTab(i) === 'issues' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {section.issues.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 14, color: '#4ade80' }}>
                            ✓ This section looks great!
                          </p>
                        ) : section.issues.map((issue, j) => (
                          <div key={j} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            paddingBottom: j < section.issues.length - 1 ? 10 : 0,
                            borderBottom: j < section.issues.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                          }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#2a1f00', color: '#fbbf24', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, fontSize: 13
                            }}>⚠️</div>
                            <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
                              {issue}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {getTab(i) === 'rewrite' && (
                      <div>
                        <div style={{ 
                          display: 'flex', justifyContent: 'space-between', 
                          alignItems: 'center', marginBottom: 12 
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b',
                                         textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Improved Version
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(section.rewritten);
                              setCopiedSection(i);
                              setTimeout(() => setCopiedSection(null), 2000);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8,
                              border: copiedSection === i ? '1px solid #1a4731' : '1px solid #334155', 
                              background: copiedSection === i ? '#0d2818' : '#1e293b',
                              fontSize: 12, fontWeight: 500, 
                              color: copiedSection === i ? '#4ade80' : '#94a3b8',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            {copiedSection === i ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <div style={{
                          background: '#0d1117', border: '1px solid #1e293b',
                          borderRadius: 12, padding: '16px 18px',
                          fontSize: 14, color: '#e2e8f0', lineHeight: 1.8,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {section.rewritten}
                        </div>
                      </div>
                    )}

                    {getTab(i) === 'bullets' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(!section.bullet_rewrites || section.bullet_rewrites.length === 0) ? (
                          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                            No bullet rewrites for this section.
                          </p>
                        ) : section.bullet_rewrites.map((b, k) => (
                          <div key={k} style={{
                            borderBottom: k < section.bullet_rewrites.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            paddingBottom: k < section.bullet_rewrites.length - 1 ? 16 : 0
                          }}>
                            <div style={{
                              background: '#2d1515', borderLeft: '3px solid #ef4444',
                              borderRadius: '0 8px 8px 0', padding: '10px 14px',
                              fontSize: 13, color: '#fca5a5', lineHeight: 1.5
                            }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', display: 'block', marginBottom: 4 }}>BEFORE</span>
                              {b.original}
                            </div>
                            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 16, color: '#475569' }}>↓</div>
                            <div style={{
                              background: '#0d2818', borderLeft: '3px solid #22c55e',
                              borderRadius: '0 8px 8px 0', padding: '10px 14px',
                              fontSize: 13, color: '#86efac', lineHeight: 1.5
                            }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', display: 'block', marginBottom: 4 }}>AFTER</span>
                              {b.rewritten}
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                              {b.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* SECTION 6 — MISSING KEYWORDS CARD */}
            {data.top_missing_keywords?.length > 0 && (
              <Card>
                <div style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                      Missing Keywords for This Job
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                    Add these naturally to your Experience or Skills sections
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {data.top_missing_keywords.map((kw, i) => (
                      <span key={i} style={{
                        padding: '6px 14px', borderRadius: 980,
                        background: '#2a1a00', border: '1px solid #78350f',
                        color: '#fbbf24', fontSize: 13, fontWeight: 500
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 7 — ATS TIPS CARD */}
            {data.ats_tips?.length > 0 && (
              <Card>
                <div style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                      ATS Formatting Tips
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {data.ats_tips.map((tip, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        padding: '14px 0',
                        borderBottom: i < data.ats_tips.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#3b82f6', color: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeFeedback;
