const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
const { authenticate }    = require('../middleware/auth.middleware');
const { authorize }       = require('../middleware/rbac.middleware');
const validateRequest     = require('../middleware/validate.middleware');

router.get(
  '/warehouse/:warehouseId/product/:productId',
  authenticate,
  authorize('warehouse:read'),
  [
    param('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    param('productId').isInt().withMessage('Product ID must be a valid integer'),
  ],
  validateRequest,
  inventoryController.getStock
);

router.get(
  '/warehouse/:warehouseId',
  authenticate,
  authorize('warehouse:read'),
  [param('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer')],
  validateRequest,
  inventoryController.getWarehouseStock
);

router.get(
  '/product/:productId',
  authenticate,
  authorize('warehouse:read'),
  [param('productId').isInt().withMessage('Product ID must be a valid integer')],
  validateRequest,
  inventoryController.getProductStock
);

router.get(
  '/product/:productId/total',
  authenticate,
  authorize('warehouse:read'),
  [param('productId').isInt().withMessage('Product ID must be a valid integer')],
  validateRequest,
  inventoryController.getTotalStockByProduct
);

router.get(
  '/history/warehouse/:warehouseId/product/:productId',
  authenticate,
  authorize('warehouse:read'),
  [
    param('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    param('productId').isInt().withMessage('Product ID must be a valid integer'),
  ],
  validateRequest,
  inventoryController.getHistory
);

router.post(
  '/stock-in',
  authenticate,
  authorize('warehouse:update'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('notes').optional().trim(),
  ],
  validateRequest,
  inventoryController.stockInTransaction
);

router.post(
  '/stock-out',
  authenticate,
  authorize('warehouse:update'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('notes').optional().trim(),
  ],
  validateRequest,
  inventoryController.stockOutTransaction
);

router.post(
  '/reserve',
  authenticate,
  authorize('warehouse:update'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  inventoryController.reserve
);

router.post(
  '/release-reservation',
  authenticate,
  authorize('warehouse:update'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  inventoryController.release
);

module.exports = router;