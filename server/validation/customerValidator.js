const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  address: Joi.string().max(255).allow('', null),
  is_active: Joi.boolean().default(true),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  address: Joi.string().max(255).allow('', null),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createCustomerSchema, updateCustomerSchema };