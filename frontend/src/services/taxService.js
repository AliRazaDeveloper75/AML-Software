import api from '../lib/api'

export const taxService = {
  // VAT
  computeVAT: (periodStart, periodEnd) =>
    api.get('/tax/vat/compute/', { params: { period_start: periodStart, period_end: periodEnd } }).then(r => r.data),
  generateVATReturn: (data) => api.post('/tax/vat/generate/', data).then(r => r.data),
  getVATReturns: () => api.get('/tax/vat/').then(r => r.data),
  fileVATReturn: (id, ftaReference) => api.post(`/tax/vat/${id}/file/`, { fta_reference: ftaReference }).then(r => r.data),

  // Corporate Tax
  computeCT: (taxYear) => api.get('/tax/corporate-tax/compute/', { params: { tax_year: taxYear } }).then(r => r.data),
  generateCTReturn: (taxYear) => api.post('/tax/corporate-tax/generate/', { tax_year: taxYear }).then(r => r.data),
  getCTReturns: () => api.get('/tax/corporate-tax/').then(r => r.data),
  fileCTReturn: (id, mofReference) => api.post(`/tax/corporate-tax/${id}/file/`, { mof_reference: mofReference }).then(r => r.data),
}
