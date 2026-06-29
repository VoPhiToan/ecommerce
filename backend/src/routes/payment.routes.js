const express     = require('express');
const router      = express.Router();
const { authenticate }   = require('../middleware/auth.middleware');
const paymentController  = require('../controllers/payment.controller');

// Khởi tạo thanh toán (yêu cầu đăng nhập)
router.post('/initiate', authenticate, paymentController.initiatePayment);

// VNPay callback — không cần auth (VNPay gọi trực tiếp)
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/vnpay-ipn',    paymentController.vnpayIpn);

module.exports = router;
