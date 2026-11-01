// ✅ models/index.js — plain imports, no factory calls
const { sequelize } = require('../config/database');

const User              = require('./User');
const RefreshToken      = require('./Refreshtoken');
const Category          = require('./Category');
const Supplier          = require('./Supplier');
const Customer          = require('./Customer');
const Product           = require('./Product');
const StockMovement     = require('./StockMovement');
const PurchaseOrder     = require('./Purchaseorder');
const PurchaseOrderItem = require('./Purchaseorderitem');
const Sale              = require('./Sale');
const SaleItem          = require('./SaleItem');
const SaleReturn        = require('./Salereturn');
const SaleReturnItem    = require('./Salereturnitem');
const ActivityLog       = require('./Activitylog');

// ── Associations ──────────────────────────────────────────────
User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Supplier.hasMany(Product, { foreignKey: 'supplier_id' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id' });

Product.hasMany(StockMovement, { foreignKey: 'product_id', onDelete: 'CASCADE' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(StockMovement, { foreignKey: 'user_id' });
StockMovement.belongsTo(User, { foreignKey: 'user_id' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });

User.hasMany(PurchaseOrder, { foreignKey: 'user_id' });
PurchaseOrder.belongsTo(User, { foreignKey: 'user_id' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Customer.hasMany(Sale, { foreignKey: 'customer_id' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id' });

User.hasMany(Sale, { foreignKey: 'user_id' });
Sale.belongsTo(User, { foreignKey: 'user_id' });

Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

Product.hasMany(SaleItem, { foreignKey: 'product_id' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id' });

Sale.hasMany(SaleReturn, { foreignKey: 'sale_id', as: 'returns', onDelete: 'CASCADE' });
SaleReturn.belongsTo(Sale, { foreignKey: 'sale_id' });

User.hasMany(SaleReturn, { foreignKey: 'user_id' });
SaleReturn.belongsTo(User, { foreignKey: 'user_id' });

SaleReturn.hasMany(SaleReturnItem, { foreignKey: 'sale_return_id', as: 'items', onDelete: 'CASCADE' });
SaleReturnItem.belongsTo(SaleReturn, { foreignKey: 'sale_return_id' });

SaleItem.hasMany(SaleReturnItem, { foreignKey: 'sale_item_id' });
SaleReturnItem.belongsTo(SaleItem, { foreignKey: 'sale_item_id' });

Product.hasMany(SaleReturnItem, { foreignKey: 'product_id' });
SaleReturnItem.belongsTo(Product, { foreignKey: 'product_id' });

// ── Export ────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  RefreshToken,
  Category,
  Supplier,
  Customer,
  Product,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  Sale,
  SaleItem,
  SaleReturn,
  SaleReturnItem,
  ActivityLog,
};