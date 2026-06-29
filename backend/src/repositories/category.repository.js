const { pool } = require('../config/db');
const Category = require('../models/Category');

async function findCategoryById(id) {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
  return rows.length ? new Category(rows[0]) : null;
}

async function findAllCategories() {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC');
  return rows.map((row) => new Category(row));
}

async function findCategoryByName(name) {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE name = ?', [name]);
  return rows.length ? new Category(rows[0]) : null;
}

async function createCategory({ name, description }) {
  const [result] = await pool.execute(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [name, description || null]
  );

  return findCategoryById(result.insertId);
}

async function updateCategory(id, { name, description, isActive }) {
  await pool.execute(
    `UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?`,
    [name, description, isActive ? 1 : 0, id]
  );

  return findCategoryById(id);
}

async function deleteCategory(id) {
  await pool.execute('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
  return true;
}

module.exports = {
  findCategoryById,
  findAllCategories,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
