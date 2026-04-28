import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* ── Scroll‑reveal hook — observes container, reveals all .reveal children ── */
const useReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const targets = container.querySelectorAll(".reveal");
          targets.forEach((t, i) => {
            setTimeout(() => t.classList.add("visible"), i * 80);
          });
          obs.unobserve(container);
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, []);
  return ref;
};

/* ── Animated counter ── */
const Counter = ({ end, suffix = "" }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const num = parseInt(end);
        const dur = 1800;
        const step = dur / num;
        const timer = setInterval(() => {
          start += 1;
          setVal(start);
          if (start >= num) clearInterval(timer);
        }, Math.max(step, 15));
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
};

/* ── 3D Tilt Card ── */
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(600px) rotateX(0) rotateY(0) scale(1)";
  };
  return (
    <div ref={ref} className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ transition: "transform 0.3s ease-out" }}>
      {children}
    </div>
  );
};

const LandingPage = () => {
  const stickyWrapperRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = stickyWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Total distance the sticky element stays on screen
      const totalHeight = el.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / totalHeight));
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Animation phases mapped to progress (0 to 1) */
  const flapAngle = Math.min(180, scrollProgress * 360);           // 0 to 0.5: flap opens
  const resumeSlide = Math.max(0, (scrollProgress - 0.2) * 2);     // 0.2 to 0.7: resume slides out
  const scanLine = Math.max(0, (scrollProgress - 0.5) * 3.3);      // 0.5 to 0.8: scan sweeps
  const pillsShow = Math.max(0, (scrollProgress - 0.75) * 4);      // 0.75 to 1.0: pills pop

  const r1 = useReveal();
  const r2 = useReveal();
  const r3 = useReveal();
  const r4 = useReveal();

  return (
    <div className="landing">

      {/* ── STICKY HERO wrapper ── */}
      <section className="sticky-hero-section" ref={stickyWrapperRef}>
        <div className="sticky-content">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-text">
                <p className="hero-label">INTELLIGENT RECRUITMENT</p>
                <h1 className="hero-title">
                  Hiring, without<br />the guesswork.
                </h1>
                <p className="hero-subtitle">
                  Transform your recruitment process with intelligent models that
                  understand skills, experience, and candidate potential.
                </p>
                <div className="hero-buttons">
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Sign In
                  </Link>
                </div>
              </div>

              <div className="hero-visual">
                <div className="envelope-scene">
                  <div className="envelope-body">
                    <div className="envelope-flap" style={{ transform: `rotateX(${flapAngle}deg)` }}>
                      <div className="flap-front"></div>
                      <div className="flap-back"></div>
                    </div>

                    <div className="resume-doc" style={{ 
                      transform: `translateY(${-resumeSlide * 140}px)`, 
                      opacity: Math.min(1, resumeSlide * 2.5) 
                    }}>
                      <div className="resume-header-bar"></div>
                      <div className="resume-line w80"></div>
                      <div className="resume-line w60"></div>
                      <div className="resume-line w90"></div>
                      <div className="resume-line w40"></div>
                      <div className="resume-section-title"></div>
                      <div className="resume-line w70"></div>
                      <div className="resume-line w85"></div>
                      <div className="resume-line w50"></div>

                      <div className="scan-line" style={{ 
                        top: `${Math.min(100, scanLine * 100)}%`, 
                        opacity: scanLine > 0 && scanLine < 1 ? 1 : 0 
                      }}></div>
                    </div>

                    <div className="skill-pills" style={{ opacity: pillsShow }}>
                      <span className="skill-pill" style={{ transform: `translate(-30px, -20px) scale(${Math.min(1, pillsShow)})` }}>Python</span>
                      <span className="skill-pill" style={{ transform: `translate(20px, -40px) scale(${Math.min(1, pillsShow)})` }}>React</span>
                      <span className="skill-pill accent" style={{ transform: `translate(-40px, 10px) scale(${Math.min(1, pillsShow)})` }}>95% Match</span>
                      <span className="skill-pill" style={{ transform: `translate(30px, 0px) scale(${Math.min(1, pillsShow)})` }}>SQL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section" ref={r1}>
        <div className="container">
          <div className="reveal stats-bar">
            <div className="stat-cell">
              <h3><Counter end="10" suffix="K+" /></h3>
              <p>Resumes Processed</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-cell">
              <h3><Counter end="95" suffix="%" /></h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-cell">
              <h3><Counter end="50" suffix="+" /></h3>
              <p>Companies</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-cell">
              <h3><Counter end="3" /></h3>
              <p>AI Models</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" ref={r2}>
        <div className="container">
          <div className="reveal section-header">
            <span className="section-label">FEATURES</span>
            <h2>Built for precision.</h2>
          </div>

          <div className="features-grid">
            {[
              { num: "01", title: "Resume Skill Extraction", desc: "AI-powered analysis that automatically extracts and categorizes skills from resumes with high accuracy." },
              { num: "02", title: "AI Candidate Ranking", desc: "Intelligent ranking system using BERT, TF-IDF, and XGBoost models to find the best candidates." },
              { num: "03", title: "Model Comparison", desc: "Compare different AI models side-by-side to understand their predictions and confidence scores." },
              { num: "04", title: "Skill Gap Analysis", desc: "Identify missing skills and get personalized learning recommendations for career growth." },
              { num: "05", title: "Fast Processing", desc: "Process hundreds of resumes in seconds with our optimized NLP pipeline." },
              { num: "06", title: "Team Collaboration", desc: "Share job postings and candidate shortlists with your hiring team seamlessly." },
            ].map((f, i) => (
              <TiltCard key={i} className={`reveal reveal-delay-${i % 3 + 1} feature-card`}>
                <span className="feature-num">{f.num}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" ref={r3}>
        <div className="container">
          <div className="reveal section-header">
            <h2>How it works</h2>
          </div>

          <div className="steps-grid">
            {[
              { num: "01", title: "Upload Resume", desc: "Candidates upload their resumes in PDF format." },
              { num: "02", title: "AI Analysis", desc: "Our NLP pipeline extracts skills and analyzes experience." },
              { num: "03", title: "Get Matched", desc: "Find the perfect job or ideal candidates instantly." },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1} step-card`}>
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" ref={r4}>
        <div className="container">
          <div className="reveal cta-card">
            <h2>Start hiring smarter.</h2>
            <p>Join thousands of companies using IntelliHire to find the best talent.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/logo.png" alt="IntelliHire" className="footer-logo-img" />
              <span className="footer-name">IntelliHire</span>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Product</h4>
                <Link to="/">Features</Link>
                <Link to="/">Pricing</Link>
                <Link to="/">API</Link>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <Link to="/">About</Link>
                <Link to="/">Blog</Link>
                <Link to="/">Careers</Link>
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <Link to="/">Help Center</Link>
                <Link to="/">Contact</Link>
                <Link to="/">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 IntelliHire. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .landing { min-height: 100vh; }

        /* ── HERO ── */
        .sticky-hero-section {
          position: relative;
          height: 200vh; /* distance the user must scroll to complete the animation */
          background: var(--bg-primary);
        }

        .sticky-content {
          position: sticky;
          top: 72px; /* navbar height */
          height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .hero-label {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--primary);
          margin-bottom: var(--space-lg);
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          margin-bottom: var(--space-lg);
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 600px;
          margin-bottom: var(--space-2xl);
        }

        .hero-buttons {
          display: flex;
          gap: var(--space-md);
        }

        /* ── 3D ENVELOPE ── */
        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .envelope-scene {
          perspective: 800px;
          width: 320px;
          height: 260px;
          position: relative;
        }

        .envelope-body {
          position: relative;
          width: 100%;
          height: 100%;
          background: #F0EFEB;
          border: 2px solid rgba(0,0,0,0.08);
          border-radius: 8px 8px 16px 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          overflow: visible;
        }

        .envelope-flap {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          height: 100px;
          transform-origin: top center;
          transform-style: preserve-3d;
          transition: transform 0.1s linear;
          z-index: 10;
        }

        .flap-front {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #E8E6E1;
          clip-path: polygon(0 0, 50% 100%, 100% 0);
          border: 2px solid rgba(0,0,0,0.06);
          backface-visibility: hidden;
        }

        .flap-back {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #D4D2CD;
          clip-path: polygon(0 0, 50% 100%, 100% 0);
          transform: rotateX(180deg);
          backface-visibility: hidden;
        }

        .resume-doc {
          position: absolute;
          top: 30px;
          left: 24px;
          right: 24px;
          height: 200px;
          background: white;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          z-index: 5;
          overflow: hidden;
        }

        .resume-header-bar {
          width: 60%;
          height: 10px;
          background: var(--primary);
          border-radius: 4px;
          margin-bottom: 12px;
          opacity: 0.8;
        }

        .resume-line {
          height: 6px;
          background: #E8E6E1;
          border-radius: 3px;
          margin-bottom: 8px;
        }

        .resume-line.w80 { width: 80%; }
        .resume-line.w60 { width: 60%; }
        .resume-line.w90 { width: 90%; }
        .resume-line.w40 { width: 40%; }
        .resume-line.w70 { width: 70%; }
        .resume-line.w85 { width: 85%; }
        .resume-line.w50 { width: 50%; }

        .resume-section-title {
          width: 45%;
          height: 8px;
          background: var(--text-primary);
          border-radius: 4px;
          margin: 14px 0 10px;
          opacity: 0.15;
        }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary);
          box-shadow: 0 0 12px var(--primary), 0 0 30px rgba(232,82,26,0.3);
          transition: top 0.1s linear;
          z-index: 20;
        }

        .skill-pills {
          position: absolute;
          top: -60px;
          left: 0;
          right: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          z-index: 30;
          pointer-events: none;
        }

        .skill-pill {
          padding: 6px 14px;
          background: white;
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .skill-pill.accent {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* ── STATS ── */
        .stats-section {
          padding: 60px 0;
          background: transparent;
        }

        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 40px 20px;
          /* No card — blend seamlessly into the section */
          background: transparent;
          border: none;
          box-shadow: none;
        }

        .stat-cell {
          text-align: center;
          flex: 1;
        }

        .stat-cell h3 {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        .stat-cell p {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          margin: 0;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--border-primary);
          opacity: 0.6;
        }

        /* ── FEATURES ── */
        .features-section {
          padding: var(--space-3xl) 0;
          background: var(--bg-primary);
        }

        .section-header {
          text-align: left;
          margin-bottom: 60px;
        }

        .section-label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--lilac);
          margin-bottom: var(--space-md);
        }

        .section-header h2 {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: 32px;
          cursor: default;
          box-shadow: var(--shadow-sm);
          will-change: transform;
        }

        .feature-card:hover {
          box-shadow: var(--shadow-lg);
        }

        .feature-num {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--lilac);
          opacity: 0.55;
          display: block;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.9375rem;
        }

        /* ── HOW IT WORKS ── */
        .how-section {
          padding: var(--space-3xl) 0;
          background: var(--bg-secondary);
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .step-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: 40px 32px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .step-num {
          position: absolute;
          right: -10px;
          top: -30px;
          font-size: 10rem;
          font-weight: 900;
          color: rgba(0,0,0,0.03);
          line-height: 1;
          pointer-events: none;
        }

        .step-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          position: relative;
        }

        .step-card p {
          color: var(--text-secondary);
          font-size: 1rem;
          line-height: 1.6;
          position: relative;
        }

        /* ── CTA ── */
        .cta-section {
          padding: var(--space-3xl) 0;
          background: var(--bg-primary);
        }

        .cta-card {
          background: var(--text-primary);
          border-radius: var(--radius-2xl);
          padding: 80px;
          text-align: center;
        }

        .cta-card h2 {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
        }

        .cta-card p {
          color: rgba(255,255,255,0.6);
          font-size: 1.125rem;
          margin-bottom: 32px;
        }

        .cta-card .btn-primary {
          background: white;
          color: var(--text-primary);
        }

        .cta-card .btn-primary:hover {
          background: #f0f0f0;
        }

        /* ── FOOTER ── */
        .footer {
          padding: 60px 0 24px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-primary);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footer-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .footer-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .footer-links {
          display: flex;
          gap: 60px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-col h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .footer-col a {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .footer-col a:hover {
          color: var(--text-primary);
        }

        .footer-bottom {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid var(--border-primary);
        }

        .footer-bottom p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-title { font-size: 3rem; }
          .hero-visual { min-height: 300px; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .hero { padding: 60px 0 40px; }
          .hero-title { font-size: 2.5rem; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
          .stats-bar { flex-direction: column; gap: 20px; padding: 24px; }
          .stat-divider { width: 60px; height: 1px; }
          .cta-card { padding: 40px 24px; }
          .cta-card h2 { font-size: 2rem; }
          .footer-content { flex-direction: column; }
          .footer-links { flex-wrap: wrap; }
          .envelope-scene { width: 260px; height: 200px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
