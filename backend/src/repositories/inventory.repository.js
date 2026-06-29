const { pool } = require('../config/db');
const { Inventory, InventoryHistory } = require('../models/Inventory');

async function findInventoryById(id) {
  const [rows] = await pool.execute('SELECT * FROM inventory WHERE id = ?', [id]);
  return rows.length ? new Inventory(rows[0]) : null;
}

async function findInventoryByWarehouseAndProduct(warehouseId, productId) {
  const [rows] = await pool.execute(
    'SELECT * FROM inventory WHERE warehouse_id = ? AND product_id = ?',
    [warehouseId, productId]
  );
  return rows.length ? new Inventory(rows[0]) : null;
}

async function findAllInventoryByWarehouse(warehouseId) {
  const [rows] = await pool.execute(
    'SELECT * FROM inventory WHERE warehouse_id = ? ORDER BY product_id ASC',
    [warehouseId]
  );
  return rows.map((row) => new Inventory(row));
}

async function findAllInventoryByProduct(productId) {
  const [rows] = await pool.execute(
    'SELECT * FROM inventory WHERE product_id = ? ORDER BY warehouse_id ASC',
    [productId]
  );
  return rows.map((row) => new Inventory(row));
}

async function getTotalStockByProduct(productId) {
  const [rows] = await pool.execute(
    'SELECT SUM(quantity) as total_quantity, SUM(reserved_quantity) as total_reserved FROM inventory WHERE product_id = ?',
    [productId]
  );
  return rows[0] || { total_quantity: 0, total_reserved: 0 };
}

async function updateInventoryStock(warehouseId, productId, quantity, reservedQuantity) {
  const existing = await findInventoryByWarehouseAndProduct(warehouseId, productId);

  if (existing) {
    await pool.execute(
      'UPDATE inventory SET quantity = ?, reserved_quantity = ? WHERE warehouse_id = ? AND product_id = ?',
      [quantity, reservedQuantity || existing.reservedQuantity, warehouseId, productId]
    );
  } else {
    await pool.execute(
      'INSERT INTO inventory (warehouse_id, product_id, quantity, reserved_quantity) VALUES (?, ?, ?, ?)',
      [warehouseId, productId, quantity, reservedQuantity || 0]
    );
  }

  return findInventoryByWarehouseAndProduct(warehouseId, productId);
}

async function stockIn(warehouseId, productId, quantity, notes, createdBy) {
  const newInventory = await updateInventoryStock(warehouseId, productId, 0, 0);

  // Insert transaction history
  try {
    await pool.execute(
      `INSERT INTO inventory_history (warehouse_id, product_id, transaction_type, quantity, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [warehouseId, productId, 'STOCK_IN', quantity, notes || null, createdBy]
    );
  } catch (error) {
    console.warn('Inventory history table may not exist yet:', error.message);
  }

  return newInventory;
}

async function stockOut(warehouseId, productId, quantity, notes, createdBy) {
  const inventory = await findInventoryByWarehouseAndProduct(warehouseId, productId);

  if (!inventory || inventory.quantity < quantity) {
    const error = new Error('Insufficient inventory for stock out operation');
    error.statusCode = 422;
    throw error;
  }

  const newQuantity = inventory.quantity - quantity;
  const newInventory = await updateInventoryStock(warehouseId, productId, newQuantity, inventory.reservedQuantity);

  // Insert transaction history
  try {
    await pool.execute(
      `INSERT INTO inventory_history (warehouse_id, product_id, transaction_type, quantity, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [warehouseId, productId, 'STOCK_OUT', quantity, notes || null, createdBy]
    );
  } catch (error) {
    console.warn('Inventory history table may not exist yet:', error.message);
  }

  return newInventory;
}

async function getInventoryHistory(warehouseId, productId, limit = 50) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM inventory_history 
       WHERE warehouse_id = ? AND product_id = ? 
       ORDER BY created_at DESC LIMIT ?`,
      [warehouseId, productId, limit]
    );
    return rows.map((row) => new InventoryHistory(row));
  } catch (error) {
    console.warn('Inventory history table may not exist yet:', error.message);
    return [];
  }
}

module.exports = {
  findInventoryById,
  findInventoryByWarehouseAndProduct,
  findAllInventoryByWarehouse,
  findAllInventoryByProduct,
  getTotalStockByProduct,
  updateInventoryStock,
  stockIn,
  stockOut,
  getInventoryHistory,
};
