const { pool } = require('../config/db');

async function getSalesMetrics() {
  const [orders] = await pool.execute(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM orders
    WHERE payment_status = 'paid'
  `);

  return orders[0] || { total_orders: 0, total_revenue: 0, avg_order_value: 0 };
}

async function getOrderStatusCount() {
  const [statuses] = await pool.execute(`
    SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status
  `);

  return statuses;
}

async function getTopProducts(limit = 10) {
  const [products] = await pool.execute(`
    SELECT 
      p.id, p.name, p.sku, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT ?
  `, [limit]);

  return products;
}

async function getInventoryStats() {
  const [stats] = await pool.execute(`
    SELECT 
      COUNT(*) as total_items,
      SUM(quantity) as total_quantity,
      SUM(reserved_quantity) as total_reserved
    FROM inventory
  `);

  return stats[0] || { total_items: 0, total_quantity: 0, total_reserved: 0 };
}

async function getUserStats() {
  const [stats] = await pool.execute(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as total_customers,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
    FROM users
  `);

  return stats[0] || { total_users: 0, total_customers: 0, active_users: 0 };
}

async function getProductStats() {
  const [stats] = await pool.execute(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(DISTINCT category_id) as total_categories
    FROM products
    WHERE is_active = 1
  `);

  return stats[0] || { total_products: 0, total_categories: 0 };
}

async function getRecentOrders(limit = 5) {
  const [orders] = await pool.execute(`
    SELECT o.*, u.email AS user_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.placed_at DESC LIMIT ?
  `, [limit]);

  return orders;
}

module.exports = {
  getSalesMetrics,
  getOrderStatusCount,
  getTopProducts,
  getInventoryStats,
  getUserStats,
  getProductStats,
  getRecentOrders,
};
