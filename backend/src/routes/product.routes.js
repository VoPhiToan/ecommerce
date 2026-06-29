const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const productController      = require('../controllers/product.controller');
const { authenticate }       = require('../middleware/auth.middleware');
const { authorize }          = require('../middleware/rbac.middleware');
const { uploadProductImage } = require('../middleware/upload.middleware');
const validateRequest        = require('../middleware/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Quản lý sản phẩm
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên hoặc mô tả
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', productController.getAll);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Product ID must be a valid integer')],
  validateRequest,
  productController.getById
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       422:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/',
  authenticate,
  authorize('product:create'),
  uploadProductImage,
  [
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('categoryId').isInt().withMessage('Category ID must be a valid integer'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  productController.create
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               price: { type: number }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put(
  '/:id',
  authenticate,
  authorize('product:update'),
  uploadProductImage,
  [
    param('id').isInt().withMessage('Product ID must be a valid integer'),
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  productController.update
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xoá sản phẩm (soft delete)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       403:
 *         description: Không có quyền
 */
router.delete(
  '/:id',
  authenticate,
  authorize('product:delete'),
  [param('id').isInt().withMessage('Product ID must be a valid integer')],
  validateRequest,
  productController.remove
);

module.exports = router;