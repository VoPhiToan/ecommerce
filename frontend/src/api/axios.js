import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // gửi cookie (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — tự động gắn access token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — tự động refresh token khi 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          // Đang refresh → đưa request vào queue chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi refresh token
          const res = await api.post('/auth/refresh');
          const newToken = res.data.accessToken;

          localStorage.setItem('accessToken', newToken);
          processQueue(null, newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh thất bại → logout
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;