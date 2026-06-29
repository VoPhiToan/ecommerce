const { pool } = require('../config/db');
const User = require('../models/User');

async function findUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows.length ? new User(rows[0]) : null;
}

async function findUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows.length ? new User(rows[0]) : null;
}

async function createUser({ email, passwordHash, firstName, lastName, phone, role }) {
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)`,
    [email, passwordHash, firstName, lastName, phone || null, role || 'customer']
  );

  return findUserById(result.insertId);
}

async function findAllUsers() {
  const [rows] = await pool.execute(
    'SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

async function updateUser(id, { role, isActive }) {
  const fields = [];
  const values = [];
  if (role !== undefined)     { fields.push('role = ?');      values.push(role); }
  if (isActive !== undefined) { fields.push('is_active = ?'); values.push(isActive ? 1 : 0); }
  if (!fields.length) return findUserById(id);
  values.push(id);
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return findUserById(id);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findAllUsers,
  updateUser,
};
