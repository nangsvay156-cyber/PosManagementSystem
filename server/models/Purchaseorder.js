const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class PurchaseOrder extends Model {}

PurchaseOrder.init({
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  po_number:     { type: DataTypes.STRING(30), allowNull: false, unique: true },
  supplier_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status:        { type: DataTypes.ENUM('pending','ordered','received','partially_received','cancelled'), defaultValue: 'pending' },
  order_date:    { type: DataTypes.DATEONLY, allowNull: true },
  expected_date: { type: DataTypes.DATEONLY, allowNull: true },
  received_date: { type: DataTypes.DATEONLY, allowNull: true },
  subtotal:      { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  tax_amount:    { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  total_amount:  { type: DataTypes.DECIMAL(14,2), defaultValue: 0.00 },
  notes:         { type: DataTypes.STRING(255), allowNull: true },
}, {
  sequelize,
  modelName: 'PurchaseOrder',
  tableName: 'purchase_orders',
  underscored: true,
});

module.exports = PurchaseOrder;