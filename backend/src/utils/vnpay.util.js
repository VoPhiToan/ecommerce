const crypto = require('crypto');

function formatVnpDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach((k) => { sorted[k] = obj[k]; });
  return sorted;
}

function buildSignData(sortedParams) {
  return Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v == null ? '' : String(v)}`)
    .join('&');
}

function hmacSha512(key, data) {
  const secret = String(key || '').trim();
  return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
}

/**
 * Tạo URL thanh toán VNPay
 * @returns {{ paymentUrl: string, txnRef: string }}
 */
function createPaymentUrl({ orderId, amount, orderInfo, ipAddr }) {
  const txnRef    = `${orderId}-${Date.now()}`;
  const createDate = formatVnpDate(new Date());

  // Chuẩn hoá IP: VNPay chỉ chấp nhận IPv4
  const clientIp = (ipAddr || '').replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1') || '127.0.0.1';

  const params = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    String(process.env.VNPAY_TMN_CODE || '').trim(),
    vnp_Amount:     String(Math.round(amount) * 100),
    vnp_BankCode:   'VNPAYQR',
    vnp_CreateDate: createDate,
    vnp_CurrCode:   'VND',
    vnp_IpAddr:     clientIp,
    vnp_Locale:     'vn',
    vnp_OrderInfo:  orderInfo,
    vnp_OrderType:  'other',
    vnp_ReturnUrl:  String(process.env.VNPAY_RETURN_URL || '').trim(),
    vnp_TxnRef:     txnRef,
  };

  const sorted   = sortObject(params);
  const signData = buildSignData(sorted);
  const signed   = hmacSha512(process.env.VNPAY_HASH_SECRET, signData);

  // Dùng encodeURIComponent thay URLSearchParams để tránh encode dấu cách thành '+' (VNPay không decode '+' đúng)
  const queryString = Object.entries(sorted)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return {
    paymentUrl: `${process.env.VNPAY_URL}?${queryString}&vnp_SecureHash=${signed}`,
    txnRef,
  };
}

/**
 * Xác minh chữ ký từ VNPay (dùng cho cả return URL và IPN)
 */
function verifyReturnSignature(vnpParams) {
  const secureHash = vnpParams['vnp_SecureHash'];
  if (!secureHash) return false;

  const params = { ...vnpParams };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted   = sortObject(params);
  const signData = buildSignData(sorted);
  const signed   = hmacSha512(process.env.VNPAY_HASH_SECRET, signData);

  return signed.toLowerCase() === secureHash.toLowerCase();
}

const RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP).',
  '24': 'Khách hàng hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi không xác định.',
};

function getResponseMessage(code) {
  return RESPONSE_MESSAGES[code] || RESPONSE_MESSAGES['99'];
}

module.exports = { createPaymentUrl, verifyReturnSignature, getResponseMessage };
