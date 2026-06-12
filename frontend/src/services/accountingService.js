import api from '../lib/api'

export const accountingService = {
  // Accounts
  getAccounts: (params) => api.get('/accounting/accounts/', { params }).then(r => r.data),
  getTrialBalance: () => api.get('/accounting/accounts/trial-balance/').then(r => r.data),
  createAccount: (data) => api.post('/accounting/accounts/', data).then(r => r.data),

  // Journal entries
  getJournalEntries: (params) => api.get('/accounting/journal-entries/', { params }).then(r => r.data),
  getJournalEntry: (id) => api.get(`/accounting/journal-entries/${id}/`).then(r => r.data),
  createJournalEntry: (data) => api.post('/accounting/journal-entries/', data).then(r => r.data),
  postEntry: (id) => api.post(`/accounting/journal-entries/${id}/post/`).then(r => r.data),
  reverseEntry: (id) => api.post(`/accounting/journal-entries/${id}/reverse/`).then(r => r.data),

  // Invoices
  getInvoices: (params) => api.get('/accounting/invoices/', { params }).then(r => r.data),
  getInvoice: (id) => api.get(`/accounting/invoices/${id}/`).then(r => r.data),
  createInvoice: (data) => api.post('/accounting/invoices/', data).then(r => r.data),
  markSent: (id) => api.post(`/accounting/invoices/${id}/mark_sent/`).then(r => r.data),
  recordPayment: (id, amount) => api.post(`/accounting/invoices/${id}/record_payment/`, { amount }).then(r => r.data),

  // Transactions
  getTransactions: (params) => api.get('/accounting/transactions/', { params }).then(r => r.data),
  createTransaction: (data) => api.post('/accounting/transactions/', data).then(r => r.data),
  flagTransaction: (id, reason) => api.post(`/accounting/transactions/${id}/flag/`, { reason }).then(r => r.data),

  // Expenses
  getExpenses: (params) => api.get('/accounting/expenses/', { params }).then(r => r.data),
  createExpense: (data) => api.post('/accounting/expenses/', data).then(r => r.data),
  deleteExpense: (id) => api.delete(`/accounting/expenses/${id}/`).then(r => r.data),
}
