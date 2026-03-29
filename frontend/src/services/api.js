import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============== Authentication API ==============

export const authAPI = {
  register: (data) => api.post("/auth/register", data),

  login: (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api.post("/auth/login", form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },

  getMe: () => api.get("/auth/me"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// ============== Resume API ==============

export const resumeAPI = {
  upload: (file, userId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", String(userId));
    return api.post("/upload-resume/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getById: (resumeId) => api.get(`/resumes/${resumeId}`),

  getUserResumes: (userId) => api.get(`/users/${userId}/resumes`),

  getRecommendations: (resumeId) =>
    api.get(`/resumes/${resumeId}/recommendations`),

  getSkillProfile: (userId) => api.get(`/users/${userId}/skill-profile`),
};

// ============== Jobs API ==============

export const jobsAPI = {
  getAll: () => api.get("/jobs/"),

  getById: (jobId) => api.get(`/jobs/${jobId}`),

  create: (data, recruiterId) =>
    api.post(`/jobs/?recruiter_id=${recruiterId}`, data),

  getCandidates: (jobId, minScore = 0) =>
    api.get(`/jobs/${jobId}/candidates?min_score=${minScore}`),
};

// ============== Matching API ==============

export const matchingAPI = {
  matchResumeToJob: (resumeId, jobId) =>
    api.post(`/match/${resumeId}/${jobId}`),

  getJobRecommendations: (resumeId) =>
    api.get(`/resumes/${resumeId}/recommendations`),
};

// ============== Analytics API ==============

export const analyticsAPI = {
  getSkillAnalytics: () => api.get("/analytics/skills"),
};

// ============== AI Models API ==============
// NOTE: These endpoints do not exist in the backend yet — will return 404

export const aiAPI = {
  rankCandidates: (jobId, model = "bert") =>
    api.post(`/ai/rank/${jobId}`, { model }),

  compareModels: (jobId) => api.get(`/ai/compare/${jobId}`),

  getModels: () => api.get("/ai/models"),
};

export default api;