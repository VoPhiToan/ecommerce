-- ecommerce.sql
-- MySQL schema for E-Commerce + Warehouse Management System

DROP DATABASE IF EXISTS ecommerce;
CREATE DATABASE ecommerce;
USE ecommerce;

-- Users table holds authentication, profile and RBAC data
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin','manager','staff','customer') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role(role),
  INDEX idx_users_email(email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories for products
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_name(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table with category reference
CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT UNSIGNED NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  weight DECIMAL(10,2) DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_products_category(category_id),
  INDEX idx_products_sku(sku),
  INDEX idx_products_name(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warehouses table for stock locations
CREATE TABLE warehouses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  manager_id INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_warehouses_manager(manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory tracks stock quantity by warehouse and product
CREATE TABLE inventory (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_inventory_warehouse_product (warehouse_id, product_id),
  INDEX idx_inventory_product(product_id),
  INDEX idx_inventory_warehouse(warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carts store active shopping carts for customers
CREATE TABLE carts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('active','completed','abandoned') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_carts_user(user_id),
  INDEX idx_carts_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items reference products and carts
CREATE TABLE cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_cart_item(cart_id, product_id),
  INDEX idx_cart_items_cart(cart_id),
  INDEX idx_cart_items_product(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table for purchases
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  shipping_address VARCHAR(255) NOT NULL,
  order_status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  placed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_orders_user(user_id),
  INDEX idx_orders_warehouse(warehouse_id),
  INDEX idx_orders_status(order_status),
  INDEX idx_orders_payment(payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items link orders and products
CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_order_items_order(order_id),
  INDEX idx_order_items_product(product_id),
  INDEX idx_order_items_warehouse(warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for initial environment
INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES
('admin@store.com', '$2b$10$abcdefghijklmnopqrstuv', 'Admin', 'User', '+10000000000', 'admin'),
('manager@store.com', '$2b$10$abcdefghijklmnopqrstuv', 'Warehouse', 'Manager', '+10000000001', 'manager'),
('staff@store.com', '$2b$10$abcdefghijklmnopqrstuv', 'Warehouse', 'Staff', '+10000000002', 'staff'),
('customer@store.com', '$2b$10$abcdefghijklmnopqrstuv', 'John', 'Customer', '+10000000003', 'customer');

INSERT INTO categories (name, description) VALUES
('Electronics', 'Devices and accessories'),
('Furniture', 'Home and office furniture'),
('Apparel', 'Clothing and wearable items');

INSERT INTO products (sku, name, description, category_id, price, weight) VALUES
('ELEC-1001', 'Wireless Headphones', 'Noise canceling over-ear headphones', 1, 129.99, 0.75),
('ELEC-1002', 'Smart Speaker', 'Voice-enabled smart speaker', 1, 89.99, 0.65),
('FURN-2001', 'Office Desk', 'Adjustable height desk', 2, 249.99, 35.00),
('APP-3001', 'Denim Jacket', 'Classic denim jacket, unisex', 3, 79.99, 1.20);

INSERT INTO warehouses (name, address, city, state, postal_code, country, manager_id) VALUES
('North Distribution Center', '2000 North St', 'Austin', 'TX', '78701', 'USA', 2),
('East Distribution Center', '315 East Ave', 'New York', 'NY', '10010', 'USA', 2);

INSERT INTO inventory (warehouse_id, product_id, quantity, reserved_quantity) VALUES
(1, 1, 120, 5),
(1, 2, 80, 3),
(1, 3, 40, 0),
(2, 1, 60, 2),
(2, 4, 200, 10);

INSERT INTO carts (user_id, status) VALUES
(4, 'active');

INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES
(1, 1, 2, 129.99),
(1, 4, 1, 79.99);

INSERT INTO orders (order_number, user_id, warehouse_id, total_amount, shipping_address, order_status, payment_status) VALUES
('ORD-10001', 4, 1, 339.97, '123 Market St, Austin, TX 78701', 'processing', 'paid');

INSERT INTO order_items (order_id, product_id, warehouse_id, quantity, unit_price) VALUES
(1, 1, 1, 2, 129.99),
(1, 4, 1, 1, 79.99);
 -- Thêm vào file ecommerce.sql

CREATE TABLE refresh_tokens (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);

CREATE TABLE token_blacklist (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  token        VARCHAR(512) NOT NULL UNIQUE,
  blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token)
);
-- Bảng roles
CREATE TABLE roles (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50) NOT NULL UNIQUE,  -- 'admin', 'staff', 'customer'
  description VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng permissions
CREATE TABLE permissions (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE, -- 'product:create', 'order:read'
  description VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng trung gian role <-> permission (many-to-many)
CREATE TABLE role_permissions (
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Thêm cột role_id vào bảng users
ALTER TABLE users ADD COLUMN role_id INT DEFAULT 3; -- 3 = customer
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);

-- Seed data
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('staff', 'Manage products and orders'),
  ('customer', 'Regular customer');

INSERT INTO permissions (name, description) VALUES
  -- User permissions
  ('user:read',    'View users'),
  ('user:create',  'Create users'),
  ('user:update',  'Update users'),
  ('user:delete',  'Delete users'),
  -- Product permissions
  ('product:read',   'View products'),
  ('product:create', 'Create products'),
  ('product:update', 'Update products'),
  ('product:delete', 'Delete products'),
  -- Order permissions
  ('order:read',   'View all orders'),
  ('order:update', 'Update order status'),
  ('order:delete', 'Delete orders'),
  -- Dashboard
  ('dashboard:read', 'View dashboard stats'),
  -- Warehouse
  ('warehouse:read',   'View warehouse'),
  ('warehouse:update', 'Update warehouse'),
  -- Category
  ('category:create', 'Create category'),
  ('category:update', 'Update category'),
  ('category:delete', 'Delete category');

-- Admin: tất cả permissions
INSERT INTO role_permissions (role_id, permission_id)
  SELECT 1, id FROM permissions;

-- Staff: quản lý sản phẩm, đơn hàng, kho
INSERT INTO role_permissions (role_id, permission_id)
  SELECT 2, id FROM permissions
  WHERE name IN (
    'product:read','product:create','product:update',
    'order:read','order:update',
    'warehouse:read','warehouse:update',
    'category:create','category:update',
    'dashboard:read'
  );

-- Customer: chỉ xem sản phẩm (order của mình xử lý riêng)
INSERT INTO role_permissions (role_id, permission_id)
  SELECT 3, id FROM permissions
  WHERE name IN ('product:read');