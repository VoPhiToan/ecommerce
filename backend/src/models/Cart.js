class Cart {
  constructor({ id, user_id, status, created_at, updated_at }) {
    this.id = id;
    this.userId = user_id;
    this.status = status;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

class CartItem {
  constructor({ id, cart_id, product_id, quantity, unit_price, created_at, updated_at }) {
    this.id = id;
    this.cartId = cart_id;
    this.productId = product_id;
    this.quantity = quantity;
    this.unitPrice = unit_price;
    this.subtotal = quantity * unit_price;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

module.exports = {
  Cart,
  CartItem,
};
