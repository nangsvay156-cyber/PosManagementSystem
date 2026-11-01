import api from './api';

export const authService = {
  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }).then((res) => res.data),

  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((res) => res.data),

  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((res) => res.data),

  getMe: () => api.get('/auth/me').then((res) => res.data),

  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
};