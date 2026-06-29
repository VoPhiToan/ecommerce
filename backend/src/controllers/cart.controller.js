const { getCart, addToCart, updateItemQuantity, removeFromCart, clearUserCart } = require('../services/cart.service');

async function view(req, res, next) {
  try {
    const cart = await getCart(req.user.id);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

async function add(req, res, next) {
  try {
    const cart = await addToCart(req.user.id, req.body);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const cart = await updateItemQuantity(req.user.id, req.body);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await removeFromCart(req.user.id, parseInt(productId));
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

async function clear(req, res, next) {
  try {
    const cart = await clearUserCart(req.user.id);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  view,
  add,
  update,
  remove,
  clear,
};
