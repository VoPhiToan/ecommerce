const {
  createOrderFromCart,
  getOrderDetails,
  getUserOrders,
  getAllOrders,
  updateOrder,
  getOrdersByStatusList,
} = require('../services/order.service');

async function create(req, res, next) {
  try {
    const order = await createOrderFromCart(req.user.id, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

async function getDetail(req, res, next) {
  try {
    const order = await getOrderDetails(parseInt(req.params.id));
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

async function getUserList(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getUserOrders(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const order = await updateOrder(parseInt(req.params.id), req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

async function getByStatus(req, res, next) {
  try {
    const status = req.params.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getOrdersByStatusList(status, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;
    const result = await getAllOrders(page, limit, status);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

module.exports = {
  create,
  getDetail,
  getUserList,
  adminGetAll,
  update,
  getByStatus,
};
