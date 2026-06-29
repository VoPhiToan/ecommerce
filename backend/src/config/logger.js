const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Custom format: timestamp + level + message + metadata
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // in stack trace khi có error
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    // Thêm metadata nếu có (userId, requestId...)
    if (Object.keys(meta).length) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    // Thêm stack trace nếu là error
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// Format màu cho console khi dev
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Ghi tất cả log ra file, rotate hàng ngày
    new DailyRotateFile({
      dirname:       path.join(__dirname, '../../logs'),
      filename:      'app-%DATE%.log',
      datePattern:   'YYYY-MM-DD',
      maxSize:       '20m',  // max 20MB mỗi file
      maxFiles:      '30d',  // giữ 30 ngày
      zippedArchive: true,   // nén file cũ
    }),

    // Ghi riêng error ra file error.log
    new DailyRotateFile({
      dirname:    path.join(__dirname, '../../logs'),
      filename:   'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level:      'error',   // chỉ ghi level error trở lên
      maxSize:    '20m',
      maxFiles:   '30d',
      zippedArchive: true,
    }),
  ],
});

// Thêm console transport khi không phải production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

module.exports = logger;