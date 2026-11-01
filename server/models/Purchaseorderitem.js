const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class PurchaseOrderItem extends Model {}

PurchaseOrderItem.init({
  id:                { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  purchase_order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  product_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantity_ordered:  { type: DataTypes.INTEGER,          allowNull: false },
  quantity_received: { type: DataTypes.INTEGER,          allowNull: false, defaultValue: 0 },
  unit_cost:         { type: DataTypes.DECIMAL(12,2),    allowNull: false },
  tax_rate:          { type: DataTypes.DECIMAL(5,2),     allowNull: false, defaultValue: 0.00 },
  line_total:        { type: DataTypes.DECIMAL(14,2),    allowNull: false },
}, {
  sequelize,
  modelName: 'PurchaseOrderItem',
  tableName: 'purchase_order_items',
  underscored: true,
  timestamps: false,
});

module.exports = PurchaseOrderItem;