import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // This uses the proxy configured in vite.config.ts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid or expired
      localStorage.removeItem('token');
      // Dispatching logout from here would require circular dependency or store injection.
      // We will handle specific component redirects or rely on the UI reacting to missing token.
    }
    return Promise.reject(error);
  }
);

export default api;
