const logger = require('../config/logger');

/**
 * Các action cần audit — ghi lại ai làm gì lúc nào
 * Quan trọng cho security compliance và điều tra sự cố
 */
const AUDIT_ROUTES = [
  { method: 'POST',   path: '/api/auth/login' },
  { method: 'POST',   path: '/api/auth/logout' },
  { method: 'POST',   path: '/api/auth/logout-all' },
  { method: 'DELETE', path: '/api/users' },
  { method: 'POST',   path: '/api/payment' },
  { method: 'PUT',    path: '/api/orders' },
  { method: 'DELETE', path: '/api/products' },
];

const auditLog = (req, res, next) => {
  const shouldAudit = AUDIT_ROUTES.some(route =>
    req.method === route.method && req.originalUrl.startsWith(route.path)
  );

  if (!shouldAudit) return next();

  // Hook vào response để log sau khi xử lý xong
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    logger.info('AUDIT', {
      method:     req.method,
      url:        req.originalUrl,
      statusCode: res.statusCode,
      userId:     req.user?.id,
      ip:         req.ip,
      userAgent:  req.headers['user-agent'],
      requestId:  req.requestId,
      success:    body?.success,
    });
    return originalJson(body);
  };

  next();
};

module.exports = auditLog;