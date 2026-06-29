/**
 * Tập trung tất cả cache key vào 1 chỗ
 * Tránh hardcode string rải rác trong code → dễ maintain
 */
const CacheKeys = {
  // Products
  PRODUCT_LIST:   (query) => `products:list:${JSON.stringify(query)}`,
  PRODUCT_DETAIL: (id)    => `products:detail:${id}`,
  PRODUCT_ALL:             'products:*',

  // Categories
  CATEGORY_LIST:           'categories:list',
  CATEGORY_DETAIL: (id)   => `categories:detail:${id}`,
  CATEGORY_ALL:            'categories:*',

  // Dashboard
  DASHBOARD_STATS:         'dashboard:stats',
  DASHBOARD_SALES:  (period) => `dashboard:sales:${period}`,

  // User
  USER_PROFILE: (id) => `users:profile:${id}`,
};

module.exports = CacheKeys;