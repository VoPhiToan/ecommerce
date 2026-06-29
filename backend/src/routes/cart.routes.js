const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const cartController   = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validateRequest  = require('../middleware/validate.middleware');

router.get('/', authenticate, cartController.view);

router.post(
  '/add',
  authenticate,
  [
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  cartController.add
);

router.put(
  '/update',
  authenticate,
  [
    body('productId').isInt().withMessage('Product ID must be a valid integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  cartController.update
);

router.delete(
  '/:productId',
  authenticate,
  [param('productId').isInt().withMessage('Product ID must be a valid integer')],
  validateRequest,
  cartController.remove
);

router.delete('/', authenticate, cartController.clear);

module.exports = router;