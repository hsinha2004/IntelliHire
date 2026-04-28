import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole(null);
    navigate("/login");
  };

  const navLinks = [
    { path: "/", label: "Home" },
    ...(!isAuthenticated
      ? [
          { path: "/login", label: "Login" },
          { path: "/register", label: "Register" },
        ]
      : []),
    ...(isAuthenticated && userRole === "candidate"
      ? [{ path: "/candidate", label: "Dashboard" }]
      : []),
    ...(isAuthenticated && userRole === "recruiter"
      ? [{ path: "/recruiter", label: "Dashboard" }]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="IntelliHire" className="logo-img" />
          <span className="logo-text">IntelliHire</span>
        </Link>

        <div className="navbar-links desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-link logout">
              <span>Logout</span>
            </button>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="navbar-links mobile">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-link logout">
              <span>Logout</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(250, 250, 248, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid transparent;
          transition: all var(--transition-normal);
        }

        .navbar.scrolled {
          border-bottom-color: var(--border-primary);
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
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
          gap: 10px;
          text-decoration: none;
        }

        .logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .logo-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
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
          background: var(--bg-card);
          border-top: 1px solid var(--border-primary);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 400;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .nav-link.active {
          color: var(--lilac-dark);
          font-weight: 600;
        }

        .nav-link.logout {
          color: var(--text-muted);
        }

        .nav-link.logout:hover {
          color: var(--error);
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
          background: var(--bg-hover);
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
