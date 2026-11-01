const Joi = require('joi');

const saleItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().min(0).precision(2),
  tax_percent: Joi.number().min(0).max(100).precision(2),
  discount_amount: Joi.number().min(0).precision(2),
});

const createSaleSchema = Joi.object({
  customer_id: Joi.number().integer().positive().allow(null),
  items: Joi.array().items(saleItemSchema).min(1).required(),
  discount_amount: Joi.number().min(0).precision(2).default(0),
  amount_paid: Joi.number().min(0).precision(2).required(),
  payment_method: Joi.string()
    .valid('cash', 'card', 'mobile_money', 'bank_transfer', 'credit')
    .default('cash'),
  note: Joi.string().max(255).allow('', null),
});

const refundItemSchema = Joi.object({
  sale_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
});

const createRefundSchema = Joi.object({
  reason: Joi.string().max(255).allow('', null),
  items: Joi.array().items(refundItemSchema).min(1).required(),
});

module.exports = { createSaleSchema, createRefundSchema };