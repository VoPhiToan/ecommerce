const productService       = require('../services/product.service');
const { deleteImage }      = require('../utils/cloudinary.util');

const productController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, categoryId, minPrice, maxPrice, sortBy, sortOrder } = req.query;
      const result = await productService.getAll({
        page:  parseInt(page),
        limit: parseInt(limit),
        search, categoryId, minPrice, maxPrice, sortBy, sortOrder,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getById(parseInt(req.params.id));
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  async create(req, res, next) {
    try {
      const imageUrl = req.file?.path || null;
      const product  = await productService.create({ ...req.body, imageUrl });
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      if (req.file?.path) await deleteImage(req.file.path);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const productId   = parseInt(req.params.id);
      const newImageUrl = req.file?.path || null;

      let oldImageUrl = null;
      if (newImageUrl) {
        const existing = await productService.getById(productId);
        oldImageUrl = existing?.imageUrl;
      }

      const product = await productService.update(productId, {
        ...req.body,
        ...(newImageUrl && { imageUrl: newImageUrl }),
      });

      if (newImageUrl && oldImageUrl) await deleteImage(oldImageUrl);

      res.json({ success: true, data: product });
    } catch (error) {
      if (req.file?.path) await deleteImage(req.file.path);
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const productId = parseInt(req.params.id);
      const existing  = await productService.getById(productId);
      await productService.remove(productId);
      if (existing?.imageUrl) await deleteImage(existing.imageUrl);
      res.json({ success: true, message: 'Product deleted' });
    } catch (error) { next(error); }
  },
};

module.exports = productController;
