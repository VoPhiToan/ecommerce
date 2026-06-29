import api from './axios';

export const cartApi = {
  get:    ()          => api.get('/cart'),
  add:    (data)      => api.post('/cart/add', data),
  update: (data)      => api.put('/cart/update', data),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear:  ()          => api.delete('/cart'),
};