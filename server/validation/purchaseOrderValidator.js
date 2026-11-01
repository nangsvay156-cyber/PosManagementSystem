const Joi = require('joi');

const poItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  unit_cost: Joi.number().min(0).precision(2).required(),
});

const createPurchaseOrderSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().required(),
  notes: Joi.string().max(255).allow('', null),
  items: Joi.array().items(poItemSchema).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'ordered', 'cancelled').required(),
});

const receiveItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  received_quantity: Joi.number().integer().positive().required(),
});

const receivePurchaseOrderSchema = Joi.object({
  items: Joi.array().items(receiveItemSchema).min(1).required(),
});

module.exports = {
  createPurchaseOrderSchema,
  updateStatusSchema,
  receivePurchaseOrderSchema,
};