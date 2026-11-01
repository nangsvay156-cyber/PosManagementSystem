const { error } = require('../utils/apiResponse');

const validate = (schema) => {
  return (req, res, next) => {
    // Zod schema
    if (typeof schema.safeParse === 'function') {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return error(res, 422, 'Validation failed', errors);
      }
      req.body = result.data;
      return next();
    }

    // Joi schema
    const { error: validationError, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (validationError) {
      const errors = validationError.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return error(res, 422, 'Validation failed', errors);
    }
    req.body = value;
    next();
  };
};

module.exports = validate;