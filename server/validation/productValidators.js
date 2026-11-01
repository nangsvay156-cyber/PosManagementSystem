const { z } = require('zod');

const productSchema = z.object({
  category_id: z.coerce.number().int().positive(),
  supplier_id: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().min(2).max(150),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  unit: z.string().max(20).optional().default('pcs'),
  cost_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  tax_percent: z.coerce.number().min(0).max(100).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  stock_quantity: z.coerce.number().int().min(0).optional().default(0),
  low_stock_alert: z.coerce.number().int().min(0).optional().default(10),
  is_active: z.coerce.boolean().optional().default(true),
});

const productUpdateSchema = productSchema.partial();

module.exports = { productSchema, productUpdateSchema };