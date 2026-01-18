import axios from 'axios';

// Use direct URL in development, relative in production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isDevelopment 
  ? 'http://localhost:3002/api' 
  : (process.env.REACT_APP_API_URL || '/api');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - access denied
        console.error('Access denied:', data.error);
      } else if (status === 404) {
        // Not found
        console.error('Resource not found:', data.error);
      } else if (status === 500) {
        // Server error
        console.error('Server error:', data.error);
      }
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('Network error - no response from server');
      error.message = 'Network error: Unable to reach the server. Please check your connection.';
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const exams = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  submit: (id, answers) => {
    // Try to get user info from localStorage
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : null;
    return api.post(`/exams/${id}/submit`, { answers, userId });
  },
};

export const submissions = {
  getMine: () => api.get('/submissions/me'),
  getAll: () => api.get('/submissions/all'),
};

export const interviews = {
  getQuestions: () => api.get('/interviews/questions'),
  submit: (data) => api.post('/interviews/submit', data),
  getMine: () => api.get('/interviews/me'),
  getAll: () => api.get('/interviews/all'),
};

export default api;
