const { pool } = require('../config/db');
const Warehouse = require('../models/Warehouse');

async function findWarehouseById(id) {
  const [rows] = await pool.execute('SELECT * FROM warehouses WHERE id = ?', [id]);
  return rows.length ? new Warehouse(rows[0]) : null;
}

async function findAllWarehouses() {
  const [rows] = await pool.execute('SELECT * FROM warehouses ORDER BY name ASC');
  return rows.map((row) => new Warehouse(row));
}

async function findWarehouseByName(name) {
  const [rows] = await pool.execute('SELECT * FROM warehouses WHERE name = ?', [name]);
  return rows.length ? new Warehouse(rows[0]) : null;
}

async function createWarehouse({ name, address, city, state, postalCode, country, managerId }) {
  const [result] = await pool.execute(
    `INSERT INTO warehouses (name, address, city, state, postal_code, country, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, address, city || null, state || null, postalCode || null, country, managerId || null]
  );

  return findWarehouseById(result.insertId);
}

async function updateWarehouse(id, { name, address, city, state, postalCode, country, managerId }) {
  await pool.execute(
    `UPDATE warehouses SET name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, manager_id = ? WHERE id = ?`,
    [name, address, city, state, postalCode, country, managerId, id]
  );

  return findWarehouseById(id);
}

async function deleteWarehouse(id) {
  await pool.execute('DELETE FROM warehouses WHERE id = ?', [id]);
  return true;
}

module.exports = {
  findWarehouseById,
  findAllWarehouses,
  findWarehouseByName,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
