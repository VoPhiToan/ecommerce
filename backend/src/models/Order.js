class Order {
  constructor({ id, order_number, user_id, warehouse_id, total_amount, shipping_address,
                order_status, payment_status, placed_at, updated_at, user_email = null }) {
    this.id            = id;
    this.orderNumber   = order_number;
    this.userId        = user_id;
    this.warehouseId   = warehouse_id;
    this.totalAmount   = total_amount;
    this.shippingAddress = shipping_address;
    this.orderStatus   = order_status;
    this.paymentStatus = payment_status;
    this.placedAt      = placed_at;
    this.updatedAt     = updated_at;
    this.userEmail     = user_email;
  }
}

class OrderItem {
  constructor({ id, order_id, product_id, warehouse_id, quantity, unit_price, subtotal, created_at }) {
    this.id = id;
    this.orderId = order_id;
    this.productId = product_id;
    this.warehouseId = warehouse_id;
    this.quantity = quantity;
    this.unitPrice = unit_price;
    this.subtotal = subtotal || quantity * unit_price;
    this.createdAt = created_at;
  }
}

module.exports = {
  Order,
  OrderItem,
};
