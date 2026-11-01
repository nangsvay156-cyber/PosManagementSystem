// models/Category.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Category extends Model {}

Category.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,  // ← fix this
    autoIncrement: true,
    primaryKey: true,
  },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  is_active:   { type: DataTypes.TINYINT, defaultValue: 1 },
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  underscored: true,
});

module.exports = Category;