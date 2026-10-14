import axios from "axios";
import { store } from "../redux/store";
import { logout, setCredentials } from "../redux/slices/authSlice";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh tokens are single-use (rotated on every refresh), so concurrent 401s
// must share one refresh request instead of racing each other.
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = () => {
  refreshPromise ??= (async () => {
    try {
      const refreshToken = store.getState().auth.refreshToken;
      if (!refreshToken) throw new Error("No refresh token");
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      store.dispatch(
        setCredentials({ accessToken, refreshToken: newRefreshToken }),
      );
      return accessToken as string;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // A 401 from login/register means bad credentials, not an expired token.
    const isAuthEndpoint = /\/auth\/(login|register|refresh-token)/.test(
      originalRequest?.url ?? "",
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
  refreshToken: (token: string) =>
    api.post("/auth/refresh-token", { refreshToken: token }),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
};

// Interview API
export const interviewAPI = {
  create: (data: any) => api.post("/interviews", data),
  getById: (id: string) => api.get(`/interviews/${id}`),
  getByMeetingId: (meetingId: string) =>
    api.get(`/interviews/meeting/${meetingId}`),
  getRecruiterInterviews: (page = 1, limit = 10) =>
    api.get(`/interviews/recruiter?page=${page}&limit=${limit}`),
  getCandidateInterviews: (page = 1, limit = 10) =>
    api.get(`/interviews/candidate?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/interviews/${id}/status`, { status }),
  getAnalytics: (companyId: string) =>
    api.get(`/interviews/analytics/${companyId}`),
};

// Proctoring / anti-cheating API
export const proctoringAPI = {
  reportEvent: (
    interviewId: string,
    event: {
      eventType: string;
      details?: string;
      metadata?: Record<string, unknown>;
    },
  ) => api.post(`/interviews/${interviewId}/proctoring/events`, event),
  getReport: (interviewId: string) =>
    api.get(`/interviews/${interviewId}/proctoring`),
};

// User API
export const userAPI = {
  getAll: (page = 1, limit = 10, role?: string, search?: string) =>
    api.get("/users", { params: { page, limit, role, search } }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.patch("/users/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/users/change-password", { currentPassword, newPassword }),
  getDashboardStats: () => api.get("/users/stats"),
};

// Job API
export const jobAPI = {
  create: (data: any) => api.post("/jobs", data),
  getAll: (companyId: string, page = 1, limit = 10) =>
    api.get(`/jobs?companyId=${companyId}&page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/jobs/${id}`),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  toggleActive: (id: string) => api.patch(`/jobs/${id}/toggle`),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

// AI API
export const aiAPI = {
  analyzeCode: (code: string, language: string) =>
    api.post("/ai/code-feedback", { code, language }),
  generateReport: (interviewId: string) =>
    api.post("/ai/interview-report", { interviewId }),
  matchResume: (resumeData: any, jobDescription: string) =>
    api.post("/ai/resume-match", { resumeData, jobDescription }),
  analyzeSentiment: (transcript: string) =>
    api.post("/ai/sentiment", { transcript }),
  getReportsByInterview: (interviewId: string) =>
    api.get(`/ai/reports/${interviewId}`),
};

// Coding API
export const codingAPI = {
  createSession: (interviewId: string, language: string) =>
    api.post("/coding", { interviewId, language }),
  getSession: (id: string) => api.get(`/coding/${id}`),
  getByInterview: (interviewId: string) =>
    api.get(`/coding/interview/${interviewId}`),
  updateCode: (id: string, code: string, language?: string) =>
    api.patch(`/coding/${id}/code`, { code, language }),
  updateOutput: (id: string, output: string, testResults?: any) =>
    api.patch(`/coding/${id}/output`, { output, testResults }),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: (companyId?: string) =>
    api.get(
      `/analytics/dashboard${companyId ? `?companyId=${companyId}` : ""}`,
    ),
  getCandidateAnalytics: (candidateId?: string) =>
    api.get(`/analytics/candidate${candidateId ? `/${candidateId}` : ""}`),
  getRecruiterAnalytics: (companyId?: string) =>
    api.get(
      `/analytics/recruiter${companyId ? `?companyId=${companyId}` : ""}`,
    ),
};

export default api;
