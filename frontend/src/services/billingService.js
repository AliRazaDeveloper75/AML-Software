import api from '../lib/api'

export const billingService = {
  getSubscription: () => api.get('/billing/subscription/').then(r => r.data),
  getInvoices: () => api.get('/billing/invoices/').then(r => r.data),
  createCheckoutSession: (priceId) => api.post('/billing/checkout/', { price_id: priceId }).then(r => r.data),
  getBillingPortal: () => api.post('/billing/portal/').then(r => r.data),
}
