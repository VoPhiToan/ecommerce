const hpp    = require('hpp');
const logger = require('../config/logger');

/**
 * Sanitize input — xoá các ký tự nguy hiểm khỏi req.body và req.query
 * Tránh NoSQL injection và XSS
 */
const sanitizeInput = (req, res, next) => {
  // Xoá các key bắt đầu bằng $ hoặc chứa . — đặc trưng của NoSQL injection
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        logger.warn('Potential injection attempt blocked', {
          key,
          ip:  req.ip,
          url: req.originalUrl,
        });
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Strip script tags cơ bản
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      }
    }
    return obj;
  };

  sanitize(req.body);
  sanitize(req.query);
  next();
};

/**
 * HPP — HTTP Parameter Pollution Protection
 * Ngăn tấn công bằng cách truyền nhiều giá trị cho cùng 1 param
 * Ví dụ: GET /products?sort=price&sort=name → chỉ lấy giá trị cuối
 */
const preventHpp = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit'], // các param được phép duplicate
});

/**
 * Block suspicious requests — phát hiện các pattern tấn công phổ biến
 */
const blockSuspiciousRequests = (req, res, next) => {
  const suspicious = [
    /(\.\.\/)/, // path traversal
    /<script>/i, // XSS
    /union.*select/i, // SQL injection
    /exec\s*\(/i, // code injection
    /eval\s*\(/i,
  ];

  const checkString = (str) => suspicious.some(pattern => pattern.test(str));

  const urlSuspicious = checkString(req.originalUrl);
  const bodySuspicious = req.body && checkString(JSON.stringify(req.body));

  if (urlSuspicious || bodySuspicious) {
    logger.warn('Suspicious request blocked', {
      ip:     req.ip,
      url:    req.originalUrl,
      method: req.method,
      requestId: req.requestId,
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid request',
    });
  }

  next();
};

/**
 * Giới hạn kích thước request body
 * Tránh tấn công DoS bằng payload khổng lồ
 */
const limitRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (contentLength > MAX_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
    });
  }
  next();
};

module.exports = {
  sanitizeInput,
  preventHpp,
  blockSuspiciousRequests,
  limitRequestSize,
};