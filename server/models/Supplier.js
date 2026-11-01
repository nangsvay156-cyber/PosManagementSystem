// models/Supplier.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Supplier extends Model {}

Supplier.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,  // ← fix this
    autoIncrement: true,
    primaryKey: true,
  },
  name:         { type: DataTypes.STRING(150), allowNull: false },
  company_name: { type: DataTypes.STRING(150), allowNull: true },
  email:        { type: DataTypes.STRING(150), allowNull: true },
  phone:        { type: DataTypes.STRING(20),  allowNull: true },
  address:      { type: DataTypes.STRING(255), allowNull: true },
  tax_number:   { type: DataTypes.STRING(50),  allowNull: true },
  is_active:    { type: DataTypes.TINYINT, defaultValue: 1 },
}, {
  sequelize,
  modelName: 'Supplier',
  tableName: 'suppliers',
  underscored: true,
});

module.exports = Supplier;