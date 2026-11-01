const { error } = require('../utils/apiResponse');

// Usage: router.post('/products', authenticate, authorize('admin'), createProduct)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, { message: 'Not authenticated', statusCode: 401 });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, {
        message: `Access denied. Requires role: ${allowedRoles.join(' or ')}`,
        statusCode: 403,
      });
    }

    next();
  };
};

module.exports = authorize;