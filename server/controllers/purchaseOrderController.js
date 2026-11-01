const {
  sequelize,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  Supplier,
  User,
  StockMovement,
} = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { generateDocNumber } = require('../utils/generateDocNumber');

const poIncludes = [
  { model: Supplier, attributes: ['id', 'name', 'company_name'] },
  { model: User, attributes: ['id', 'full_name'] },
  {
    model: PurchaseOrderItem,
    as: 'items',
    include: [{ model: Product, attributes: ['id', 'name', 'sku'] }],
  },
];

// GET /api/purchase-orders
const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await PurchaseOrder.findAndCountAll({
    where,
    include: poIncludes,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false, 
  });

  return success(res, {
    data: rows,
    meta: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// GET /api/purchase-orders/:id
const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: poIncludes });
  if (!po) throw new AppError('Purchase order not found', 404);
  return success(res, { data: po });
});

// POST /api/purchase-orders
const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplier_id, order_date, expected_date, notes, items } = req.body;

  const supplier = await Supplier.findByPk(supplier_id);
  if (!supplier) throw new AppError('Supplier not found', 404);

  const result = await sequelize.transaction(async (t) => {
    const po_number = await generateDocNumber(PurchaseOrder, 'po_number', 'PO');

    let subtotal = 0;
    let taxAmount = 0;

    const itemRows = items.map((item) => {
      const lineSubtotal = item.unit_cost * item.quantity_ordered;
      const lineTax = lineSubtotal * ((item.tax_rate || 0) / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      return {
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
        tax_rate: item.tax_rate || 0,
        line_total: lineSubtotal + lineTax,
      };
    });

    const po = await PurchaseOrder.create(
      {
        po_number,
        supplier_id,
        user_id: req.user.id,
        status: 'pending',
        order_date: order_date || null,
        expected_date: expected_date || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
        notes,
      },
      { transaction: t }
    );

    await PurchaseOrderItem.bulkCreate(
      itemRows.map((row) => ({ ...row, purchase_order_id: po.id })),
      { transaction: t }
    );

    return po;
  });

  const fullPO = await PurchaseOrder.findByPk(result.id, { include: poIncludes });
  return success(res, { message: 'Purchase order created', data: fullPO, statusCode: 201 });
});

// PATCH /api/purchase-orders/:id/status
const updatePurchaseOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new AppError('Purchase order not found', 404);

  if (['received', 'partially_received'].includes(po.status)) {
    throw new AppError('Cannot change status of a PO that has already received stock', 409);
  }

  po.status = status;
  await po.save();
  return success(res, { message: 'Status updated', data: po });
});

// POST /api/purchase-orders/:id/receive
const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const po = await PurchaseOrder.findByPk(req.params.id, {
    include: [{ model: PurchaseOrderItem, as: 'items' }],
  });
  if (!po) throw new AppError('Purchase order not found', 404);
  if (po.status === 'received' || po.status === 'cancelled') {
    throw new AppError(`Purchase order is already ${po.status}`, 409);
  }

  const result = await sequelize.transaction(async (t) => {
    for (const receivedItem of items) {
      const poItem = po.items.find((i) => i.product_id === receivedItem.product_id);
      if (!poItem) {
        throw new AppError(`Product ${receivedItem.product_id} is not part of this PO`, 400);
      }

      const remainingQty = poItem.quantity_ordered - poItem.quantity_received;
      if (receivedItem.quantity_received > remainingQty) {
        throw new AppError(
          `Cannot receive more than remaining quantity (${remainingQty}) for product ${receivedItem.product_id}`,
          400
        );
      }
      if (receivedItem.quantity_received === 0) continue;

      const product = await Product.findByPk(receivedItem.product_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const stockBefore = product.stock_quantity;
      const stockAfter = stockBefore + receivedItem.quantity_received;

      product.stock_quantity = stockAfter;
      product.cost_price = poItem.unit_cost;
      await product.save({ transaction: t });

     await StockMovement.create(
  {
    product_id: product.id,
    user_id: req.user.id,
    type: 'purchase',
    quantity_change: receivedItem.quantity_received,
    quantity_before: stockBefore,
    quantity_after: stockAfter,
    reference_type: 'purchase_order',
    reference_id: po.id,
    note: `Received via ${po.po_number}`,
  },
  { transaction: t }
);

      poItem.quantity_received += receivedItem.quantity_received;
      await poItem.save({ transaction: t });
    }

    const refreshedItems = await PurchaseOrderItem.findAll({
      where: { purchase_order_id: po.id },
      transaction: t,
    });

    const allReceived = refreshedItems.every((i) => i.quantity_received >= i.quantity_ordered);
    const anyReceived = refreshedItems.some((i) => i.quantity_received > 0);

    po.status = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;
    if (allReceived) po.received_date = new Date();
    await po.save({ transaction: t });

    return po;
  });

  const fullPO = await PurchaseOrder.findByPk(result.id, { include: poIncludes });
  return success(res, { message: 'Stock received', data: fullPO });
});

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
};