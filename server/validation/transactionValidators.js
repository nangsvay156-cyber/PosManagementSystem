const { z } = require('zod');

const poItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity_ordered: z.coerce.number().int().positive(),
  unit_cost: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.coerce.number().int().positive(),
  // order_date is nullable in the DB (PurchaseOrder model: allowNull: true),
  // so don't force the client to always send it — default to today server-side.
  order_date: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val : new Date().toISOString().slice(0, 10))),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

const receivePOSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().positive(),
        quantity_received: z.coerce.number().int().min(0),
      })
    )
    .min(1),
});

const saleItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  discount_rate: z.coerce.number().min(0).max(100).optional(),
});

const saleSchema = z.object({
  customer_id: z.coerce.number().int().positive().optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'mobile_money', 'credit', 'mixed']).optional().default('cash'),
  amount_paid: z.coerce.number().min(0).optional().default(0),
  discount_amount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
});

module.exports = {
  purchaseOrderSchema,
  receivePOSchema,
  saleSchema,
};