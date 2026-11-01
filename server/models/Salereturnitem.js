// models/Salereturnitem.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class SaleReturnItem extends Model {}

SaleReturnItem.init({
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sale_return_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sale_item_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  product_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantity:       { type: DataTypes.INTEGER,          allowNull: false },
  refund_amount:  { type: DataTypes.DECIMAL(12,2),    allowNull: false },
}, {
  sequelize,
  modelName: 'SaleReturnItem',
  tableName: 'sale_return_items',
  underscored: true,
  timestamps: false,
});

module.exports = SaleReturnItem;