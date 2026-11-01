const { Op } = require('sequelize');
const { Supplier, Product, PurchaseOrder } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getSuppliers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { company_name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const { count, rows } = await Supplier.findAndCountAll({
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

const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) throw new AppError('Supplier not found', 404);
  return success(res, { data: supplier });
});

const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  return success(res, { message: 'Supplier created', data: supplier, statusCode: 201 });
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) throw new AppError('Supplier not found', 404);

  await supplier.update(req.body);
  return success(res, { message: 'Supplier updated', data: supplier });
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) throw new AppError('Supplier not found', 404);

  const [productCount, poCount] = await Promise.all([
    Product.count({ where: { supplier_id: supplier.id } }),
    PurchaseOrder.count({ where: { supplier_id: supplier.id } }),
  ]);

  if (productCount > 0 || poCount > 0) {
    throw new AppError('Cannot delete: supplier has linked products or purchase orders. Deactivate instead.', 409);
  }

  await supplier.destroy();
  return success(res, { message: 'Supplier deleted' });
});

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };