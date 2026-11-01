import api from './api';

export const reportService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }).then((res) => res.data),
  getTopProducts: (params) => api.get('/reports/top-products', { params }).then((res) => res.data),
  getLowStock: () => api.get('/reports/low-stock').then((res) => res.data),
  getProfit: (params) => api.get('/reports/profit', { params }).then((res) => res.data),
};

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary').then((res) => res.data),
};
