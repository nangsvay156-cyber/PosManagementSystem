const { Product, StockMovement } = require('../models');

/**
 * The ONLY function in the app that should ever change Product.stock_quantity.
 * Every caller (sales, purchase receiving, returns, manual adjustments) goes
 * through here so the stock_movements audit trail can never be skipped.
 *
 * @param {Object} params
 * @param {number} params.productId
 * @param {number} params.quantityChange - positive = stock in, negative = stock out
 * @param {string} params.type - 'purchase' | 'sale' | 'adjustment' | 'return_in' | 'return_out' | 'initial'
 * @param {number|null} params.userId - who triggered this change
 * @param {string|null} params.referenceType - e.g. 'sale', 'purchase_order'
 * @param {number|null} params.referenceId
 * @param {string|null} params.note
 * @param {import('sequelize').Transaction} params.transaction - REQUIRED, caller must wrap in a transaction
 * @param {boolean} params.allowNegative - if false, throws when result would go below 0
 */
const applyStockChange = async ({
  productId,
  quantityChange,
  type,
  userId = null,
  referenceType = null,
  referenceId = null,
  note = null,
  transaction,
  allowNegative = false,
}) => {
  if (!transaction) {
    throw new Error('applyStockChange requires a transaction.');
  }
  // Lock the row to prevent race conditions on concurrent sales of the same product
  const product = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!product) {
    const err = new Error(`Product ${productId} not found.`);
    err.statusCode = 404;
    throw err;
  }
  const quantityBefore = product.stock_quantity;
  const quantityAfter = quantityBefore + quantityChange;
  if (!allowNegative && quantityAfter < 0) {
    const err = new Error(
      `Insufficient stock for "${product.name}". Available: ${quantityBefore}, requested: ${Math.abs(quantityChange)}.`
    );
    err.statusCode = 409;
    throw err;
  }
  product.stock_quantity = quantityAfter;
  await product.save({ transaction });
  await StockMovement.create(
    {
      product_id: productId,
      user_id: userId,
      type,
      quantity_change: quantityChange,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      note,
    },
    { transaction }
  );
  return product;
};

module.exports = { applyStockChange };