import api from './api';

export const userService = {
  getAll: (params) => api.get('/auth/users', { params }).then((res) => res.data),
  getById: (id) => api.get(`/auth/users/${id}`).then((res) => res.data),
  create: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  update: (id, payload) => api.put(`/auth/users/${id}`, payload).then((res) => res.data),
};