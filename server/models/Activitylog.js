// models/Activitylog.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ActivityLog extends Model {}

ActivityLog.init({
  id:         { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  action:     { type: DataTypes.STRING(100), allowNull: false },
  details:    { type: DataTypes.TEXT,        allowNull: true },
  ip_address: { type: DataTypes.STRING(45),  allowNull: true },
}, {
  sequelize,
  modelName: 'ActivityLog',
  tableName: 'activity_logs',
  underscored: true,
  updatedAt: false,
});

module.exports = ActivityLog;