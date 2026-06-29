const { pool }        = require('../config/db');
const { client: redisClient } = require('../config/redis');

/**
 * Chạy 1 lần trước tất cả test suites
 * Load .env.test thay vì .env
 */
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  require('dotenv').config({ path: '.env.test' });
});

/**
 * Chạy 1 lần sau tất cả test suites
 * Đóng kết nối để Jest thoát sạch — không treo process
 */
afterAll(async () => {
  await pool.end();
  if (redisClient.isOpen) await redisClient.quit();
});