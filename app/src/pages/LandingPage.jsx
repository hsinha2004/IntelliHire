import React from "react";
import { Link } from "react-router-dom";
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Users
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: FileText,
      title: "Resume Skill Extraction",
      description: "AI-powered analysis that automatically extracts and categorizes skills from resumes with high accuracy.",
      color: "#3b82f6",
    },
    {
      icon: TrendingUp,
      title: "AI Candidate Ranking",
      description: "Intelligent ranking system using BERT, TF-IDF, and XGBoost models to find the best candidates.",
      color: "#a855f7",
    },
    {
      icon: BarChart3,
      title: "Model Comparison",
      description: "Compare different AI models side-by-side to understand their predictions and confidence scores.",
      color: "#22c55e",
    },
    {
      icon: Target,
      title: "Skill Gap Analysis",
      description: "Identify missing skills and get personalized learning recommendations for career growth.",
      color: "#f59e0b",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Process hundreds of resumes in seconds with our optimized NLP pipeline.",
      color: "#06b6d4",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share job postings and candidate shortlists with your hiring team seamlessly.",
      color: "#ec4899",
    },
  ];

  const stats = [
    { value: "10K+", label: "Resumes Processed" },
    { value: "95%", label: "Accuracy Rate" },
    { value: "50+", label: "Companies Trust Us" },
    { value: "3", label: "AI Models" },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Powered by Advanced AI</span>
          </div>
          
          <h1 className="hero-title">
            AI Powered Resume Screening
            <br />
            <span className="gradient-text">and Candidate Ranking</span>
          </h1>
          
          <p className="hero-subtitle">
            Transform your recruitment process with intelligent AI models that 
            understand skills, experience, and candidate potential like never before.
          </p>
          
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Login
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="section-subtitle">
              Everything you need to streamline your hiring process and find the perfect candidates
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div 
                  className="feature-icon"
                  style={{ 
                    background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
                    color: feature.color 
                  }}
                >
                  <feature.icon size={28} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="section-subtitle">
              Simple steps to revolutionize your recruitment process
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload Resume</h3>
                <p>Candidates upload their resumes in PDF format</p>
              </div>
            </div>
            
            <div className="step-arrow">
              <ArrowRight size={24} />
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Analysis</h3>
                <p>Our AI extracts skills and analyzes experience</p>
              </div>
            </div>
            
            <div className="step-arrow">
              <ArrowRight size={24} />
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Matched</h3>
                <p>Find the perfect job or ideal candidates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to Transform Your Hiring?</h2>
              <p>
                Join thousands of companies using IntelliHire to find the best talent 
                faster and more accurately than ever before.
              </p>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
              </div>
              <div className="cta-features">
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Free to get started</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>No credit card required</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="cta-visual">
              <Brain size={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <Brain size={24} />
                <span>IntelliHire</span>
              </div>
              <p>AI-powered recruitment platform for the modern workforce.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/">Features</Link>
                <Link to="/">Pricing</Link>
                <Link to="/">API</Link>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <Link to="/">About</Link>
                <Link to="/">Blog</Link>
                <Link to="/">Careers</Link>
              </div>
              <div className="footer-column">
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

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
        }

        /* Hero Section */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3xl) var(--space-lg);
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: var(--primary);
          top: -200px;
          right: -200px;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: var(--secondary);
          bottom: -150px;
          left: -150px;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: var(--success);
          top: 50%;
          left: 30%;
          opacity: 0.2;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-full);
          color: var(--primary-light);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--space-xl);
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: var(--space-lg);
        }

        .hero-title .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto var(--space-xl);
        }

        .hero-buttons {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          margin-bottom: var(--space-3xl);
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: var(--space-3xl);
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: var(--space-xs);
        }

        /* Features Section */
        .features {
          padding: var(--space-3xl) 0;
          background: var(--bg-secondary);
        }

        .section-header {
          text-align: center;
          margin-bottom: var(--space-3xl);
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: var(--space-md);
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          transition: all var(--transition-normal);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-secondary);
          box-shadow: var(--shadow-lg);
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-lg);
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
        }

        .feature-description {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        /* How It Works */
        .how-it-works {
          padding: var(--space-3xl) 0;
        }

        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xl);
          flex-wrap: wrap;
        }

        .step {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          min-width: 280px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }

        .step-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .step-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .step-arrow {
          color: var(--primary);
        }

        /* CTA Section */
        .cta {
          padding: var(--space-3xl) 0;
          background: var(--bg-secondary);
        }

        .cta-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3xl);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-3xl);
          position: relative;
          overflow: hidden;
        }

        .cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--gradient-primary);
        }

        .cta-content {
          flex: 1;
        }

        .cta-content h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: var(--space-md);
        }

        .cta-content p {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: var(--space-xl);
          max-width: 500px;
        }

        .cta-buttons {
          margin-bottom: var(--space-lg);
        }

        .cta-features {
          display: flex;
          gap: var(--space-lg);
          flex-wrap: wrap;
        }

        .cta-feature {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .cta-feature svg {
          color: var(--success);
        }

        .cta-visual {
          width: 200px;
          height: 200px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0.3;
          flex-shrink: 0;
        }

        /* Footer */
        .footer {
          padding: var(--space-3xl) 0 var(--space-xl);
          border-top: 1px solid var(--border-primary);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3xl);
          margin-bottom: var(--space-3xl);
        }

        .footer-brand {
          max-width: 300px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-md);
        }

        .footer-brand p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .footer-links {
          display: flex;
          gap: var(--space-3xl);
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .footer-column h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-sm);
        }

        .footer-column a {
          font-size: 0.875rem;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .footer-column a:hover {
          color: var(--text-primary);
        }

        .footer-bottom {
          text-align: center;
          padding-top: var(--space-xl);
          border-top: 1px solid var(--border-primary);
        }

        .footer-bottom p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .cta-card {
            flex-direction: column;
            text-align: center;
          }

          .cta-visual {
            display: none;
          }

          .cta-features {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-stats {
            flex-direction: column;
            gap: var(--space-lg);
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .steps {
            flex-direction: column;
          }

          .step-arrow {
            transform: rotate(90deg);
          }

          .footer-content {
            flex-direction: column;
          }

          .footer-links {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
