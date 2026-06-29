const { pool } = require('../config/db');
const Product  = require('../models/Product');

async function findProductById(id) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length ? new Product(rows[0]) : null;
}

async function findAllProducts({ page = 1, limit = 10, search = '', categoryId = null } = {}) {
  const offset = (page - 1) * limit;
  let query = `SELECT p.*, c.name AS category_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.is_active = 1`;
  const params = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    query += ' AND p.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.execute(query, params);
  return rows.map((row) => ({ ...new Product(row), categoryName: row.category_name }));
}

async function countProducts(search = '', categoryId = null) {
  let query = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    query += ' AND category_id = ?';
    params.push(categoryId);
  }

  const [rows] = await pool.execute(query, params);
  return rows[0].total;
}

async function findProductBySku(sku) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE sku = ?', [sku]);
  return rows.length ? new Product(rows[0]) : null;
}

async function createProduct({ sku, name, description, categoryId, price, weight, imageUrl }) {
  const [result] = await pool.execute(
    `INSERT INTO products (sku, name, description, category_id, price, weight, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, description ?? null, categoryId, price, weight ?? 0, imageUrl ?? null]
  );
  return findProductById(result.insertId);
}

async function updateProduct(id, { name, description, categoryId, price, weight, isActive, imageUrl }) {
  const fields = [
    'name = ?', 'description = ?', 'category_id = ?',
    'price = ?', 'weight = ?', 'is_active = ?',
  ];
  const values = [name, description ?? null, categoryId, price, weight ?? 0, isActive ? 1 : 0];

  if (imageUrl !== undefined) {
    fields.push('image_url = ?');
    values.push(imageUrl);
  }

  await pool.execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    [...values, id]
  );
  return findProductById(id);
}

async function deleteProduct(id) {
  await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
  return true;
}

module.exports = {
  findProductById,
  findAllProducts,
  countProducts,
  findProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
};