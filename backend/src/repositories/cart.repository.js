const { pool } = require('../config/db');
const { Cart, CartItem } = require('../models/Cart');

async function findCartByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM carts WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
    [userId, 'active']
  );
  return rows.length ? new Cart(rows[0]) : null;
}

async function findCartById(id) {
  const [rows] = await pool.execute('SELECT * FROM carts WHERE id = ?', [id]);
  return rows.length ? new Cart(rows[0]) : null;
}

async function createCart(userId) {
  const [result] = await pool.execute(
    'INSERT INTO carts (user_id, status) VALUES (?, ?)',
    [userId, 'active']
  );
  return findCartById(result.insertId);
}

async function findCartItemsByCartId(cartId) {
  const [rows] = await pool.execute(
    `SELECT ci.*,
            p.name        AS product_name,
            p.image_url   AS product_image,
            p.sku         AS product_sku,
            p.price       AS current_price,
            p.is_active   AS product_active
     FROM cart_items ci
     LEFT JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at ASC`,
    [cartId]
  );
  return rows.map((row) => ({
    ...new CartItem(row),
    name:         row.product_name  ?? null,
    imageUrl:     row.product_image ?? null,
    sku:          row.product_sku   ?? null,
    currentPrice: row.current_price ?? null,
    isActive:     !!row.product_active,
  }));
}

/**
 * Thêm sản phẩm vào giỏ.
 * Nếu sản phẩm đã có → cộng thêm số lượng VÀ cập nhật giá hiện tại.
 */
async function addItemToCart(cartId, productId, quantity, unitPrice) {
  await pool.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       quantity   = quantity + ?,
       unit_price = ?`,
    [cartId, productId, quantity, unitPrice, quantity, unitPrice]
  );
  return true;
}

async function updateCartItemQuantity(cartId, productId, quantity) {
  await pool.execute(
    'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
    [quantity, cartId, productId]
  );
  return true;
}

async function removeCartItem(cartId, productId) {
  await pool.execute(
    'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartId, productId]
  );
  return true;
}

async function clearCartItems(cartId) {
  await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  return true;
}

async function updateCartStatus(cartId, status) {
  await pool.execute('UPDATE carts SET status = ? WHERE id = ?', [status, cartId]);
  return findCartById(cartId);
}

module.exports = {
  findCartByUserId,
  findCartById,
  createCart,
  findCartItemsByCartId,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
  updateCartStatus,
};
