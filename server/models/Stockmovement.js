// models/StockMovement.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class StockMovement extends Model {}

StockMovement.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,   // ← was INTEGER, must be UNSIGNED
    autoIncrement: true,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,   // ← must match products.id
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,   // ← must match users.id
    allowNull: true,                    // nullable per your schema
  },
  type: {
    type: DataTypes.ENUM(
      'purchase', 'sale', 'adjustment',
      'return_in', 'return_out', 'initial'
    ),
    allowNull: false,
  },
  quantity_change: { type: DataTypes.INTEGER, allowNull: false },
  quantity_before:  { type: DataTypes.INTEGER, allowNull: false },
  quantity_after:   { type: DataTypes.INTEGER, allowNull: false },
  reference_type:   { type: DataTypes.STRING(50), allowNull: true },
  reference_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  note:             { type: DataTypes.STRING(255), allowNull: true },
}, {
  sequelize,
  modelName: 'StockMovement',
  tableName: 'stock_movements',
  underscored: true,
  updatedAt: false,
});

module.exports = StockMovement;