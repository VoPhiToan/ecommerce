const { client } = require('../config/redis');

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL) || 300; // 5 phút

const cacheService = {
  /**
   * Lấy data từ cache
   * Trả về parsed object hoặc null nếu không có
   */
  async get(key) {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Cache miss không nên crash app — fallback về DB
      console.error('[Cache] GET error:', error.message);
      return null;
    }
  },

  /**
   * Lưu data vào cache với TTL
   */
  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('[Cache] SET error:', error.message);
    }
  },

  /**
   * Xoá 1 key cụ thể
   */
  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('[Cache] DEL error:', error.message);
    }
  },

  /**
   * Xoá nhiều keys theo pattern — dùng khi invalidate nhóm cache
   * Ví dụ: deleteByPattern('products:*') xoá tất cả cache liên quan products
   */
  async deleteByPattern(pattern) {
    try {
      // SCAN thay vì KEYS để không block Redis khi có nhiều key
      let cursor = 0;
      do {
        const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;

        if (result.keys.length > 0) {
          await client.del(result.keys);
          console.log(`[Cache] Deleted ${result.keys.length} keys matching: ${pattern}`);
        }
      } while (cursor !== 0);
    } catch (error) {
      console.error('[Cache] DELETE PATTERN error:', error.message);
    }
  },

  /**
   * Cache-aside pattern — tự động get từ cache hoặc fallback DB
   *
   * Cách dùng:
   *   const products = await cacheService.remember('products:list', () =>
   *     productRepository.findAll()
   *   );
   *
   * Luồng:
   *   1. Kiểm tra cache → có → trả về ngay
   *   2. Không có → gọi fetchFn() lấy từ DB
   *   3. Lưu kết quả vào cache
   *   4. Trả về kết quả
   */
  async remember(key, fetchFn, ttl = DEFAULT_TTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }
    return data;
  },
};

module.exports = cacheService;