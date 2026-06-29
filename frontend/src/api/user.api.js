import api from './axios';

export const userApi = {
  getAll:  ()           => api.get('/users'),
  getById: (id)         => api.get(`/users/${id}`),
  update:  (id, data)   => api.put(`/users/${id}`, data),
  remove:  (id)         => api.delete(`/users/${id}`),
};
