const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const orderController  = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');
const validateRequest  = require('../middleware/validate.middleware');

// Customer tạo order
router.post(
  '/',
  authenticate,
  [
    body('warehouseId').isInt().withMessage('Warehouse ID must be a valid integer'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  ],
  validateRequest,
  orderController.create
);

// Customer xem orders của mình
router.get('/my-orders', authenticate, orderController.getUserList);

// Staff/Admin xem orders theo status
router.get(
  '/status/:status',
  authenticate,
  authorize('order:read'),
  [param('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])],
  validateRequest,
  orderController.getByStatus
);

// Staff/Admin xem tất cả orders
router.get('/', authenticate, authorize('order:read'), orderController.adminGetAll);

// Xem chi tiết order
router.get(
  '/:id',
  authenticate,
  [param('id').isInt().withMessage('Order ID must be a valid integer')],
  validateRequest,
  orderController.getDetail
);

// Staff/Admin cập nhật order
router.put(
  '/:id',
  authenticate,
  authorize('order:update'),
  [
    param('id').isInt().withMessage('Order ID must be a valid integer'),
    body('orderStatus').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
  ],
  validateRequest,
  orderController.update
);

module.exports = router;