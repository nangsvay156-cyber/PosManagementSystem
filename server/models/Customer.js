// models/Customer.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Customer extends Model {}

Customer.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name:           { type: DataTypes.STRING(150), allowNull: false },
  email:          { type: DataTypes.STRING(150), allowNull: true },
  phone:          { type: DataTypes.STRING(20),  allowNull: true },
  address:        { type: DataTypes.STRING(255), allowNull: true },
  loyalty_points: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  credit_balance: { type: DataTypes.DECIMAL(12,2),    defaultValue: 0.00 },
  is_active:      { type: DataTypes.TINYINT, defaultValue: 1 },
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  underscored: true,
});

module.exports = Customer;