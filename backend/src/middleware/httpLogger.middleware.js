const morgan  = require('morgan');
const logger  = require('../config/logger');

/**
 * Stream Morgan output vào Winston
 * Thay vì Morgan log ra console riêng, giờ đi qua Winston
 * để tất cả log được tập trung vào 1 chỗ
 */
const stream = {
  write: (message) => {
    // Morgan thêm \n cuối — trim để tránh dòng trắng
    logger.http(message.trim());
  },
};

/**
 * Bỏ qua log cho health check endpoint
 * Tránh spam log với các request monitor định kỳ
 */
const skip = (req) => {
  return req.url === '/' || req.url === '/health';
};

const httpLogger = morgan(
  // Custom format: method + url + status + response time + user agent
  ':method :url :status :res[content-length] - :response-time ms - :user-agent',
  { stream, skip }
);

module.exports = httpLogger;