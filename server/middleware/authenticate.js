
const { error } = require('../utils/apiResponse');
const { User } = require('../models');
const { verifyAccessToken } = require('../utils/tokenUtils');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, { statusCode: 401, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, { statusCode: 401, message: 'Access token expired' });
      }
      return error(res, { statusCode: 401, message: 'Invalid token' });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    if (!user || !user.is_active) {
      return error(res, { statusCode: 401, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, { statusCode: 401, message: 'Authentication failed' });
  }
};

module.exports = authenticate;