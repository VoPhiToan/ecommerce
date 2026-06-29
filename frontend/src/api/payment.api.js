import api from './axios';

export const paymentApi = {
  initiate: (orderId) => api.post('/payment/initiate', { orderId }),
};
