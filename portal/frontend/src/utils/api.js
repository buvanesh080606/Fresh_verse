import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? (import.meta.env.VITE_API_BASE_URL.endsWith('/') ? import.meta.env.VITE_API_BASE_URL : `${import.meta.env.VITE_API_BASE_URL}/`)
  : 'http://127.0.0.1:8000/';

const API_BASE_URL = `${BASE_URL}api/v1/`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt token refresh (we'll build a standard endpoint mapping to DRF SimpleJWT TokenRefreshView if needed, or handles mock refresh)
          const response = await axios.post(`${API_BASE_URL}auth/refresh/`, {
            refresh: refreshToken,
          });
          
          if (response.status === 200) {
            const { access } = response.data;
            localStorage.setItem('access_token', access);
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Only log out if it is an explicit auth error indicating the token is invalid/expired (e.g. 400 or 401)
          if (refreshError.response?.status && [400, 401, 403].includes(refreshError.response.status)) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
};

export default api;
