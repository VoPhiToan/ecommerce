import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  refresh:  ()     => api.post('/auth/refresh'),
  profile:  ()     => api.get('/users/profile'),
};