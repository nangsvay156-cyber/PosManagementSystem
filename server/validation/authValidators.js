const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('admin', 'cashier').default('cashier'),
  phone: Joi.string().max(20).allow('', null),
});

const loginSchema = Joi.object({
  identifier: Joi.string().min(1).required().messages({
    'string.empty': 'Username or email is required',
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(1).required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required(),
  newPassword: Joi.string().min(6).max(100).required(),
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  username: Joi.string().min(3).max(50),
  role: Joi.string().valid('admin', 'cashier'),
  phone: Joi.string().max(20).allow('', null),
  is_active: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided.',
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateUserSchema,
};