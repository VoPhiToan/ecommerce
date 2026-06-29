const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const authController   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validateRequest  = require('../middleware/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Đăng ký, đăng nhập, quản lý token
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       409:
 *         description: Email đã tồn tại
 *       422:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  validateRequest,
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Lấy Access Token mới bằng Refresh Token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Token mới
 *       401:
 *         description: Refresh token không hợp lệ
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Đăng xuất khỏi tất cả thiết bị
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Đã đăng xuất tất cả
 */
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;