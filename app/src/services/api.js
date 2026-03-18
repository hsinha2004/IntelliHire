import axios from "axios";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Authentication API (using existing backend endpoints)
export const authAPI = {
  // Register - uses /users/ endpoint
  register: (data) => api.post("/users/", data),
  
  // Login - uses /users/ endpoint to find user by email (simple approach)
  login: async (email, password) => {
    // For now, we'll create a mock login since backend doesn't have auth
    // In production, backend should have proper auth endpoints
    try {
      // Try to get user by checking if they exist
      // This is a simplified approach - backend should have proper login
      const response = await api.get("/users/");
      const users = response.data || [];
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Mock successful login
      return {
        data: {
          access_token: "mock_token_" + user.id,
          user: user
        }
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Get current user from localStorage
  getMe: () => {
    const user = localStorage.getItem("user");
    return Promise.resolve({ data: user ? JSON.parse(user) : null });
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// Resume API
export const resumeAPI = {
  upload: (file, userId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    return api.post("/upload-resume/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  
  getById: (resumeId) => api.get(`/resumes/${resumeId}`),
  
  getUserResumes: (userId) => api.get(`/users/${userId}/resumes`),
  
  getRecommendations: (resumeId) => api.get(`/resumes/${resumeId}/recommendations`),
  
  getSkillProfile: (userId) => api.get(`/users/${userId}/skill-profile`),
};

// Jobs API
export const jobsAPI = {
  getAll: () => api.get("/jobs/"),
  
  getById: (jobId) => api.get(`/jobs/${jobId}`),
  
  create: (data, recruiterId) => api.post(`/jobs/?recruiter_id=${recruiterId}`, data),
  
  getCandidates: (jobId, minScore = 0) => 
    api.get(`/jobs/${jobId}/candidates?min_score=${minScore}`),
};

// Matching API
export const matchingAPI = {
  matchResumeToJob: (resumeId, jobId) => 
    api.post(`/match/${resumeId}/${jobId}`),
  
  getJobRecommendations: (resumeId) => 
    api.get(`/resumes/${resumeId}/recommendations`),
};

// Analytics API
export const analyticsAPI = {
  getSkillAnalytics: () => api.get("/analytics/skills"),
};

// AI Models API (mock endpoints for now)
export const aiAPI = {
  rankCandidates: (jobId, model = "bert") => 
    api.get(`/jobs/${jobId}/candidates`).then(res => ({
      data: {
        candidates: res.data.candidates,
        model: model
      }
    })),
  
  compareModels: (jobId) => 
    api.get(`/jobs/${jobId}/candidates`).then(res => {
      const candidates = res.data.candidates || [];
      return {
        data: {
          comparisons: candidates.slice(0, 5).map(c => ({
            candidate_id: c.resume_id,
            bert_score: c.similarity_score,
            tfidf_score: Math.max(0, c.similarity_score - 5 + Math.random() * 10),
            xgboost_score: Math.max(0, c.similarity_score - 3 + Math.random() * 8),
            variance: Math.random() * 15
          }))
        }
      };
    }),
  
  getModels: () => Promise.resolve({
    data: [
      { id: "bert", name: "BERT", description: "Deep learning model" },
      { id: "tfidf", name: "TF-IDF", description: "Statistical approach" },
      { id: "xgboost", name: "XGBoost", description: "Gradient boosting" }
    ]
  }),
};

export default api;
