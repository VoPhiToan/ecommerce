const {
  generateOrderNumber,
  findOrderById,
  findOrderByOrderNumber,
  findOrdersByUserId,
  countOrdersByUserId,
  createOrder,
  addOrderItems,
  findOrderItems,
  updateOrderStatus,
  updatePaymentStatus,
  getOrdersByStatus,
  countOrdersByStatus,
  findAllOrders,
  countAllOrders,
} = require('../repositories/order.repository');
const { getCart, clearUserCart } = require('./cart.service');
const { findWarehouseById } = require('../repositories/warehouse.repository');

async function createOrderFromCart(userId, { warehouseId, shippingAddress }) {
  if (!warehouseId || !shippingAddress) {
    const error = new Error('Warehouse ID and shipping address are required');
    error.statusCode = 422;
    throw error;
  }

  const warehouse = await findWarehouseById(warehouseId);
  if (!warehouse) {
    const error = new Error('Warehouse not found');
    error.statusCode = 404;
    throw error;
  }

  const cartData = await getCart(userId);
  if (!cartData.items || cartData.items.length === 0) {
    const error = new Error('Cart is empty');
    error.statusCode = 422;
    throw error;
  }

  const orderNumber = await generateOrderNumber();
  const order = await createOrder({
    orderNumber,
    userId,
    warehouseId,
    totalAmount: cartData.total,
    shippingAddress,
  });

  const orderItems = cartData.items.map((item) => ({
    productId: item.productId,
    warehouseId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  await addOrderItems(order.id, orderItems);
  await clearUserCart(userId);

  return getOrderDetails(order.id);
}

async function getOrderDetails(orderId) {
  const order = await findOrderById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const items = await findOrderItems(orderId);
  return {
    order,
    items,
  };
}

async function getUserOrders(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    findOrdersByUserId(userId, limit, offset),
    countOrdersByUserId(userId),
  ]);
  const totalPages = Math.ceil(total / limit);

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => ({
      ...order,
      items: await findOrderItems(order.id),
    }))
  );

  return {
    orders: ordersWithItems,
    pagination: {
      page, limit, total, totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

async function updateOrder(orderId, { orderStatus, paymentStatus }) {
  const order = await findOrderById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  let updatedOrder = order;
  if (orderStatus) {
    updatedOrder = await updateOrderStatus(orderId, orderStatus);
  }
  if (paymentStatus) {
    updatedOrder = await updatePaymentStatus(orderId, paymentStatus);
  }

  return getOrderDetails(orderId);
}

async function getOrdersByStatusList(status, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const orders = await getOrdersByStatus(status, limit, offset);

  return {
    orders,
    status,
    page,
    limit,
    count: orders.length,
  };
}

async function getAllOrders(page = 1, limit = 20, status = null) {
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    status ? getOrdersByStatus(status, limit, offset) : findAllOrders(limit, offset),
    status ? countOrdersByStatus(status) : countAllOrders(),
  ]);
  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

module.exports = {
  createOrderFromCart,
  getOrderDetails,
  getUserOrders,
  getAllOrders,
  updateOrder,
  getOrdersByStatusList,
};
