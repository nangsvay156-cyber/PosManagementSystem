const { error } = require('../utils/apiResponse');
const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    return error(res, { statusCode: 400, message: `Upload error: ${err.message}` });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return error(res, { statusCode: 409, message: `${field} already exists` });
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return error(res, { statusCode: 422, message: 'Validation failed', errors });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, { statusCode: 409, message: 'This record is referenced by other data' });
  }

  if (err.statusCode) {
    return error(res, { statusCode: err.statusCode, message: err.message });
  }

  return error(res, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};

const notFound = (req, res) => {
  return error(res, { statusCode: 404, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };