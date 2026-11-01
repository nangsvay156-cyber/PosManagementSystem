const { Op } = require('sequelize');
const { sequelize, Sale, SaleItem, Product, Category, StockMovement } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/reports/sales?period=daily|monthly&from=&to=
 * Groups completed sales by day (or month) for charting.
 * Defaults: daily report = last 30 days, monthly report = last 12 months.
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'daily', from, to } = req.query;

  const now = new Date();
  let rangeStart;
  let rangeEnd = to ? new Date(`${to}T23:59:59`) : now;
  const dateFormat = period === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

  if (from) {
    rangeStart = new Date(`${from}T00:00:00`);
  } else if (period === 'monthly') {
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else {
    rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
  }

  const results = await Sale.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'period'],
      [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'total_sales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax'],
      [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discount'],
    ],
    where: {
      status: 'completed',
      created_at: { [Op.between]: [rangeStart, rangeEnd] },
    },
    group: ['period'],
    order: [[sequelize.col('period'), 'ASC']],
    raw: true,
  });

  return success(res, 200, `${period} sales report fetched.`, results, {
    from: rangeStart,
    to: rangeEnd,
  });
});

/**
 * GET /api/reports/top-products?from=&to=&limit=
 * Best sellers by quantity sold, within an optional date range.
 */
const getTopProducts = asyncHandler(async (req, res) => {
  const { from, to, limit = 10 } = req.query;

  const where = {};
  if (from || to) {
    where['$Sale.created_at$'] = {};
    if (from) where['$Sale.created_at$'][Op.gte] = new Date(`${from}T00:00:00`);
    if (to) where['$Sale.created_at$'][Op.lte] = new Date(`${to}T23:59:59`);
  }
  where['$Sale.status$'] = 'completed';

  const results = await SaleItem.findAll({
    attributes: [
      'product_id',
      [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'total_quantity_sold'],
      [sequelize.fn('SUM', sequelize.col('SaleItem.subtotal')), 'total_revenue'],
    ],
    include: [
      { model: Product, attributes: ['name', 'sku', 'image'] },
      { model: Sale, attributes: [] }, // join only, no extra columns
    ],
    where,
    group: ['product_id', 'Product.id'],
    order: [[sequelize.literal('total_quantity_sold'), 'DESC']],
    limit: Number(limit),
    subQuery: false,
  });

  return success(res, 200, 'Top products fetched.', results);
});

/**
 * GET /api/reports/low-stock
 * Products at or below their low_stock_alert threshold.
 */
const getLowStockReport = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: {
      is_active: true,
      stock_quantity: { [Op.lte]: sequelize.col('low_stock_alert') },
    },
    include: [{ model: Category, attributes: ['name'] }],
    order: [['stock_quantity', 'ASC']],
  });

  return success(res, 200, 'Low stock report fetched.', products);
});

/**
 * GET /api/reports/profit?from=&to=
 * Estimated profit = revenue (excl. tax) - cost of goods sold, for completed sales.
 */
const getProfitReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const where = {};
  where['$Sale.status$'] = 'completed';
  if (from || to) {
    where['$Sale.created_at$'] = {};
    if (from) where['$Sale.created_at$'][Op.gte] = new Date(`${from}T00:00:00`);
    if (to) where['$Sale.created_at$'][Op.lte] = new Date(`${to}T23:59:59`);
  }

  const rows = await SaleItem.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('SaleItem.subtotal')), 'total_revenue'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal('SaleItem.quantity * Product.cost_price')
        ),
        'total_cost',
      ],
    ],
    include: [
      { model: Product, attributes: [] },
      { model: Sale, attributes: [] },
    ],
    where,
    raw: true,
    subQuery: false,
  });

  const totalRevenue = Number(rows[0]?.total_revenue || 0);
  const totalCost = Number(rows[0]?.total_cost || 0);

  return success(res, 200, 'Profit report fetched.', {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    estimated_profit: Math.round((totalRevenue - totalCost) * 100) / 100,
  });
});

module.exports = { getSalesReport, getTopProducts, getLowStockReport, getProfitReport };