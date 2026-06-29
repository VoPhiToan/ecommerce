const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
      requestId: req.requestId,
      statusCode,
      stack:     err.stack,
      userId:    req.user?.id,
      body:      req.body,
      ip:        req.ip,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${err.message}`, {
      requestId: req.requestId,
      statusCode,
      userId:    req.user?.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    errors:    err.errors || null,
    requestId: req.requestId,
  });
};

module.exports = errorHandler;