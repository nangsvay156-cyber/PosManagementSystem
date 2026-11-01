const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(255).allow('', null),
  is_active: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(255).allow('', null),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createCategorySchema, updateCategorySchema };