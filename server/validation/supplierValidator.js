const Joi = require('joi');

const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  company_name: Joi.string().max(150).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  address: Joi.string().max(255).allow('', null),
  tax_number: Joi.string().max(50).allow('', null),
  is_active: Joi.boolean().default(true),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  company_name: Joi.string().max(150).allow('', null),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  address: Joi.string().max(255).allow('', null),
  tax_number: Joi.string().max(50).allow('', null),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createSupplierSchema, updateSupplierSchema };