import api from '../lib/api'

export const usersService = {
  getUsers: (params) => api.get('/users/', { params }).then(r => r.data),
  getUser: (id) => api.get(`/users/${id}/`).then(r => r.data),
  inviteUser: (data) => api.post('/users/invite/', data).then(r => r.data),
  deactivateUser: (id) => api.post(`/users/${id}/deactivate/`).then(r => r.data),
  reactivateUser: (id) => api.post(`/users/${id}/reactivate/`).then(r => r.data),
  changePassword: (data) => api.post('/users/change-password/', data).then(r => r.data),
  getRoles: () => api.get('/users/roles/').then(r => r.data),
  getOrg: () => api.get('/org/').then(r => r.data),
  updateOrg: (data) => api.patch('/org/', data).then(r => r.data),
  getOrgStats: () => api.get('/org/stats/').then(r => r.data),
}
