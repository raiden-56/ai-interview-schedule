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

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.getState().auth.refreshToken;
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refreshToken,
          },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        store.dispatch(
          setCredentials({ accessToken, refreshToken: newRefreshToken }),
        );

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

// User API
export const userAPI = {
  getAll: (page = 1, limit = 10, role?: string) =>
    api.get(`/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ""}`),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.patch("/users/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/users/change-password", { currentPassword, newPassword }),
  getDashboardStats: () => api.get("/users/stats"),
};

export default api;
