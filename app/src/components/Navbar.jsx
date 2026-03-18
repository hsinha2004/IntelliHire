import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Brain, 
  Home, 
  LogIn, 
  UserPlus, 
  User, 
  Briefcase, 
  LogOut,
  Menu,
  X
} from "lucide-react";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      setIsAuthenticated(true);
      try {
        const userData = JSON.parse(user);
        setUserRole(userData.role);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole(null);
    navigate("/login");
  };

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    ...(!isAuthenticated
      ? [
          { path: "/login", label: "Login", icon: LogIn },
          { path: "/register", label: "Register", icon: UserPlus },
        ]
      : []),
    ...(isAuthenticated && userRole === "candidate"
      ? [{ path: "/candidate", label: "Dashboard", icon: User }]
      : []),
    ...(isAuthenticated && userRole === "recruiter"
      ? [{ path: "/recruiter", label: "Dashboard", icon: Briefcase }]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Brain size={28} />
          </div>
          <span className="logo-text">IntelliHire</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
          
          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-link logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="navbar-links mobile">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
          
          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-link logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-primary);
        }

        .navbar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 var(--space-lg);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-glow);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .navbar-links.desktop {
          display: flex;
        }

        .navbar-links.mobile {
          display: none;
          flex-direction: column;
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-primary);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          background: none;
          border: none;
          cursor: pointer;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .nav-link.active {
          color: var(--primary-light);
          background: rgba(59, 130, 246, 0.15);
        }

        .nav-link.logout {
          color: var(--error);
        }

        .nav-link.logout:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--radius-md);
        }

        .mobile-menu-btn:hover {
          background: var(--bg-tertiary);
        }

        @media (max-width: 768px) {
          .navbar-links.desktop {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .navbar-links.mobile {
            display: flex;
          }

          .nav-link {
            width: 100%;
            padding: var(--space-md);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
