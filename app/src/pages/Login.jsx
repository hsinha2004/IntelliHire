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
      
      // Save token and user data
      const user = response.data.user;
      localStorage.setItem("token", response.data.access_token);
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
        err.message ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">


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
                    "Sign In"
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

      <style>{`
        .auth-page {
          min-height: calc(100vh - 72px);
          display: flex;
        }

        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: calc(100vh - 72px);
          background: var(--bg-secondary);
          padding: var(--space-xl);
        }

        .auth-form-container {
          width: 100%;
          max-width: 480px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          padding: 48px;
          box-shadow: var(--shadow-lg);
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
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .form-header p {
          color: var(--text-secondary);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
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

        .form-input {
          padding: 0.875rem 1rem;
        }

        .input-wrapper {
          position: relative;
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
          color: var(--primary);
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
          color: var(--primary);
          font-weight: 600;
        }

        .form-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
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
