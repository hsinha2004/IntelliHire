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
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="branding-logo">
              <Brain size={48} />
            </div>
            <h1>Get Started</h1>
            <p>
              Join IntelliHire today and experience the future of AI-powered 
              recruitment. Find your dream job or the perfect candidate.
            </p>
            <div className="branding-features">
              {features.map((feature, index) => (
                <div key={index} className="branding-feature">
                  <feature.icon size={20} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
                    <UserCircle size={24} />
                    <span>Candidate</span>
                    <p>Looking for jobs</p>
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
                    <Briefcase size={24} />
                    <span>Recruiter</span>
                    <p>Hiring talent</p>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
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

              <div className="form-row">
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
                    <Lock size={18} className="input-icon" />
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
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
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

        .branding-feature svg {
          color: rgba(255, 255, 255, 0.9);
        }

        /* Form Side */
        .auth-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          background: var(--bg-primary);
          overflow-y: auto;
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

        /* Role Selection */
        .role-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .role-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }

        .role-option input {
          display: none;
        }

        .role-option svg {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .role-option span {
          font-weight: 600;
          color: var(--text-primary);
        }

        .role-option p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }

        .role-option:hover {
          border-color: var(--border-secondary);
        }

        .role-option.active {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .role-option.active svg {
          color: var(--primary);
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
