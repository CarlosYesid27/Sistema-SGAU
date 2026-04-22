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
  updateStatus: (enrollmentId, status) => api.put(`/enrollments/${enrollmentId}/status`, { status }),
  cancel: (enrollmentId) => api.patch(`/enrollments/me/${enrollmentId}/cancel`)
}

export const gradesApi = {
  getMyGrades: () => api.get('/grades/me'),
  getCourseGrades: (courseId) => api.get(`/grades/course/${courseId}`),
  updateGrade: (gradeId, data) => api.put(`/grades/${gradeId}`, data),
  createGrade: (payload) => api.post('/grades/', payload),
  getGradeByEnrollment: (enrollmentId) => api.get(`/grades/enrollment/${enrollmentId}`)
}

export const studentApi = {
  getMyHistory: () => api.get('/students/me/history'),
  getStudentHistory: (studentId) => api.get(`/students/${studentId}/history`)
}

export const paymentApi = {
  checkout: (payload) => api.post('/payments/checkout', payload),
  verify: (paymentCommitmentId) => api.post(`/payments/verify/${paymentCommitmentId}`)
}

export const reportApi = {
  // Admin
  academicPdf:  () => api.get('/reports/academic/pdf',    { responseType: 'blob' }),
  academicCsv:  () => api.get('/reports/academic/csv',    { responseType: 'blob' }),
  financialPdf: () => api.get('/reports/financial/pdf',   { responseType: 'blob' }),
  financialCsv: () => api.get('/reports/financial/csv',   { responseType: 'blob' }),
  coursePdf:    (id) => api.get(`/reports/course/${id}/pdf`, { responseType: 'blob' }),
  courseCsv:    (id) => api.get(`/reports/course/${id}/csv`, { responseType: 'blob' }),
  // Estudiante
  myAcademicPdf: () => api.get('/reports/me/academic/pdf', { responseType: 'blob' }),
  myAcademicCsv: () => api.get('/reports/me/academic/csv', { responseType: 'blob' }),
  myFinancialPdf: () => api.get('/reports/me/financial/pdf', { responseType: 'blob' }),
  myFinancialCsv: () => api.get('/reports/me/financial/csv', { responseType: 'blob' }),
  // Docente
  myCoursesPdf: () => api.get('/reports/me/courses/pdf', { responseType: 'blob' }),
  myCoursesCsv: () => api.get('/reports/me/courses/csv', { responseType: 'blob' }),
}
