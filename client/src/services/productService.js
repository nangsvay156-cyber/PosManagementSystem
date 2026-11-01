import api from './api';

export const productService = {
  getAll: (params) => api.get('/products', { params }).then((res) => res.data),
  getById: (id) => api.get(`/products/${id}`).then((res) => res.data),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`).then((res) => res.data),
  getStockHistory: (id) => api.get(`/products/${id}/stock-history`).then((res) => res.data),
  create: (formData) =>
    api
      .post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data),
  update: (id, formData) =>
    api
      .put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data),
  adjustStock: (id, quantity_change, note) => {
    const type = quantity_change >= 0 ? 'adjustment_in' : 'adjustment_out';
    const quantity = Math.abs(quantity_change);

    return api
      .patch(`/products/${id}/stock`, { quantity, type, note })
      .then((res) => res.data);
  },
  remove: (id) => api.delete(`/products/${id}`).then((res) => res.data),
};