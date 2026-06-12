import api from '../lib/api'

export const amlService = {
  // Screenings
  getScreenings: (params) => api.get('/aml/screenings/', { params }).then(r => r.data),
  getScreening: (id) => api.get(`/aml/screenings/${id}/`).then(r => r.data),
  markFalsePositive: (id, reason) => api.post(`/aml/screenings/${id}/mark-false-positive/`, { reason }).then(r => r.data),

  // Alerts
  getAlerts: (params) => api.get('/aml/alerts/', { params }).then(r => r.data),
  getAlert: (id) => api.get(`/aml/alerts/${id}/`).then(r => r.data),
  getAlertSummary: () => api.get('/aml/alerts/summary/').then(r => r.data),
  resolveAlert: (id, data) => api.post(`/aml/alerts/${id}/resolve/`, data).then(r => r.data),
  assignAlert: (id, userId) => api.post(`/aml/alerts/${id}/assign/`, { user_id: userId }).then(r => r.data),

  // Watchlists
  getWatchlists: () => api.get('/aml/watchlists/').then(r => r.data),
  getWatchlistEntries: (id, params) => api.get(`/aml/watchlists/${id}/entries/`, { params }).then(r => r.data),

  // Transaction rules
  getRules: () => api.get('/aml/rules/').then(r => r.data),
  toggleRule: (id) => api.post(`/aml/rules/${id}/toggle/`).then(r => r.data),
}
