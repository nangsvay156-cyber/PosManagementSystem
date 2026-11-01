import api from './api';

export const saleService = {
  getAll:          (params)          => api.get('/sales', { params }).then((r) => r.data),
  getById:         (id)              => api.get(`/sales/${id}`).then((r) => r.data),
  create:          (payload)         => api.post('/sales', payload).then((r) => r.data),
  refund:          (id, payload)     => api.post(`/sales/${id}/refund`, payload).then((r) => r.data),
  getInvoiceData:  (id)              => api.get(`/sales/${id}/invoice`).then((r) => r.data.data), // ✅
};