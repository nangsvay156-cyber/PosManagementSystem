const { Op } = require('sequelize');
const {
  sequelize,
  Sale,
  SaleItem,
  SaleReturn,
  SaleReturnItem,
  Product,
  Customer,
  User,
} = require('../models');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateDocNumber } = require('../utils/generateDocNumber');
const { applyStockChange } = require('../services/stockService');
const { generateInvoicePDF } = require('../services/invoiceService'); // ✅ fixed casing
const { sendLowStockAlert } = require('../services/telegramService');

const saleInclude = [
  { model: Customer, attributes: ['id', 'name', 'phone', 'email'] },
  { model: User, attributes: ['id', 'full_name', 'username'] },
  {
    model: SaleItem,
    as: 'items',
    include: [{ model: Product, attributes: ['id', 'name', 'sku', 'unit'] }],
  },
];

/**
 * GET /api/sales?customer_id=&user_id=&status=&payment_status=&from=&to=&page=&limit=
 */
const getAllSales = asyncHandler(async (req, res) => {
  const {
    customer_id,
    user_id,
    status,
    payment_status,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};
  if (customer_id) where.customer_id = customer_id;
  if (user_id) where.user_id = user_id;
  if (status) where.status = status;
  if (payment_status) where.payment_status = payment_status;

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(`${from}T00:00:00`);
    if (to) where.created_at[Op.lte] = new Date(`${to}T23:59:59`);
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await Sale.findAndCountAll({
    where,
    include: saleInclude,
    limit: Number(limit),
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return success(res, 200, 'Sales fetched.', rows, {
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / Number(limit)),
  });
});

const getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, { include: saleInclude });
  if (!sale) return error(res, 404, 'Sale not found.');
  return success(res, 200, 'Sale fetched.', sale);
});

/**
 * POST /api/sales
 */
const createSale = asyncHandler(async (req, res) => {
  const { customer_id, items, discount_amount = 0, amount_paid, payment_method, note } = req.body;

  const lowStockAlerts = [];
  const result = await sequelize.transaction(async (t) => {
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id, { transaction: t });
      if (!customer) {
        const err = new Error('Customer not found.');
        err.statusCode = 422;
        throw err;
      }
    }

    let subtotal = 0;
    let taxTotal = 0;
    let lineDiscountTotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) {
        const err = new Error(`Product ID ${item.product_id} does not exist.`);
        err.statusCode = 422;
        throw err;
      }
      if (!product.is_active) {
        const err = new Error(`Product "${product.name}" is inactive and cannot be sold.`);
        err.statusCode = 422;
        throw err;
      }

      const unitPrice = item.unit_price !== undefined ? Number(item.unit_price) : Number(product.selling_price);
      const taxPercent = item.tax_percent !== undefined ? Number(item.tax_percent) : Number(product.tax_percent);
      const lineDiscount = item.discount_amount !== undefined ? Number(item.discount_amount) : Number(product.discount);

      const grossLine = unitPrice * item.quantity;
      const afterDiscount = Math.max(grossLine - lineDiscount, 0);
      const taxAmount = afterDiscount * (taxPercent / 100);
      const lineSubtotal = afterDiscount + taxAmount;

      subtotal += grossLine;
      taxTotal += taxAmount;
      lineDiscountTotal += lineDiscount;

      preparedItems.push({
        product,
        quantity: item.quantity,
        unit_price: unitPrice,
        tax_percent: taxPercent,
        discount_amount: lineDiscount,
        subtotal: lineSubtotal,
      });
    }

    const totalDiscount = lineDiscountTotal + Number(discount_amount);
    const totalAmount = subtotal - lineDiscountTotal + taxTotal - Number(discount_amount);
    const roundedTotal = Math.max(Math.round(totalAmount * 100) / 100, 0);

    let paymentStatus = 'paid';
    if (payment_method === 'credit' || Number(amount_paid) < roundedTotal) {
      paymentStatus = Number(amount_paid) <= 0 ? 'unpaid' : 'partial';
    }

    const changeDue = Math.max(Number(amount_paid) - roundedTotal, 0);
    const invoiceNumber = await generateDocNumber(Sale, 'invoice_number', 'INV', t);

    const sale = await Sale.create(
      {
        invoice_number: invoiceNumber,
        customer_id: customer_id || null,
        user_id: req.user.id,
        subtotal,
        tax_amount: taxTotal,
        discount_amount: totalDiscount,
        total_amount: roundedTotal,
        amount_paid,
        change_due: changeDue,
        payment_method,
        payment_status: paymentStatus,
        status: 'completed',
        note,
      },
      { transaction: t }
    );

    for (const item of preparedItems) {
      await SaleItem.create(
        {
          sale_id: sale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
        },
        { transaction: t }
      );

      // Lock and read the latest stock before changing it.
      const currentProduct = await Product.findByPk(item.product.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!currentProduct) {
        const err = new Error(`Product ${item.product.id} not found.`);
        err.statusCode = 404;
        throw err;
      }

      const stockBefore = Number(currentProduct.stock_quantity);
      const threshold = Number(currentProduct.low_stock_alert);

      // Keep stock changes and stock-movement auditing in the existing service.
      const updatedProduct = await applyStockChange({
        productId: item.product.id,
        quantityChange: -item.quantity,
        type: 'sale',
        userId: req.user.id,
        referenceType: 'sale',
        referenceId: sale.id,
        note: `Sold via POS (Invoice ${sale.invoice_number})`,
        transaction: t,
      });

      const stockAfter = Number(updatedProduct.stock_quantity);

      // Alert only when stock crosses from above the threshold to at/below it.
      if (
         Number.isFinite(threshold) &&
         stockBefore <= threshold &&
         stockAfter < stockBefore
      ) {
        lowStockAlerts.push({
          name: updatedProduct.name,
          sku: updatedProduct.sku,
          stock: stockAfter,
          threshold,
          unit: updatedProduct.unit,

          userName: req.user?.name || req.user?.username || 'Unknown User',
        });
      }
    }

    if (customer_id && paymentStatus !== 'paid') {
      const outstanding = roundedTotal - Number(amount_paid);
      await Customer.increment('credit_balance', {
        by: outstanding,
        where: { id: customer_id },
        transaction: t,
      });
    }

    return sale.reload({ transaction: t, include: saleInclude });
  });

  // The transaction has committed. Telegram failures must not undo the sale.
  const notificationResults = await Promise.allSettled(
    lowStockAlerts.map((product) => sendLowStockAlert(product))
  );

  notificationResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(
        'Telegram low-stock notification error:',
        result.reason?.message || result.reason
      );
    }
  });

  // ✅ NEW: fetch fresh stock levels for every product involved in this sale,
  // so the frontend can sync stock instantly without a page refresh.
  const productIds = result.items.map((i) => i.product_id);
  const updatedProducts = await Product.findAll({
    where: { id: productIds },
    attributes: ['id', 'name', 'sku', 'stock_quantity'],
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('sale:created', {
      id: result.id,
      invoice_number: result.invoice_number,
      total_amount: result.total_amount,
      created_at: result.created_at,
      updatedProducts, // ✅ NEW: lets other open registers sync live too
    });
  }

  // ✅ NEW: include updatedProducts in the HTTP response
  return success(res, 201, 'Sale completed.', {
    ...result.toJSON(),
    updatedProducts,
  });
});

