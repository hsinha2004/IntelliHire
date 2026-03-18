import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Brain, AlertCircle } from "lucide-react";
import { authAPI } from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      // ✅ FIXED: Backend returns the user object directly (no access_token, no getMe needed)
      const user = response.data;

      // Save a fake token (email-based) and the user object
      localStorage.setItem("token", btoa(user.email)); // simple token, not JWT
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      if (user.role === "candidate") {
        navigate("/candidate");
      } else if (user.role === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="branding-logo">
              <Brain size={48} />
            </div>
            <h1>Welcome Back</h1>
            <p>
              Sign in to access your IntelliHire dashboard and continue your
              AI-powered recruitment journey.
            </p>
            <div className="branding-features">
              <div className="branding-feature">
                <div className="feature-dot"></div>
                <span>AI Resume Analysis</span>
              </div>
              <div className="branding-feature">
                <div className="feature-dot"></div>
                <span>Smart Candidate Ranking</span>
              </div>
              <div className="branding-feature">
                <div className="feature-dot"></div>
                <span>Skill Gap Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={isLoading} />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="form-link">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: calc(100vh - 72px);
          display: flex;
        }

        .auth-container {
          display: flex;
          width: 100%;
          min-height: calc(100vh - 72px);
        }

        /* Branding Side */
        .auth-branding {
          flex: 1;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3xl);
          position: relative;
          overflow: hidden;
        }

        .auth-branding::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .branding-content {
          position: relative;
          z-index: 1;
          max-width: 400px;
          color: white;
        }

        .branding-logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-xl);
          backdrop-filter: blur(10px);
        }

        .branding-content h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: var(--space-md);
          color: white;
        }

        .branding-content p {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: var(--space-2xl);
          line-height: 1.6;
        }

        .branding-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .branding-feature {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          font-weight: 500;
        }

        .feature-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
        }

        /* Form Side */
        .auth-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          background: var(--bg-primary);
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 420px;
        }

        .form-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .form-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
        }

        .form-header p {
          color: var(--text-secondary);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          color: var(--error);
          font-size: 0.875rem;
          margin-bottom: var(--space-lg);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .form-input {
          padding-left: 3rem;
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-xs);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: var(--text-primary);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .remember-me input {
          width: 16px;
          height: 16px;
          accent-color: var(--primary);
        }

        .forgot-password {
          color: var(--primary-light);
          font-weight: 500;
        }

        .forgot-password:hover {
          text-decoration: underline;
        }

        .btn-full {
          width: 100%;
        }

        .form-footer {
          text-align: center;
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: 1px solid var(--border-primary);
        }

        .form-footer p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .form-link {
          color: var(--primary-light);
          font-weight: 600;
        }

        .form-link:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .auth-branding {
            display: none;
          }

          .auth-form-container {
            padding: var(--space-xl);
          }
        }

        @media (max-width: 480px) {
          .auth-form-container {
            padding: var(--space-md);
          }

          .form-options {
            flex-direction: column;
            gap: var(--space-md);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;