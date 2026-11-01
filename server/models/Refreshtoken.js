// ✅ models/Refreshtoken.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  token:      { type: DataTypes.STRING(500), allowNull: false },
  expires_at: { type: DataTypes.DATE,        allowNull: false },
  revoked:    { type: DataTypes.BOOLEAN,     defaultValue: false },
}, {
  sequelize,
  modelName: 'RefreshToken',
  tableName: 'refresh_tokens',
  underscored: true,
  updatedAt: false,
});

module.exports = RefreshToken;