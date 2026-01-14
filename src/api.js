import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
