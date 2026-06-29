const cloudinary = require('../config/cloudinary');

/**
 * Xoá ảnh trên Cloudinary theo public_id
 * Gọi khi user update ảnh mới — xoá ảnh cũ để tránh tốn storage
 */
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Extract public_id từ URL Cloudinary
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/ecommerce/products/public_id.jpg
    const urlParts  = imageUrl.split('/');
    const fileName  = urlParts[urlParts.length - 1].split('.')[0];
    const folder    = urlParts[urlParts.length - 2];
    const publicId  = `${folder}/${fileName}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Không throw — lỗi xoá ảnh cũ không nên block luồng chính
    console.error('[Cloudinary] Failed to delete image:', error.message);
  }
};

/**
 * Lấy URL thumbnail nhỏ hơn từ URL gốc
 * Dùng Cloudinary transformation on-the-fly
 */
const getThumbnailUrl = (imageUrl, width = 300, height = 300) => {
  if (!imageUrl) return null;
  return imageUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
};

module.exports = { deleteImage, getThumbnailUrl };