const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is missing');
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
};

const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is missing');
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const getExpiryDate = (duration) => {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  return new Date(Date.now() + parseInt(match[1]) * units[match[2]]);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getExpiryDate,
};