import api from '../lib/api'

export const monitoringService = {
  getRules: (params) => api.get('/monitoring/rules/', { params }).then(r => r.data),
  toggleRule: (id) => api.post(`/monitoring/rules/${id}/toggle/`).then(r => r.data),
  getAlerts: (params) => api.get('/monitoring/alerts/', { params }).then(r => r.data),
  reviewAlert: (id, data) => api.post(`/monitoring/alerts/${id}/review/`, data).then(r => r.data),
  getUnreviewedCount: () => api.get('/monitoring/alerts/unreviewed_count/').then(r => r.data),
}
