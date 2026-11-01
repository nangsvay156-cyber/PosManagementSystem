const { Category, Product } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  return success(res, { data: categories });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  return success(res, { data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  return success(res, { message: 'Category created', data: category, statusCode: 201 });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  await category.update(req.body);
  return success(res, { message: 'Category updated', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const productCount = await Product.count({ where: { category_id: category.id } });
  if (productCount > 0) {
    throw new AppError(
      `Cannot delete: ${productCount} product(s) belong to this category. Deactivate it instead.`,
      409
    );
  }

  await category.destroy();
  return success(res, { message: 'Category deleted' });
});

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };