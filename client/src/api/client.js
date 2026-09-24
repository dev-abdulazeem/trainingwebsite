import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const message = error.response.data?.message || 'Something went wrong';
      const isAuthRoute = originalRequest.url?.includes('/auth/');
      if (!isAuthRoute || error.response.status !== 401) {
        toast.error(message);
      }
      if (error.response.status === 403) {
        toast.error('Your account access has been paused. Contact support.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  dashboard: () => api.get('/users/dashboard'),
};

export const courseApi = {
  list: () => api.get('/courses'),
  get: (slug) => api.get(`/courses/${slug}`),
  getById: (id) => api.get(`/courses/${id}`),
  getLearn: (id) => api.get(`/courses/${id}/learn`),
  getFull: (id) => api.get(`/courses/${id}/full`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getStudents: (id) => api.get(`/courses/${id}/students`),
};

export const moduleApi = {
  create: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

export const lessonApi = {
  listByModule: (moduleId) => api.get(`/lessons/module/${moduleId}`),
  get: (id) => api.get(`/lessons/${id}`),
  create: (moduleId, formData) => api.post(`/modules/${moduleId}/lessons`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/lessons/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/lessons/${id}`),
};

export const progressApi = {
  track: (data) => api.post('/progress/track', data),
  complete: (data) => api.post('/progress/complete', data),
  getCourseProgress: (courseId) => api.get(`/progress/course/${courseId}`),
};

export const assignmentApi = {
  getByLesson: (lessonId) => api.get(`/assignments/lesson/${lessonId}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
};

export const submissionApi = {
  create: (data) => api.post('/submissions', data),
  getPending: () => api.get('/submissions/pending'),
  getMy: () => api.get('/submissions/my'),
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),
};

export const couponApi = {
  list: () => api.get('/coupons'),
  validate: (code, courseId) => api.get(`/coupons/validate/${code}?courseId=${courseId}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  toggle: (id) => api.patch(`/coupons/${id}/toggle`),
};

export const paymentApi = {
  initialize: (data) => api.post('/payments/initialize', data),
  verify: (reference) => api.get('/payments/verify', { params: { reference } }),
  history: () => api.get('/payments/history'),
};

// ✅ UPDATED COMMUNITY API (Added 'pin')
export const communityApi = {
  list: (params) => api.get('/community', { params }),
  get: (id) => api.get(`/community/${id}`),
  create: (data) => api.post('/community', data),
  reply: (id, data) => api.post(`/community/${id}/reply`, data),
  resolve: (id) => api.put(`/community/${id}/resolve`),
  pin: (id) => api.put(`/community/${id}/pin`), // 👈 ADDED THIS
  delete: (id) => api.delete(`/community/${id}`),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  toggleStudentStatus: (id) => api.patch(`/admin/students/${id}/toggle-status`),
  getStudentProgress: (id) => api.get(`/admin/students/${id}/progress`),
  releaseLesson: (id) => api.post(`/admin/lessons/${id}/release`),
  broadcast: (data) => api.post('/admin/broadcast', data),
};

export const uploadApi = {
  video: (formData) => api.post('/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  file: (formData) => api.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submission: (formData) => api.post('/upload/submission', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (publicId, resourceType) => api.delete(`/upload/${publicId}?resourceType=${resourceType}`),
};

export default apiClient;