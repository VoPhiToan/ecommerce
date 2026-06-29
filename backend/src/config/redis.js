const { createClient } = require('redis');

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 3) return false; // test môi trường không cần retry nhiều
      return retries * 500;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('connect',      () => console.log('[Redis] Connected'));
client.on('error',        (err) => {
  // Không crash khi Redis không có — chỉ log warning
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Redis] Error:', err.message);
  }
});
client.on('reconnecting', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Redis] Reconnecting...');
  }
});

const connectRedis = async () => {
  try {
    if (!client.isOpen) await client.connect();
  } catch (error) {
    // Test môi trường không có Redis → bỏ qua
    if (process.env.NODE_ENV !== 'test') {
      throw error;
    }
    console.warn('[Redis] Not available — running without cache');
  }
};

module.exports = { client, connectRedis };