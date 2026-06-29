const logger = require('../config/logger');

/**
 * Wrapper tiện lợi để log với context
 * Dùng trong service/controller thay vì console.log
 */
const createLogger = (module) => ({
  info:  (message, meta = {}) => logger.info(message,  { module, ...meta }),
  warn:  (message, meta = {}) => logger.warn(message,  { module, ...meta }),
  error: (message, meta = {}) => logger.error(message, { module, ...meta }),
  debug: (message, meta = {}) => logger.debug(message, { module, ...meta }),
});

module.exports = createLogger;