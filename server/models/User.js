const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'cashier'), defaultValue: 'cashier' },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  last_login_at: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true,
  defaultScope: {
    // Never leak the password hash unless explicitly requested via .scope('withPassword')
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: {
      attributes: {}, // empty override = include everything, including password
    },
  },
});

module.exports = User;