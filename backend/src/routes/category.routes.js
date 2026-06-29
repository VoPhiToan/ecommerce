const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const { authenticate }   = require('../middleware/auth.middleware');
const { authorize }      = require('../middleware/rbac.middleware');
const validateRequest    = require('../middleware/validate.middleware');

router.get('/', categoryController.getAll);

router.get(
  '/:id',
  [param('id').isInt().withMessage('Category ID must be a valid integer')],
  validateRequest,
  categoryController.getById
);

router.post(
  '/',
  authenticate,
  authorize('category:create'),
  [
    body('name').notEmpty().withMessage('Category name is required').trim(),
    body('description').optional().trim(),
  ],
  validateRequest,
  categoryController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('category:update'),
  [
    param('id').isInt().withMessage('Category ID must be a valid integer'),
    body('name').optional().notEmpty().withMessage('Category name cannot be empty').trim(),
    body('description').optional().trim(),
  ],
  validateRequest,
  categoryController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('category:delete'),
  [param('id').isInt().withMessage('Category ID must be a valid integer')],
  validateRequest,
  categoryController.remove
);

module.exports = router;