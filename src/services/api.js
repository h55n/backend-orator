import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s — AI generation can take time
})

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  demoLogin:()     => api.post('/auth/demo'),
  me:       ()     => api.get('/auth/me'),
}

// ── Question Generation ───────────────────────────────────────
export const questionService = {
  generate: (params) => api.post('/questions/generate', params),
  getHistory: (page = 0, size = 10) =>
    api.get(`/questions/history?page=${page}&size=${size}`),
  getSessionById: (sessionId) => api.get(`/questions/session/${sessionId}`),
  search: (params) => api.get('/questions/search', { params }),
  deleteSession: (sessionId) => api.delete(`/questions/session/${sessionId}`),
  assessSession: (sessionId, data) => api.post(`/questions/session/${sessionId}/assess`, data),
}

// ── Favorites ─────────────────────────────────────────────────
export const favoriteService = {
  add:    (questionId) => api.post(`/favorites/${questionId}`),
  remove: (questionId) => api.delete(`/favorites/${questionId}`),
  getAll: (page = 0, size = 20) =>
    api.get(`/favorites?page=${page}&size=${size}`),
}

// ── Reference Data ────────────────────────────────────────────
export const referenceService = {
  getJobRoles:    () => api.get('/reference/job-roles'),
  getTechnologies:() => api.get('/reference/technologies'),
}

export default api
