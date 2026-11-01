// models/Salereturn.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class SaleReturn extends Model {}

SaleReturn.init({
  id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sale_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reason:       { type: DataTypes.STRING(255), allowNull: true },
  total_refund: { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
}, {
  sequelize,
  modelName: 'SaleReturn',
  tableName: 'sale_returns',
  underscored: true,
  updatedAt: false,
});

module.exports = SaleReturn;