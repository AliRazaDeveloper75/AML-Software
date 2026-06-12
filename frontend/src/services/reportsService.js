import api from '../lib/api'

export const reportsService = {
  getReports: (params) => api.get('/reports/', { params }).then(r => r.data),
  generateReport: (data) => api.post('/reports/', data).then(r => r.data),
  downloadReport: (id) => api.get(`/reports/${id}/download/`, { responseType: 'blob' }).then(r => r.data),
}
