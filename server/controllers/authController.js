const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, RefreshToken } = require('../models');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
} = require('../utils/tokenUtils');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * POST /api/auth/register   (admin only - see routes)
 */
const register = asyncHandler(async (req, res) => {
  const { full_name, email, username, password, role, phone } = req.body;

  const existing = await User.findOne({
    where: { [Op.or]: [{ email }, { username }] },
  });
  if (existing) {
    return error(res, 409, 'A user with this email or username already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    full_name,
    email,
    username,
    password: hashedPassword,
    role: role || 'cashier',
    phone,
  });

  return success(res, 201, 'User registered successfully.', {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    username: user.username,
    role: user.role,
  });
});

/**
 * POST /api/auth/login
 * Accepts identifier (username OR email) + password.
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.scope('withPassword').findOne({
    where: { [Op.or]: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    return error(res, 401, 'Invalid credentials.');
  }
  if (!user.is_active) {
    return error(res, 403, 'This account has been deactivated. Contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return error(res, 401, 'Invalid credentials.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user_id: user.id,
    token: refreshToken,
    expires_at: getExpiryDate(process.env.JWT_REFRESH_EXPIRES || '7d'),
  });

  user.last_login_at = new Date();
  await user.save();

  return success(res, 200, 'Login successful.', {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return error(res, 401, 'Invalid or expired refresh token. Please log in again.');
  }

  const storedToken = await RefreshToken.findOne({
    where: { token: refreshToken, user_id: decoded.id },
  });

  if (!storedToken || storedToken.revoked) {
    return error(res, 401, 'Refresh token has been revoked. Please log in again.');
  }
  if (new Date(storedToken.expires_at) < new Date()) {
    return error(res, 401, 'Refresh token expired. Please log in again.');
  }

  const user = await User.findByPk(decoded.id);
  if (!user || !user.is_active) {
    return error(res, 401, 'User no longer exists or is inactive.');
  }

  storedToken.revoked = true;
  await storedToken.save();

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user_id: user.id,
    token: newRefreshToken,
    expires_at: getExpiryDate(process.env.JWT_REFRESH_EXPIRES || '7d'),
  });

  return success(res, 200, 'Token refreshed.', {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
  }

  return success(res, 200, 'Logged out successfully.');
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, 'Current user fetched.', req.user);
});

/**
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withPassword').findByPk(req.user.id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return error(res, 401, 'Current password is incorrect.');
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  await RefreshToken.update({ revoked: true }, { where: { user_id: user.id } });

  return success(res, 200, 'Password changed successfully. Please log in again.');
});

/**
 * GET /api/auth/users   (admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, is_active, page = 1, limit = 50 } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  if (role) where.role = role;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await User.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [['full_name', 'ASC']],
  });

  return success(res, 200, 'Users fetched.', rows, {
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / Number(limit)),
  });
});

/**
 * GET /api/auth/users/:id   (admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return error(res, 404, 'User not found.');
  return success(res, 200, 'User fetched.', user);
});

/**
 * PUT /api/auth/users/:id   (admin only)
 * Guardrail: an admin can't demote or deactivate their own account.
 */
const updateUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return error(res, 404, 'User not found.');

  const { full_name, email, username, role, phone, is_active } = req.body;

  const isSelf = req.user.id === targetUser.id;
  if (isSelf && (role === 'cashier' || is_active === false)) {
    return error(res, 400, "You can't demote or deactivate your own account.");
  }

  if (email || username) {
    const conflict = await User.findOne({
      where: {
        id: { [Op.ne]: targetUser.id },
        [Op.or]: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
      },
    });
    if (conflict) {
      return error(res, 409, 'Another user already has this email or username.');
    }
  }

  await targetUser.update({ full_name, email, username, role, phone, is_active });
  return success(res, 200, 'User updated.', targetUser);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
};