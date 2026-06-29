// Mock Redis trước khi require cache.service
jest.mock('../../config/redis', () => ({
  client: {
    get:    jest.fn(),
    setEx:  jest.fn(),
    del:    jest.fn(),
    scan:   jest.fn(),
    incr:   jest.fn(),
    expire: jest.fn(),
  },
}));

const cacheService      = require('../../services/cache.service');
const { client: redis } = require('../../config/redis');

describe('CacheService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('get()', () => {
    it('should return parsed data when cache hit', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ id: 1, name: 'Product' }));

      const result = await cacheService.get('products:1');
      expect(result).toEqual({ id: 1, name: 'Product' });
    });

    it('should return null when cache miss', async () => {
      redis.get.mockResolvedValue(null);
      const result = await cacheService.get('not_exist');
      expect(result).toBeNull();
    });

    it('should return null when Redis throws error', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      const result = await cacheService.get('any_key');
      expect(result).toBeNull();
    });
  });

  describe('remember()', () => {
    it('should return cache when hit — not call fetchFn', async () => {
      const cached  = { id: 1, name: 'Cached Product' };
      const fetchFn = jest.fn();
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await cacheService.remember('products:1', fetchFn);

      expect(result).toEqual(cached);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should call fetchFn and cache result when miss', async () => {
      const dbData  = { id: 1, name: 'DB Product' };
      const fetchFn = jest.fn().mockResolvedValue(dbData);
      redis.get.mockResolvedValue(null);
      redis.setEx.mockResolvedValue('OK');

      const result = await cacheService.remember('products:1', fetchFn, 300);

      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(redis.setEx).toHaveBeenCalledWith('products:1', 300, JSON.stringify(dbData));
      expect(result).toEqual(dbData);
    });
  });
});