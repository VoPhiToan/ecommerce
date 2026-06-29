import api from './axios';

export const productApi = {
  getAll:  (params) => api.get('/products', { params }),
  getById: (id)     => api.get(`/products/${id}`),
  create:  (data)   => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:  (id, data) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove:  (id) => api.delete(`/products/${id}`),
};
