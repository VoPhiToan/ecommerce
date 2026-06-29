const paymentService = require('../services/payment.service');

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    '127.0.0.1'
  );
}

async function initiatePayment(req, res, next) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(422).json({ success: false, message: 'orderId is required' });
    }

    const result = await paymentService.initiateVnpayPayment({
      orderId: parseInt(orderId),
      userId:  req.user.id,
      ipAddr:  getClientIp(req),
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function vnpayReturn(req, res) {
  try {
    const redirectUrl = await paymentService.handleReturn(req.query);
    res.redirect(redirectUrl);
  } catch (error) {
    const url = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${url}/payment-result?success=false&message=${encodeURIComponent('Lỗi xử lý thanh toán')}`);
  }
}

async function vnpayIpn(req, res) {
  try {
    const result = await paymentService.handleIpn(req.query);
    res.json(result);
  } catch (error) {
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
}

module.exports = { initiatePayment, vnpayReturn, vnpayIpn };
