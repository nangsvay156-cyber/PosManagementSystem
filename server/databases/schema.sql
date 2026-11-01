-- ============================================================
-- POS SYSTEM - MySQL SCHEMA
-- ============================================================
-- Engine: InnoDB everywhere (FK support, transactions)
-- Charset: utf8mb4 (full unicode + emoji safe)
-- ============================================================

CREATE DATABASE IF NOT EXISTS posdb
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE posdb;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS  (Admin, Cashier)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(100)      NOT NULL,
  email           VARCHAR(150)      NOT NULL UNIQUE,
  username        VARCHAR(50)       NOT NULL UNIQUE,
  password        VARCHAR(255)      NOT NULL,           -- bcrypt hash
  role            ENUM('admin','cashier') NOT NULL DEFAULT 'cashier',
  phone           VARCHAR(20)       NULL,
  avatar          VARCHAR(255)      NULL,
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,

  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- REFRESH TOKENS  (rotation / revocation support)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED      NOT NULL,
  token           VARCHAR(500)      NOT NULL,
  expires_at      DATETIME          NOT NULL,
  revoked         TINYINT(1)        NOT NULL DEFAULT 0,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_token (token),
  INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)      NOT NULL UNIQUE,
  description     VARCHAR(255)      NULL,
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)      NOT NULL,
  company_name    VARCHAR(150)      NULL,
  email           VARCHAR(150)      NULL,
  phone           VARCHAR(20)       NULL,
  address         VARCHAR(255)      NULL,
  tax_number      VARCHAR(50)       NULL,
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)      NOT NULL,
  email           VARCHAR(150)      NULL,
  phone           VARCHAR(20)       NULL,
  address         VARCHAR(255)      NULL,
  loyalty_points  INT UNSIGNED      NOT NULL DEFAULT 0,
  credit_balance  DECIMAL(12,2)     NOT NULL DEFAULT 0.00, -- amount customer owes (for credit sales)
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id     INT UNSIGNED      NULL,
  supplier_id     INT UNSIGNED      NULL,
  name            VARCHAR(150)      NOT NULL,
  sku             VARCHAR(50)       NOT NULL UNIQUE,
  barcode         VARCHAR(50)       NULL UNIQUE,
  description     TEXT              NULL,
  image           VARCHAR(255)      NULL,
  unit            VARCHAR(20)       NOT NULL DEFAULT 'pcs',   -- pcs, kg, box, etc.
  cost_price      DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  selling_price   DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  tax_percent     DECIMAL(5,2)      NOT NULL DEFAULT 0.00,
  discount        DECIMAL(12,2)     NOT NULL DEFAULT 0.00,    -- flat discount amount, default
  stock_quantity  INT               NOT NULL DEFAULT 0,
  low_stock_alert INT               NOT NULL DEFAULT 5,
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_product_name (name),
  INDEX idx_product_barcode (barcode)
) ENGINE=InnoDB;

-- ============================================================
-- STOCK MOVEMENTS  (audit trail for every stock change)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      INT UNSIGNED      NOT NULL,
  user_id         INT UNSIGNED      NULL,             -- who triggered it
  type            ENUM('purchase','sale','adjustment','return_in','return_out','initial') NOT NULL,
  quantity_change INT               NOT NULL,          -- positive = stock in, negative = stock out
  quantity_before INT               NOT NULL,
  quantity_after  INT               NOT NULL,
  reference_type  VARCHAR(50)       NULL,               -- 'sale', 'purchase_order', etc.
  reference_id    INT UNSIGNED      NULL,               -- id of sale/purchase order
  note            VARCHAR(255)      NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stockmove_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_stockmove_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stockmove_product (product_id),
  INDEX idx_stockmove_reference (reference_type, reference_id)
) ENGINE=InnoDB;

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number       VARCHAR(30)       NOT NULL UNIQUE,
  supplier_id     INT UNSIGNED      NOT NULL,
  user_id         INT UNSIGNED      NOT NULL,           -- who created it
  status          ENUM('pending','ordered','received','cancelled') NOT NULL DEFAULT 'pending',
  total_amount    DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  notes           VARCHAR(255)      NULL,
  ordered_at      DATETIME          NULL,
  received_at     DATETIME          NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT UNSIGNED    NOT NULL,
  product_id        INT UNSIGNED    NOT NULL,
  quantity          INT             NOT NULL,
  unit_cost         DECIMAL(12,2)   NOT NULL,
  subtotal          DECIMAL(14,2)   NOT NULL,
  received_quantity INT             NOT NULL DEFAULT 0,
  CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_poi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number  VARCHAR(30)       NOT NULL UNIQUE,
  customer_id     INT UNSIGNED      NULL,
  user_id         INT UNSIGNED      NOT NULL,           -- cashier who made the sale
  subtotal        DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  tax_amount      DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  total_amount    DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  amount_paid     DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  change_due      DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  payment_method  ENUM('cash','card','mobile_money','bank_transfer','credit') NOT NULL DEFAULT 'cash',
  payment_status  ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'paid',
  status          ENUM('completed','refunded','cancelled') NOT NULL DEFAULT 'completed',
  note            VARCHAR(255)      NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_sale_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_sale_created (created_at),
  INDEX idx_sale_invoice (invoice_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id         INT UNSIGNED      NOT NULL,
  product_id      INT UNSIGNED      NOT NULL,
  quantity        INT               NOT NULL,
  unit_price      DECIMAL(12,2)     NOT NULL,           -- selling price at time of sale
  tax_percent     DECIMAL(5,2)      NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  subtotal        DECIMAL(14,2)     NOT NULL,           -- (unit_price * qty) - discount + tax
  CONSTRAINT fk_saleitem_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_saleitem_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_saleitem_sale (sale_id)
) ENGINE=InnoDB;

-- ============================================================
-- SALE RETURNS (for refunds tied to a sale)
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_returns (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id         INT UNSIGNED      NOT NULL,
  user_id         INT UNSIGNED      NOT NULL,
  reason          VARCHAR(255)      NULL,
  total_refund    DECIMAL(14,2)     NOT NULL DEFAULT 0.00,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_return_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_return_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_return_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_return_id  INT UNSIGNED      NOT NULL,
  sale_item_id    INT UNSIGNED      NOT NULL,
  product_id      INT UNSIGNED      NOT NULL,
  quantity        INT               NOT NULL,
  refund_amount   DECIMAL(12,2)     NOT NULL,
  CONSTRAINT fk_returnitem_return FOREIGN KEY (sale_return_id) REFERENCES sale_returns(id) ON DELETE CASCADE,
  CONSTRAINT fk_returnitem_saleitem FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_returnitem_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- ACTIVITY LOG (optional but useful for admin oversight)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED      NULL,
  action          VARCHAR(100)      NOT NULL,
  details         TEXT              NULL,
  ip_address      VARCHAR(45)       NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activitylog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

