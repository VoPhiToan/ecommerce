const { client } = require('../config/redis');

/**
 * Rate limiter dùng Redis — sliding window counter
 * Chính xác hơn express-rate-limit vì dùng Redis shared state
 * Hoạt động đúng khi scale nhiều Node.js instance
 */
const createRateLimiter = ({ windowMs = 60000, max = 100, message = 'Too many requests' }) => {
  return async (req, res, next) => {
    // Key theo IP — có thể đổi thành userId để limit per user
    const key = `ratelimit:${req.ip}:${Math.floor(Date.now() / windowMs)}`;

    try {
      const current = await client.incr(key);

      // Set TTL chỉ lần đầu tiên tạo key
      if (current === 1) {
        await client.expire(key, Math.ceil(windowMs / 1000));
      }

      // Set headers để client biết còn bao nhiêu request
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        return res.status(429).json({ success: false, message });
      }

      next();
    } catch (error) {
      // Redis lỗi → cho qua, không block request
      console.error('[RateLimit] Redis error:', error.message);
      next();
    }
  };
};

// Preset cho các use case khác nhau
const rateLimiters = {
  // API chung — 100 requests/phút
  api: createRateLimiter({ windowMs: 60000, max: 100 }),

  // Login — chặt hơn để chống brute force
  auth: createRateLimiter({
    windowMs: 15 * 60000, // 15 phút
    max: 10,
    message: 'Too many login attempts. Please try again after 15 minutes',
  }),

  // Upload — giới hạn bandwidth
  upload: createRateLimiter({
    windowMs: 60000,
    max: 20,
    message: 'Upload limit exceeded',
  }),
};

module.exports = { createRateLimiter, rateLimiters };