const {
  getCurrentStock,
  getStockByWarehouse,
  getStockByProduct,
  getTotalStock,
  processStockIn,
  processStockOut,
  getTransactionHistory,
  reserveInventory,
  releaseReservation,
} = require('../services/inventory.service');

async function getStock(req, res, next) {
  try {
    const { warehouseId, productId } = req.params;
    const stock = await getCurrentStock(parseInt(warehouseId), parseInt(productId));
    res.json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
}

async function getWarehouseStock(req, res, next) {
  try {
    const { warehouseId } = req.params;
    const stocks = await getStockByWarehouse(parseInt(warehouseId));
    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
}

async function getProductStock(req, res, next) {
  try {
    const { productId } = req.params;
    const stocks = await getStockByProduct(parseInt(productId));
    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
}

async function getTotalStockByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const total = await getTotalStock(parseInt(productId));
    res.json({ success: true, data: total });
  } catch (error) {
    next(error);
  }
}

async function stockInTransaction(req, res, next) {
  try {
    const result = await processStockIn(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function stockOutTransaction(req, res, next) {
  try {
    const result = await processStockOut(req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const { warehouseId, productId } = req.params;
    const history = await getTransactionHistory(parseInt(warehouseId), parseInt(productId));
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

async function reserve(req, res, next) {
  try {
    const { warehouseId, productId, quantity } = req.body;
    const result = await reserveInventory(parseInt(warehouseId), parseInt(productId), parseInt(quantity));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function release(req, res, next) {
  try {
    const { warehouseId, productId, quantity } = req.body;
    const result = await releaseReservation(parseInt(warehouseId), parseInt(productId), parseInt(quantity));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStock,
  getWarehouseStock,
  getProductStock,
  getTotalStockByProduct,
  stockInTransaction,
  stockOutTransaction,
  getHistory,
  reserve,
  release,
};
