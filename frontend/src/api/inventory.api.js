import api from './axios';

export const inventoryApi = {
  getByWarehouse: (warehouseId)             => api.get(`/inventory/warehouse/${warehouseId}`),
  stockIn:        (data)                    => api.post('/inventory/stock-in', data),
  stockOut:       (data)                    => api.post('/inventory/stock-out', data),
  getHistory:     (warehouseId, productId)  => api.get(`/inventory/history/${warehouseId}/${productId}`),
};
