import api from './api';

export const purchaseOrderService = {
  getAll: (params) => api.get('/purchase-orders', { params }).then((res) => res.data),
  getById: (id) => api.get(`/purchase-orders/${id}`).then((res) => res.data),
  create: (payload) => {
    console.log('PO PAYLOAD BEING SENT:', JSON.stringify(payload, null, 2)); // ← add this
    return api.post('/purchase-orders', payload)
      .then((res) => res.data)
      .catch((err) => {
        console.log('PO VALIDATION ERRORS:', err.response?.data); // ← add this
        throw err;
      });
  },
  updateStatus: (id, status) =>
    api.patch(`/purchase-orders/${id}/status`, { status }).then((res) => res.data),
  receive: (id, items) =>
    api.post(`/purchase-orders/${id}/receive`, { items }).then((res) => res.data),
};