// models/SaleItem.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class SaleItem extends Model {}

SaleItem.init({
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sale_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  product_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantity:       { type: DataTypes.INTEGER,          allowNull: false },
  unit_price:     { type: DataTypes.DECIMAL(12,2),    allowNull: false },
  tax_percent:    { type: DataTypes.DECIMAL(5,2),     defaultValue: 0.00 },
  discount_amount:{ type: DataTypes.DECIMAL(12,2),    defaultValue: 0.00 },
  subtotal:       { type: DataTypes.DECIMAL(14,2),    allowNull: false },
}, {
  sequelize,
  modelName: 'SaleItem',
  tableName: 'sale_items',
  underscored: true,
  timestamps: false,
});

module.exports = SaleItem;