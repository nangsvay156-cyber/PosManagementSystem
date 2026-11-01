// models/Product.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Product extends Model {}

Product.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,   // ← critical
    autoIncrement: true,
    primaryKey: true,
  },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  supplier_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  name:         { type: DataTypes.STRING(150), allowNull: false },
  sku:          { type: DataTypes.STRING(50),  allowNull: false, unique: true },
  barcode:      { type: DataTypes.STRING(50),  allowNull: true,  unique: true },
  description:  { type: DataTypes.TEXT,        allowNull: true },
  image:        { type: DataTypes.STRING(255), allowNull: true },
  unit:         { type: DataTypes.STRING(20),  allowNull: false, defaultValue: 'pcs' },
  cost_price:   { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0.00 },
  selling_price:{ type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0.00 },
  tax_percent:  { type: DataTypes.DECIMAL(5,2),  allowNull: false, defaultValue: 0.00 },
  discount:     { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0.00 },
  stock_quantity:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  low_stock_alert: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  is_active:    { type: DataTypes.TINYINT, defaultValue: 1 },
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  underscored: true,
});

module.exports = Product;