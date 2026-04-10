import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'sgau_token'
const ROLE_KEY = 'sgau_role'

export const api = axios.create({
  baseURL: API_URL
})

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getRole: () => localStorage.getItem(ROLE_KEY),
  setRole: (role) => localStorage.setItem(ROLE_KEY, role),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
  }
}

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  getMe: () => api.get('/auth/me')
}

export const usersApi = {
  getAll: () => api.get('/auth/users'),
  update: (id, payload) => api.put(`/auth/users/${id}`, payload),
  remove: (id) => api.delete(`/auth/users/${id}`)
}

export const courseApi = {
  getAll: () => api.get('/courses/'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post('/courses/', payload),
  update: (id, payload) => api.put(`/courses/${id}`, payload),
  remove: (id) => api.delete(`/courses/${id}`),
  addPrerequisite: (courseId, prereqId) => api.post(`/courses/${courseId}/prerequisites`, { prerequisite_id: prereqId }),
  removePrerequisite: (courseId, prereqId) => api.delete(`/courses/${courseId}/prerequisites/${prereqId}`)
}

export const enrollmentApi = {
  enroll: (courseId) => api.post(`/enrollments/course/${courseId}`),
  getMyEnrollments: () => api.get('/enrollments/me'),
  getMyPayments: () => api.get('/enrollments/me/payments'),
  getSlots: () => api.get('/enrollments/slots'),
  getCourseEnrollments: (courseId) => api.get(`/enrollments/course/${courseId}`),
  updateStatus: (enrollmentId, status) => api.put(`/enrollments/${enrollmentId}/status`, { status })
}

export const gradesApi = {
  // Estudiante: ve sus propias notas
  getMyGrades: () => api.get('/grades/me'),
  // Docente/Admin: ve notas de una materia
  getCourseGrades: (courseId) => api.get(`/grades/course/${courseId}`),
  // Docente/Admin: actualiza/ingresa nota
  updateGrade: (gradeId, data) => api.put(`/grades/${gradeId}`, data),
  // Docente/Admin: crea registro de nota para un estudiante
  createGrade: (payload) => api.post('/grades/', payload),
  // Obtener nota por inscripción
  getGradeByEnrollment: (enrollmentId) => api.get(`/grades/enrollment/${enrollmentId}`)
}

export const studentApi = {
  getMyHistory: () => api.get('/students/me/history'),
  getStudentHistory: (studentId) => api.get(`/students/${studentId}/history`)
}
