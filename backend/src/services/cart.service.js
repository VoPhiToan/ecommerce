const {
  findCartByUserId,
  createCart,
  findCartItemsByCartId,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
  updateCartStatus,
} = require('../repositories/cart.repository');
const { findProductById } = require('../repositories/product.repository');

async function getOrCreateCart(userId) {
  let cart = await findCartByUserId(userId);
  if (!cart) {
    cart = await createCart(userId);
  }
  return cart;
}

async function getCart(userId) {
  const cart  = await getOrCreateCart(userId);
  const items = await findCartItemsByCartId(cart.id);

  // Tính tổng từ items — không cần thêm query DB
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return {
    cart,
    items,
    total,
    itemCount: items.length,
  };
}

async function addToCart(userId, { productId, quantity }) {
  if (!productId || !quantity || quantity <= 0) {
    const error = new Error('Product ID and quantity are required');
    error.statusCode = 422;
    throw error;
  }

  const product = await findProductById(productId);
  if (!product || !product.isActive) {
    const error = new Error('Product not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  const cart = await getOrCreateCart(userId);
  await addItemToCart(cart.id, productId, quantity, product.price);

  return getCart(userId);
}

async function updateItemQuantity(userId, { productId, quantity }) {
  if (quantity <= 0) {
    return removeFromCart(userId, productId);
  }

  const cart = await getOrCreateCart(userId);
  await updateCartItemQuantity(cart.id, productId, quantity);

  return getCart(userId);
}

async function removeFromCart(userId, productId) {
  const cart = await getOrCreateCart(userId);
  await removeCartItem(cart.id, productId);

  return getCart(userId);
}

/**
 * Xoá hết giỏ và đánh dấu cart là 'completed'.
 * Lần sau getOrCreateCart sẽ tạo giỏ mới cho user.
 */
async function clearUserCart(userId) {
  const cart = await getOrCreateCart(userId);
  await clearCartItems(cart.id);
  await updateCartStatus(cart.id, 'completed');
  return { cart: null, items: [], total: 0, itemCount: 0 };
}

module.exports = {
  getOrCreateCart,
  getCart,
  addToCart,
  updateItemQuantity,
  removeFromCart,
  clearUserCart,
};
