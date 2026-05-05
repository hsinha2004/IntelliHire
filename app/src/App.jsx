import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        setUserRole(user.role);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRole="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRole="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <AnimatedRoutes />
          </main>

          <style jsx>{`
            .app {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }

            .main-content {
              flex: 1;
            }

            .loading-screen {
              min-height: calc(100vh - 72px);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: var(--space-md);
              color: var(--text-secondary);
            }

            .loading-screen .spinner {
              width: 40px;
              height: 40px;
              border-width: 4px;
            }
          `}</style>
        </div>
      </Router>
    </MotionConfig>
  );
}

export default App;
