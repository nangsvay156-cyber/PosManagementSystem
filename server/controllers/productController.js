
const { Op, col } = require('sequelize');
const fs = require('fs');
const path = require('path');

const {
  Product,
  Category,
  Supplier,
  StockMovement,
  sequelize,
} = require('../models');

const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const {
  sendLowStockAlert,
  sendStockAdjustmentAlert,
} = require('../services/telegramService');

const productIncludes = [
  { model: Category, attributes: ['id', 'name'] },
  { model: Supplier, attributes: ['id', 'name'] },
];

// GET /api/products?page=1&limit=20&search=&category_id=&low_stock=true
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category_id,
    low_stock,
    is_active,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } },
    ];
  }

  if (category_id) {
    where.category_id = category_id;
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true';
  }

  if (low_stock === 'true') {
    where.stock_quantity = {
      [Op.lte]: col('low_stock_alert'),
    };
  }

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: productIncludes,
    limit: Number(limit),
    offset,
    order: [['name', 'ASC']],
  });

  return success(res, {
    data: rows,
    meta: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    },
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: productIncludes,
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return success(res, { data: product });
});

// GET /api/products/barcode/:code
const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: {
      barcode: req.params.code,
      is_active: true,
    },
    include: productIncludes,
  });

  if (!product) {
    throw new AppError('Product not found for this barcode', 404);
  }

  return success(res, { data: product });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (req.file) {
    data.image = `/uploads/products/${req.file.filename}`;
  }

  const existingSku = await Product.findOne({
    where: { sku: data.sku },
  });

  if (existingSku) {
    throw new AppError('SKU already exists', 409);
  }

  if (data.barcode) {
    const existingBarcode = await Product.findOne({
      where: { barcode: data.barcode },
    });

    if (existingBarcode) {
      throw new AppError('Barcode already exists', 409);
    }
  }

  const product = await Product.create(data);

  return success(res, {
    message: 'Product created',
    data: product,
    statusCode: 201,
  });
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const data = { ...req.body };

  if (req.file) {
    if (product.image) {
      const oldPath = path.join(
        __dirname,
        '..',
        product.image.replace(/^\/+/, '')
      );

      fs.unlink(oldPath, () => {});
    }

    data.image = `/uploads/products/${req.file.filename}`;
  }

  await product.update(data);

  return success(res, {
    message: 'Product updated',
    data: product,
  });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await product.destroy();

  return success(res, {
    message: 'Product deleted',
  });
});

// PATCH /api/products/:id/stock
// Manual stock adjustment + Telegram notifications
const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type, note } = req.body;

  // 1. Validate quantity
  const amount = Number(quantity);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError(
      'Quantity must be a positive integer',
      400
    );
  }

  // 2. Validate adjustment type
  if (!['adjustment_in', 'adjustment_out'].includes(type)) {
    throw new AppError(
      'Invalid stock adjustment type',
      400
    );
  }

  let lowStockAlert = null;
  let stockAdjustmentAlert = null;

  // 3. Start database transaction
  const result = await sequelize.transaction(async (t) => {

    // Find and lock product
    const product = await Product.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 4. Get stock information
    const stockBefore = Number(product.stock_quantity);
    const threshold = Number(product.low_stock_alert);

    // 5. Calculate stock change
    const delta =
      type === 'adjustment_in'
        ? amount
        : -amount;

    const stockAfter = stockBefore + delta;

    // 6. Prevent negative stock
    if (stockAfter < 0) {
      throw new AppError(
        'Stock cannot go below zero',
        400
      );
    }

    // 7. Update product stock
    product.stock_quantity = stockAfter;

    await product.save({
      transaction: t,
    });

    // 8. Save stock movement history
    await StockMovement.create(
      {
        product_id: product.id,
        user_id: req.user.id,
        type: 'adjustment',
        quantity_change: delta,
        quantity_before: stockBefore,
        quantity_after: stockAfter,
        reference_type: 'manual',
        reference_id: null,
        note: note || 'Manual stock adjustment',
      },
      {
        transaction: t,
      }
    );

    // 9. Prepare STOCK IN / STOCK OUT notification
    stockAdjustmentAlert = {
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      stockBefore,
      stockAfter,
      quantityChange: delta,
      note: note || 'Manual stock adjustment',

      userName: req.user?.name || req.user?.username || 'Unknown User',
    };

    // 10. Prepare LOW STOCK notification
    // Only when reducing stock that is already low
    if (
      type === 'adjustment_out' &&
      stockBefore <= threshold
    ) {
      lowStockAlert = {
        name: product.name,
        sku: product.sku,
        stock: stockAfter,
        unit: product.unit,
        threshold,

        userName: req.user?.name || req.user?.username || 'Unknown User',
      };
    }

    return product;
  });

  // 11. Transaction has committed.
  // Send Telegram messages outside the transaction.

  try {
    await sendStockAdjustmentAlert(stockAdjustmentAlert);
  } catch (error) {
    console.error(
      'Stock adjustment Telegram error:',
      error.message
    );
  }

  if (lowStockAlert) {
    try {
      await sendLowStockAlert(lowStockAlert);
    } catch (error) {
      console.error(
        'Low-stock Telegram error:',
        error.message
      );
    }
  }

  // 12. Return response
  return success(res, {
    message: 'Stock adjusted',
    data: result,
  });
});

module.exports = {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
};
