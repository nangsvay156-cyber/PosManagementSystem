const bcrypt = require('bcrypt');
const { User } = require('../models');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password', 'refresh_token'] },
    order: [['name', 'ASC']],
  });
  return success(res, { data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password', 'refresh_token'] },
  });
  if (!user) throw new AppError('User not found', 404);
  return success(res, { data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const { name, email, phone, role, is_active } = req.body;

  // Prevent the last admin from demoting/deactivating themselves into a lockout
  if (user.role === 'admin' && (role === 'cashier' || is_active === false)) {
    const adminCount = await User.count({ where: { role: 'admin', is_active: true } });
    if (adminCount <= 1) {
      throw new AppError('Cannot demote or deactivate the last active admin', 409);
    }
  }

  await user.update({ name, email, phone, role, is_active });

  const userData = user.toJSON();
  delete userData.password;
  delete userData.refresh_token;

  return success(res, { message: 'User updated', data: userData });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.refresh_token = null; // force re-login
  await user.save();

  return success(res, { message: 'Password reset successfully' });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user.id === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  if (user.role === 'admin') {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) throw new AppError('Cannot delete the last admin', 409);
  }

  await user.destroy();
  return success(res, { message: 'User deleted' });
});

module.exports = { getUsers, getUserById, updateUser, resetUserPassword, deleteUser };