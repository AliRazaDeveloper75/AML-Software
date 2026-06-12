import api from '../lib/api'

export const kycService = {
  // Customers
  getCustomers: (params) => api.get('/kyc/customers/', { params }).then(r => r.data),
  getCustomer: (id) => api.get(`/kyc/customers/${id}/`).then(r => r.data),
  createCustomer: (data) => api.post('/kyc/customers/', data).then(r => r.data),
  updateCustomer: (id, data) => api.patch(`/kyc/customers/${id}/`, data).then(r => r.data),
  deleteCustomer: (id) => api.delete(`/kyc/customers/${id}/`).then(r => r.data),

  screenCustomer: (id) => api.post(`/kyc/customers/${id}/screen/`).then(r => r.data),
  getSumsubLink:  (id) => api.get(`/kyc/customers/${id}/sumsub-link/`).then(r => r.data),
  approveCustomer: (id, notes) => api.post(`/kyc/customers/${id}/approve/`, { notes }).then(r => r.data),
  rejectCustomer: (id, reason) => api.post(`/kyc/customers/${id}/reject/`, { reason }).then(r => r.data),
  suspendCustomer: (id, reason) => api.post(`/kyc/customers/${id}/suspend/`, { reason }).then(r => r.data),
  getTimeline: (id) => api.get(`/kyc/customers/${id}/timeline/`).then(r => r.data),

  // Documents
  getDocuments: (customerId) => api.get('/kyc/documents/', { params: { customer: customerId } }).then(r => r.data),
  uploadDocument: (formData) => api.post('/kyc/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  getDocumentUrl: (docId) => api.get(`/kyc/documents/${docId}/download-url/`).then(r => r.data),

  // UBOs
  addUBO: (customerId, data) => api.post(`/kyc/customers/${customerId}/add-ubo/`, data).then(r => r.data),
}
