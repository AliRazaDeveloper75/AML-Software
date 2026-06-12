import api from '../lib/api'

export const dashboardService = {
  // Org stats (plan usage)
  getOrgStats: () => api.get('/tenants/organization/stats/').then(r => r.data),

  // Alert summary (open/by severity)
  getAlertSummary: () => api.get('/aml/alerts/summary/').then(r => r.data),

  // Recent transactions (last 10 flagged)
  getRecentFlagged: () =>
    api.get('/accounting/transactions/', { params: { is_flagged: true, page_size: 10 } }).then(r => r.data),

  // Unreviewed monitoring alerts
  getUnreviewedCount: () => api.get('/monitoring/alerts/unreviewed_count/').then(r => r.data),

  // Notification unread count
  getNotificationCount: () => api.get('/notifications/unread-count/').then(r => r.data),

  // KYC stats (counts by status)
  getKYCStats: () =>
    api.get('/kyc/customers/', { params: { page_size: 1 } }).then(r => r.data),
}
