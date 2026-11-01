// models/Sale.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Sale extends Model {}

Sale.init({
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  invoice_number: { type: DataTypes.STRING(30),  allowNull: false, unique: true },
  customer_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  user_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  subtotal:       { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  tax_amount:     { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  discount_amount:{ type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  total_amount:   { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  amount_paid:    { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  change_due:     { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  payment_method: { type: DataTypes.ENUM('cash','card','mobile_money','bank_transfer','credit'), defaultValue: 'cash' },
  payment_status: { type: DataTypes.ENUM('paid','partial','unpaid'), defaultValue: 'paid' },
  status:         { type: DataTypes.ENUM('completed','refunded','cancelled'), defaultValue: 'completed' },
  note:           { type: DataTypes.STRING(255), allowNull: true },
}, {
  sequelize,
  modelName: 'Sale',
  tableName: 'sales',
  underscored: true,
});

module.exports = Sale;