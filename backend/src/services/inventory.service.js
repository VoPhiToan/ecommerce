const {
  findInventoryById,
  findInventoryByWarehouseAndProduct,
  findAllInventoryByWarehouse,
  findAllInventoryByProduct,
  getTotalStockByProduct,
  updateInventoryStock,
  stockIn,
  stockOut,
  getInventoryHistory,
} = require('../repositories/inventory.repository');

async function getCurrentStock(warehouseId, productId) {
  const inventory = await findInventoryByWarehouseAndProduct(warehouseId, productId);
  if (!inventory) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }
  return inventory;
}

async function getStockByWarehouse(warehouseId) {
  return findAllInventoryByWarehouse(warehouseId);
}

async function getStockByProduct(productId) {
  return findAllInventoryByProduct(productId);
}

async function getTotalStock(productId) {
  const stock = await getTotalStockByProduct(productId);
  return {
    productId,
    totalQuantity: stock.total_quantity || 0,
    totalReserved: stock.total_reserved || 0,
    totalAvailable: (stock.total_quantity || 0) - (stock.total_reserved || 0),
  };
}

async function processStockIn({ warehouseId, productId, quantity, notes }, userId) {
  if (!warehouseId || !productId || !quantity) {
    const error = new Error('Warehouse ID, Product ID, and Quantity are required');
    error.statusCode = 422;
    throw error;
  }

  if (quantity <= 0) {
    const error = new Error('Quantity must be greater than 0');
    error.statusCode = 422;
    throw error;
  }

  const inventory = await findInventoryByWarehouseAndProduct(warehouseId, productId);
  const currentQuantity = inventory ? inventory.quantity : 0;
  const newQuantity = currentQuantity + quantity;

  return updateInventoryStock(warehouseId, productId, newQuantity, inventory?.reservedQuantity || 0);
}

async function processStockOut({ warehouseId, productId, quantity, notes }, userId) {
  if (!warehouseId || !productId || !quantity) {
    const error = new Error('Warehouse ID, Product ID, and Quantity are required');
    error.statusCode = 422;
    throw error;
  }

  if (quantity <= 0) {
    const error = new Error('Quantity must be greater than 0');
    error.statusCode = 422;
    throw error;
  }

  return stockOut(warehouseId, productId, quantity, notes, userId);
}

async function getTransactionHistory(warehouseId, productId) {
  return getInventoryHistory(warehouseId, productId);
}

async function reserveInventory(warehouseId, productId, quantity) {
  const inventory = await findInventoryByWarehouseAndProduct(warehouseId, productId);

  if (!inventory) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  const availableQuantity = inventory.quantity - inventory.reservedQuantity;
  if (availableQuantity < quantity) {
    const error = new Error('Insufficient available inventory to reserve');
    error.statusCode = 422;
    throw error;
  }

  const newReserved = inventory.reservedQuantity + quantity;
  return updateInventoryStock(warehouseId, productId, inventory.quantity, newReserved);
}

async function releaseReservation(warehouseId, productId, quantity) {
  const inventory = await findInventoryByWarehouseAndProduct(warehouseId, productId);

  if (!inventory) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  if (inventory.reservedQuantity < quantity) {
    const error = new Error('Cannot release more than reserved quantity');
    error.statusCode = 422;
    throw error;
  }

  const newReserved = inventory.reservedQuantity - quantity;
  return updateInventoryStock(warehouseId, productId, inventory.quantity, newReserved);
}

module.exports = {
  getCurrentStock,
  getStockByWarehouse,
  getStockByProduct,
  getTotalStock,
  processStockIn,
  processStockOut,
  getTransactionHistory,
  reserveInventory,
  releaseReservation,
};
