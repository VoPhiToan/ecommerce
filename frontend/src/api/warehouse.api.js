import api from './axios';

export const warehouseApi = {
  getAll:  ()         => api.get('/warehouses'),
  getById: (id)       => api.get(`/warehouses/${id}`),
  create:  (data)     => api.post('/warehouses', data),
  update:  (id, data) => api.put(`/warehouses/${id}`, data),
  remove:  (id)       => api.delete(`/warehouses/${id}`),
};
