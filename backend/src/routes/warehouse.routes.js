const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const warehouseController = require('../controllers/warehouse.controller');
const { authenticate }    = require('../middleware/auth.middleware');
const { authorize }       = require('../middleware/rbac.middleware');
const validateRequest     = require('../middleware/validate.middleware');

router.get('/', authenticate, warehouseController.getAll);

router.get(
  '/:id',
  authenticate,
  [param('id').isInt().withMessage('Warehouse ID must be a valid integer')],
  validateRequest,
  warehouseController.getById
);

router.post(
  '/',
  authenticate,
  authorize('warehouse:update'),
  [
    body('name').notEmpty().withMessage('Warehouse name is required').trim(),
    body('address').notEmpty().withMessage('Address is required').trim(),
    body('country').notEmpty().withMessage('Country is required').trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('postalCode').optional().trim(),
    body('managerId').optional().isInt().withMessage('Manager ID must be a valid integer'),
  ],
  validateRequest,
  warehouseController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('warehouse:update'),
  [
    param('id').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('name').optional().notEmpty().withMessage('Warehouse name cannot be empty').trim(),
    body('address').optional().notEmpty().withMessage('Address cannot be empty').trim(),
    body('country').optional().notEmpty().withMessage('Country cannot be empty').trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('postalCode').optional().trim(),
    body('managerId').optional().isInt().withMessage('Manager ID must be a valid integer'),
  ],
  validateRequest,
  warehouseController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('warehouse:update'),
  [param('id').isInt().withMessage('Warehouse ID must be a valid integer')],
  validateRequest,
  warehouseController.remove
);

module.exports = router; 