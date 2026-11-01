const { Op } = require('sequelize');
const { sequelize, Sale, Product, Customer, User } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/dashboard/summary
 * One-call summary for the main dashboard: today/this-month totals,
 * low stock count, total active products/customers, and recent sales.
 */
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    lowStockCount,
    activeProductCount,
    activeCustomerCount,
    recentSales,
  ] = await Promise.all([
    Sale.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: { status: 'completed', created_at: { [Op.between]: [startOfToday, endOfToday] } },
      raw: true,
    }),
    Sale.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: { status: 'completed', created_at: { [Op.gte]: startOfMonth } },
      raw: true,
    }),
    Product.count({
      where: { is_active: true, stock_quantity: { [Op.lte]: sequelize.col('low_stock_alert') } },
    }),
    Product.count({ where: { is_active: true } }),
    Customer.count({ where: { is_active: true } }),
    Sale.findAll({
      limit: 8,
      order: [['created_at', 'DESC']],
      include: [
        { model: Customer, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] },
      ],
    }),
  ]);

  return success(res, 200, 'Dashboard summary fetched.', {
    today: {
      sales_count: Number(todaySales[0]?.count || 0),
      revenue: Number(todaySales[0]?.revenue || 0),
    },
    this_month: {
      sales_count: Number(monthSales[0]?.count || 0),
      revenue: Number(monthSales[0]?.revenue || 0),
    },
    low_stock_count: lowStockCount,
    active_products: activeProductCount,
    active_customers: activeCustomerCount,
    recent_sales: recentSales,
  });
});

module.exports = { getSummary };    