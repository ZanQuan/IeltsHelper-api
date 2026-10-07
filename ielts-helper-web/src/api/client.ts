import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const PUBLIC_AUTH_URLS = [
  '/api/Auth/login',
  '/api/Auth/google',
  '/api/Auth/register',
  '/api/Auth/forgot-password',
  '/api/Auth/reset-password',
];

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isPublicAuthCall = PUBLIC_AUTH_URLS.some((p) => url.includes(p));
    const hadSession = !!localStorage.getItem('token');

    if (status === 401 && hadSession && !isPublicAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
