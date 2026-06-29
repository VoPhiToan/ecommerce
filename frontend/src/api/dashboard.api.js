import api from './axios';

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
  metrics:  () => api.get('/dashboard/metrics'),
  sales:    () => api.get('/dashboard/sales'),
};
