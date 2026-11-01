const { Sale, SaleItem, Product, Customer, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { generateInvoicePDF } = require('../services/invoiceService');

// GET /api/invoices/:saleId/pdf
const getInvoicePDF = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.saleId, {
    include: [
      { model: Customer, attributes: ['id', 'name', 'phone', 'email'] },
      { model: User, attributes: ['id', 'name'] },
      { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] },
    ],
  });

  if (!sale) throw new AppError('Sale not found', 404);

  generateInvoicePDF(sale, res);
});

module.exports = { getInvoicePDF };