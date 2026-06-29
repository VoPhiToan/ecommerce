const { createPaymentUrl, verifyReturnSignature, getResponseMessage } = require('../utils/vnpay.util');
const paymentRepository = require('../repositories/payment.repository');
const { findOrderById, updateOrderStatus, updatePaymentStatus } = require('../repositories/order.repository');
const createLogger = require('../utils/logger.util');

const log = createLogger('PaymentService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const paymentService = {
  /**
   * Khởi tạo thanh toán — tạo payment record + trả về URL redirect VNPay
   */
  async initiateVnpayPayment({ orderId, userId, ipAddr }) {
    const order = await findOrderById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.userId !== userId) {
      log.warn('Unauthorized payment attempt', { orderId, userId });
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    if (order.orderStatus !== 'pending') {
      const err = new Error(`Order cannot be paid. Current status: ${order.orderStatus}`);
      err.statusCode = 400;
      throw err;
    }

    const { paymentUrl, txnRef } = createPaymentUrl({
      orderId,
      amount:    order.totalAmount,
      orderInfo: `Thanh toan don hang ${order.orderNumber}`,
      ipAddr,
    });

    await paymentRepository.create({
      order_id:    orderId,
      amount:      order.totalAmount,
      vnp_txn_ref: txnRef,
    });

    log.info('Payment initiated', { orderId, txnRef, amount: order.totalAmount });

    return { paymentUrl, txnRef, orderId };
  },

  /**
   * Xử lý returnUrl — user redirect về sau khi thanh toán
   * Cập nhật trạng thái ngay tại đây (dev sandbox; production dùng IPN)
   * @returns redirect URL cho frontend
   */
  async handleReturn(vnpParams) {
    const responseCode = vnpParams['vnp_ResponseCode'];
    const txnRef       = vnpParams['vnp_TxnRef'];

    // 1. Xác minh chữ ký
    const isValid = verifyReturnSignature(vnpParams);
    if (!isValid) {
      log.warn('Invalid VNPay return signature', { txnRef });
      return `${FRONTEND_URL}/payment-result?success=false&message=${encodeURIComponent('Chữ ký không hợp lệ')}`;
    }

    const isSuccess = responseCode === '00';
    const message   = getResponseMessage(responseCode);

    // 2. Tìm payment record
    const payment = await paymentRepository.findByTxnRef(txnRef);
    if (!payment) {
      log.warn('Return received for unknown txnRef', { txnRef });
      return `${FRONTEND_URL}/payment-result?success=false&message=${encodeURIComponent('Không tìm thấy giao dịch')}`;
    }

    // 3. Cập nhật nếu chưa xử lý (idempotency)
    if (payment.status === 'pending') {
      const newPaymentStatus = isSuccess ? 'paid' : 'failed';
      const newOrderStatus   = isSuccess ? 'processing' : 'cancelled';

      await paymentRepository.updateByTxnRef(txnRef, {
        status:             newPaymentStatus,
        vnp_transaction_no: vnpParams['vnp_TransactionNo'],
        vnp_bank_code:      vnpParams['vnp_BankCode'],
        vnp_pay_date:       vnpParams['vnp_PayDate'],
        vnp_response_code:  responseCode,
        raw_response:       vnpParams,
      });

      await updateOrderStatus(payment.order_id, newOrderStatus);
      await updatePaymentStatus(payment.order_id, newPaymentStatus);

      log.info('Return processed', { txnRef, orderId: payment.order_id, isSuccess });
    }

    return `${FRONTEND_URL}/payment-result?success=${isSuccess}&orderId=${payment.order_id}&message=${encodeURIComponent(message)}`;
  },

  /**
   * Xử lý IPN webhook từ VNPay (production source of truth)
   */
  async handleIpn(vnpParams) {
    const txnRef       = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];

    // 1. Xác minh chữ ký
    const isValid = verifyReturnSignature(vnpParams);
    if (!isValid) {
      log.warn('IPN received with invalid signature', { txnRef });
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    // 2. Tìm payment record
    const payment = await paymentRepository.findByTxnRef(txnRef);
    if (!payment) {
      log.warn('IPN received for unknown txnRef', { txnRef });
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền
    const vnpAmount = parseInt(vnpParams['vnp_Amount']);
    if (Math.round(payment.amount) * 100 !== vnpAmount) {
      log.warn('IPN amount mismatch', { txnRef, expected: Math.round(payment.amount) * 100, received: vnpAmount });
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4. Idempotency
    if (payment.status !== 'pending') {
      log.info('IPN already processed', { txnRef, currentStatus: payment.status });
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Update payment + order
    const isSuccess        = responseCode === '00';
    const newPaymentStatus = isSuccess ? 'paid' : 'failed';
    const newOrderStatus   = isSuccess ? 'processing' : 'cancelled';

    await paymentRepository.updateByTxnRef(txnRef, {
      status:             newPaymentStatus,
      vnp_transaction_no: vnpParams['vnp_TransactionNo'],
      vnp_bank_code:      vnpParams['vnp_BankCode'],
      vnp_pay_date:       vnpParams['vnp_PayDate'],
      vnp_response_code:  responseCode,
      raw_response:       vnpParams,
    });

    await updateOrderStatus(payment.order_id, newOrderStatus);
    await updatePaymentStatus(payment.order_id, newPaymentStatus);

    log.info('IPN processed', { txnRef, orderId: payment.order_id, isSuccess });

    return { RspCode: '00', Message: 'Confirmed' };
  },
};

module.exports = paymentService;
