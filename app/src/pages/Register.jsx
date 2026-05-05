import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Brain, 
  AlertCircle,
  CheckCircle2,
  Briefcase,
  UserCircle
} from "lucide-react";
import { authAPI } from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "candidate",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Save user data (backend returns user directly)
      const user = response.data;
      localStorage.setItem("token", "mock_token_" + user.id);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      if (formData.role === "candidate") {
        navigate("/candidate");
      } else {
        navigate("/recruiter");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.detail || 
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: CheckCircle2, text: "Free forever plan" },
    { icon: CheckCircle2, text: "No credit card required" },
    { icon: CheckCircle2, text: "Cancel anytime" },
  ];

  return (
    <div className="auth-page">
      <div className="auth-container">


        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">I am a</label>
                <div className="role-selection">
                  <label 
                    className={`role-option ${formData.role === "candidate" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={formData.role === "candidate"}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <span>Candidate</span>
                  </label>
                  <label 
                    className={`role-option ${formData.role === "recruiter" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={formData.role === "recruiter"}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <span>Recruiter</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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

              <div className="form-row">
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
                      placeholder="Create password"
                      className="form-input"
                      required
                      minLength={6}
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

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="form-input"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-terms">
                <label className="terms-checkbox">
                  <input type="checkbox" required disabled={isLoading} />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="form-link">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="form-link">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Creating account...
                  </>
                ) : (
                    "Create Account"
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="form-link">
                  Sign in
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
          max-width: 520px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          padding: 48px;
          box-shadow: var(--shadow-lg);
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 480px;
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

        .role-selection {
          display: flex;
          gap: var(--space-sm);
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: var(--radius-md);
        }

        .role-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .role-option input {
          display: none;
        }

        .role-option.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .form-terms {
          font-size: 0.875rem;
        }

        .terms-checkbox {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .terms-checkbox input {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          accent-color: var(--primary);
          flex-shrink: 0;
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

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .role-selection {
            grid-template-columns: 1fr;
          }

          .auth-form-container {
            padding: var(--space-md);
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
