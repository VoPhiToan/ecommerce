const {
  findAllProducts,
  countProducts,
  findProductById,
  findProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../repositories/product.repository');

const cacheService = require('./cache.service');
const CacheKeys    = require('../utils/cacheKeys');

const productService = {
  async getAll(params = {}) {
    const cacheKey = CacheKeys.PRODUCT_LIST(params);
    return cacheService.remember(
      cacheKey,
      async () => {
        const { page = 1, limit = 10, search = '' } = params;
        const categoryId = params.categoryId ? parseInt(params.categoryId) : null;
        const [products, total] = await Promise.all([
          findAllProducts({ page, limit, search, categoryId }),
          countProducts(search, categoryId),
        ]);
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      180
    );
  },

  async getById(id) {
    const cacheKey = CacheKeys.PRODUCT_DETAIL(id);
    return cacheService.remember(
      cacheKey,
      () => findProductById(id),
      600
    );
  },

  async create(data) {
    const existing = await findProductBySku(data.sku);
    if (existing) {
      const error = new Error('SKU already exists');
      error.statusCode = 409;
      throw error;
    }
    const product = await createProduct({
      sku:         data.sku,
      name:        data.name,
      description: data.description || null,
      categoryId:  data.categoryId,
      price:       data.price,
      weight:      data.weight      || 0,
      imageUrl:    data.imageUrl    || null,
    });
    await cacheService.deleteByPattern(CacheKeys.PRODUCT_ALL);
    return product;
  },

  async update(id, data) {
    const existing = await findProductById(id);
    if (!existing) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    const product = await updateProduct(id, {
      name:        data.name        ?? existing.name,
      description: data.description ?? existing.description,
      categoryId:  data.categoryId  ?? existing.categoryId,
      price:       data.price       ?? existing.price,
      weight:      data.weight      ?? existing.weight,
      isActive:    data.isActive    ?? existing.isActive,
      imageUrl:    data.imageUrl,
    });
    await Promise.all([
      cacheService.del(CacheKeys.PRODUCT_DETAIL(id)),
      cacheService.deleteByPattern(CacheKeys.PRODUCT_ALL),
    ]);
    return product;
  },

  async remove(id) {
    const existing = await findProductById(id);
    if (!existing) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    await deleteProduct(id);
    await Promise.all([
      cacheService.del(CacheKeys.PRODUCT_DETAIL(id)),
      cacheService.deleteByPattern(CacheKeys.PRODUCT_ALL),
    ]);
    return true;
  },
};


module.exports = productService;