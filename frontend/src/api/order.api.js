import api from './axios';

export const orderApi = {
  create:       (data) => api.post('/orders', data),
  getMyOrders:  ()     => api.get('/orders/my-orders'),
  getAll:       (params) => api.get('/orders', { params }),
  getById:      (id)   => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}`, data),
};