/**
 * POST /api/sales/:id/refund
 */
const refundSale = asyncHandler(async (req, res) => {
  const { reason, items } = req.body;

  const result = await sequelize.transaction(async (t) => {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t,
    });

    if (!sale) {
      const err = new Error('Sale not found.');
      err.statusCode = 404;
      throw err;
    }
    if (sale.status === 'cancelled') {
      const err = new Error('Cannot refund a cancelled sale.');
      err.statusCode = 409;
      throw err;
    }

    let totalRefund = 0;
    const saleReturn = await SaleReturn.create(
      { sale_id: sale.id, user_id: req.user.id, reason, total_refund: 0 },
      { transaction: t }
    );

    for (const refundReq of items) {
      const saleItem = sale.items.find((i) => i.id === refundReq.sale_item_id);
      if (!saleItem) {
        const err = new Error(`Sale item ${refundReq.sale_item_id} does not belong to this sale.`);
        err.statusCode = 422;
        throw err;
      }
      if (refundReq.quantity > saleItem.quantity) {
        const err = new Error(
          `Cannot refund ${refundReq.quantity} units; only ${saleItem.quantity} were sold on this line.`
        );
        err.statusCode = 422;
        throw err;
      }

      const perUnitCharged = Number(saleItem.subtotal) / saleItem.quantity;
      const refundAmount = Math.round(perUnitCharged * refundReq.quantity * 100) / 100;
      totalRefund += refundAmount;

      await SaleReturnItem.create(
        {
          sale_return_id: saleReturn.id,
          sale_item_id: saleItem.id,
          product_id: saleItem.product_id,
          quantity: refundReq.quantity,
          refund_amount: refundAmount,
        },
        { transaction: t }
      );

      await applyStockChange({
        productId: saleItem.product_id,
        quantityChange: refundReq.quantity,
        type: 'return_in',
        userId: req.user.id,
        referenceType: 'sale_return',
        referenceId: saleReturn.id,
        note: `Refund against invoice ${sale.invoice_number}`,
        transaction: t,
      });
    }

    saleReturn.total_refund = totalRefund;
    await saleReturn.save({ transaction: t });

    const priorRefunds =
      (await SaleReturn.sum('total_refund', {
        where: { sale_id: sale.id, id: { [Op.ne]: saleReturn.id } },
        transaction: t,
      })) || 0;

    if (priorRefunds + totalRefund >= Number(sale.total_amount)) {
      sale.status = 'refunded';
      await sale.save({ transaction: t });
    }

    return saleReturn.reload({
      transaction: t,
      include: [{ model: SaleReturnItem, as: 'items' }],
    });
  });

  return success(res, 201, 'Refund processed.', result);
});

/**
 * GET /api/sales/:id/invoice
 * Streams a PDF invoice directly to the response.
 */
const downloadInvoice = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, { include: saleInclude });
  if (!sale) return error(res, 404, 'Sale not found.');

  generateInvoicePDF(sale, res); // ✅ handles headers, pipe, and doc.end() internally
});

module.exports = { getAllSales, getSaleById, createSale, refundSale, downloadInvoice };