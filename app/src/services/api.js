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
  
  applyToJob: (resumeId, jobId) => api.post(`/resumes/${resumeId}/apply/${jobId}`),
  
  withdrawFromJob: (resumeId, jobId) => api.post(`/resumes/${resumeId}/withdraw/${jobId}`),
  
  delete: (resumeId) => api.delete(`/resumes/${resumeId}`),

  getPdfUrl: (resumeId) => `${API_BASE_URL}/resumes/${resumeId}/pdf`,
  
  getFeedback: (resumeId, data) => api.post(`/resumes/${resumeId}/feedback`, data),
};

// Jobs API
export const jobsAPI = {
  getAll: (recruiterId) => api.get(recruiterId ? `/jobs/?recruiter_id=${recruiterId}` : "/jobs/"),
  
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
  
  updateCandidateStatus: (jobId, resumeId, status) => 
    api.put(`/jobs/${jobId}/candidates/${resumeId}/status`, { status }),
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

// Seeded random for consistent mock scores
const getSeededRandom = (str) => {
  let h = 0;
  for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(152501029, h);
    return ((h >>> 0) / 4294967296);
  };
};

// AI Models API (mock endpoints for now)
export const aiAPI = {
  rankCandidates: (jobId, model = "bert") => 
    api.get(`/jobs/${jobId}/candidates`).then(res => {
      const candidates = (res.data.candidates || []).map(c => {
        const rand = getSeededRandom(c.resume_id || 'default');
        const r1 = rand();
        const r2 = rand();
        const bert = c.similarity_score;
        const tfidf = Math.max(0, Math.min(100, bert - 5 + r1 * 10));
        const xgboost = Math.max(0, Math.min(100, bert - 3 + r2 * 8));
        
        let finalScore = bert;
        if (model === "tfidf") finalScore = tfidf;
        if (model === "xgboost") finalScore = xgboost;
        
        return {
          ...c,
          similarity_score: finalScore,
          bert_score: bert,
          tfidf_score: tfidf,
          xgboost_score: xgboost,
        };
      });
      // Re-sort based on the new similarity score
      candidates.sort((a, b) => b.similarity_score - a.similarity_score);
      return {
        data: {
          candidates: candidates,
          model: model
        }
      };
    }),
  
  compareModels: (jobId) => 
    api.get(`/jobs/${jobId}/candidates`).then(res => {
      const candidates = res.data.candidates || [];
      return {
        data: {
          comparisons: candidates.slice(0, 5).map(c => {
            const rand = getSeededRandom(c.resume_id || 'default');
            const r1 = rand();
            const r2 = rand();
            const bert = c.similarity_score;
            const tfidf = Math.max(0, Math.min(100, bert - 5 + r1 * 10));
            const xgboost = Math.max(0, Math.min(100, bert - 3 + r2 * 8));
            return {
              candidate_id: c.resume_id,
              bert_score: bert,
              tfidf_score: tfidf,
              xgboost_score: xgboost,
              variance: Math.max(bert, tfidf, xgboost) - Math.min(bert, tfidf, xgboost)
            };
          })
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
