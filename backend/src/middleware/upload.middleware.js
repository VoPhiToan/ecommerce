const multer                  = require('multer');
const { CloudinaryStorage }   = require('multer-storage-cloudinary');
const cloudinary              = require('../config/cloudinary');

/**
 * Factory tạo storage theo folder và allowed formats
 * Dùng factory để tái sử dụng cho nhiều loại upload khác nhau:
 * - products: ảnh sản phẩm
 * - avatars: ảnh đại diện user
 * - categories: ảnh danh mục
 */
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:          `ecommerce/${folder}`,
      allowed_formats: allowedFormats,
      // Tự động transform ảnh khi upload: resize về max 1200px, chất lượng auto
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      ],
      // Tên file = timestamp + original name để tránh trùng
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    }),
  });
};

/**
 * Validate file trước khi upload
 * Chặn file không phải ảnh ngay tại server, không tốn bandwidth Cloudinary
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'), false);
  }
};

// Upload 1 ảnh sản phẩm chính
const uploadProductImage = multer({
  storage:    createCloudinaryStorage('products'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('image'); // field name trong form-data

// Upload nhiều ảnh sản phẩm (gallery) — max 5 ảnh
const uploadProductImages = multer({
  storage:    createCloudinaryStorage('products'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).array('images', 5); // field name + max count

// Upload avatar user
const uploadAvatar = multer({
  storage: createCloudinaryStorage('avatars'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max cho avatar
  },
}).single('avatar');

// Upload ảnh category
const uploadCategoryImage = multer({
  storage:    createCloudinaryStorage('categories'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single('image');

/**
 * Wrapper xử lý lỗi Multer — Multer throw error theo cách riêng
 * nên cần wrap lại để Express errorHandler bắt được
 */
const handleUploadError = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is 5MB',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 5 images allowed',
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      // Lỗi từ fileFilter (không phải ảnh)
      return res.status(400).json({ success: false, message: err.message });
    });
  };
};

module.exports = {
  uploadProductImage:  handleUploadError(uploadProductImage),
  uploadProductImages: handleUploadError(uploadProductImages),
  uploadAvatar:        handleUploadError(uploadAvatar),
  uploadCategoryImage: handleUploadError(uploadCategoryImage),
};