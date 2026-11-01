const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  is_active: z.coerce.boolean().optional().default(true),
});
const categoryUpdateSchema = categorySchema.partial();

const supplierSchema = z.object({
  name: z.string().min(2).max(150),
  company_name: z.string().max(150).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  tax_number: z.string().max(50).optional().nullable(),
  is_active: z.coerce.boolean().optional().default(true),
});
const supplierUpdateSchema = supplierSchema.partial();

const customerSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  credit_limit: z.coerce.number().min(0).optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
});
const customerUpdateSchema = customerSchema.partial();

module.exports = {
  categorySchema,
  categoryUpdateSchema,
  supplierSchema,
  supplierUpdateSchema,
  customerSchema,
  customerUpdateSchema,
};