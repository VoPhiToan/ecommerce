const { pool } = require('../config/db');
const { Order, OrderItem } = require('../models/Order');

async function generateOrderNumber() {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

async function findOrderById(id) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
  return rows.length ? new Order(rows[0]) : null;
}

async function findOrderByOrderNumber(orderNumber) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
  return rows.length ? new Order(rows[0]) : null;
}

async function findOrdersByUserId(userId, limit = 20, offset = 0) {
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );
  return rows.map((row) => new Order(row));
}

async function countOrdersByUserId(userId) {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
  return rows[0].total;
}

async function createOrder({ orderNumber, userId, warehouseId, totalAmount, shippingAddress }) {
  const [result] = await pool.execute(
    'INSERT INTO orders (order_number, user_id, warehouse_id, total_amount, shipping_address, order_status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderNumber, userId, warehouseId, totalAmount, shippingAddress, 'pending', 'pending']
  );

  return findOrderById(result.insertId);
}

async function addOrderItems(orderId, items) {
  for (const item of items) {
    await pool.execute(
      'INSERT INTO order_items (order_id, product_id, warehouse_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
      [orderId, item.productId, item.warehouseId, item.quantity, item.unitPrice]
    );
  }
  return true;
}

async function findOrderItems(orderId) {
  const [rows] = await pool.execute(
    `SELECT oi.*, p.name AS product_name, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows.map((row) => ({
    ...new OrderItem(row),
    productName:  row.product_name,
    productImage: row.product_image,
  }));
}

async function updateOrderStatus(orderId, orderStatus) {
  await pool.execute('UPDATE orders SET order_status = ? WHERE id = ?', [orderStatus, orderId]);
  return findOrderById(orderId);
}

async function updatePaymentStatus(orderId, paymentStatus) {
  await pool.execute('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, orderId]);
  return findOrderById(orderId);
}

async function getOrdersByStatus(status, limit = 50, offset = 0) {
  const [rows] = await pool.execute(
    `SELECT o.*, u.email AS user_email
     FROM orders o LEFT JOIN users u ON o.user_id = u.id
     WHERE o.order_status = ? ORDER BY o.placed_at DESC LIMIT ? OFFSET ?`,
    [status, limit, offset]
  );
  return rows.map((row) => new Order(row));
}

async function countOrdersByStatus(status) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as total FROM orders WHERE order_status = ?',
    [status]
  );
  return rows[0].total;
}

async function findAllOrders(limit = 50, offset = 0) {
  const [rows] = await pool.execute(
    `SELECT o.*, u.email AS user_email
     FROM orders o LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.placed_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows.map((row) => new Order(row));
}

async function countAllOrders() {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM orders');
  return rows[0].total;
}

module.exports = {
  generateOrderNumber,
  findOrderById,
  findOrderByOrderNumber,
  findOrdersByUserId,
  countOrdersByUserId,
  createOrder,
  addOrderItems,
  findOrderItems,
  updateOrderStatus,
  updatePaymentStatus,
  getOrdersByStatus,
  countOrdersByStatus,
  findAllOrders,
  countAllOrders,
};
