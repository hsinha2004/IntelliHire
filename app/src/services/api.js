import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

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
  register: (data) => api.post("/auth/register", data),

  login: async (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const response = await api.post("/auth/login", form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    // The backend login returns the user object directly, but the app frontend expects 
    // { data: { access_token, user } } based on the original mock implementation
    return {
      data: {
        access_token: "backend_token_" + response.data.id,
        user: response.data
      }
    };
  },

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
  
  toggleShare: (resumeId, shared) => api.put(`/resumes/${resumeId}/share`, { shared }),
  
  delete: (resumeId) => api.delete(`/resumes/${resumeId}`),
};

// Jobs API
export const jobsAPI = {
  getAll: () => api.get("/jobs/"),
  
  getById: (jobId) => api.get(`/jobs/${jobId}`),
  
  create: (data, recruiterId) => api.post(`/jobs/?recruiter_id=${recruiterId}`, data),

  update: (jobId, data) => api.put(`/jobs/${jobId}`, data),
  
  delete: (jobId) => api.delete(`/jobs/${jobId}`),
  
  getCandidates: (jobId, minScore = 0) => 
    api.get(`/jobs/${jobId}/candidates?min_score=${minScore}`),
    
  uploadCandidates: (jobId, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    return api.post(`/jobs/${jobId}/upload-candidates`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
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
  })
};

// Live Jobs API
export const BASE_URL = API_BASE_URL;

export const getLiveJobs = (resumeId, location = 'in', limit = 20) =>
  axios.get(`${BASE_URL}/resumes/${resumeId}/live-jobs`,
    { params: { location, limit } });

export const searchLiveJobs = (query, location = 'in', limit = 20) =>
  axios.get(`${BASE_URL}/live-jobs/search`,
    { params: { query, location, limit } });

export default api;
