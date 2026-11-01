const { Op } = require('sequelize');
const { Customer, Sale } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const { count, rows } = await Customer.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['name', 'ASC']],
  });

  return success(res, {
    data: rows,
    meta: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / limit) },
  });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw new AppError('Customer not found', 404);
  return success(res, { data: customer });
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  return success(res, { message: 'Customer created', data: customer, statusCode: 201 });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw new AppError('Customer not found', 404);

  await customer.update(req.body);
  return success(res, { message: 'Customer updated', data: customer });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw new AppError('Customer not found', 404);

  const saleCount = await Sale.count({ where: { customer_id: customer.id } });
  if (saleCount > 0) {
    throw new AppError('Cannot delete: customer has sales history. Deactivate instead.', 409);
  }

  await customer.destroy();
  return success(res, { message: 'Customer deleted' });
});

// GET /api/customers/:id/sales - purchase history for a customer
const getCustomerSales = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw new AppError('Customer not found', 404);

  const sales = await Sale.findAll({
    where: { customer_id: customer.id },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  return success(res, { data: sales });
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSales,
};