const {
  getSalesMetrics,
  getOrderStatusCount,
  getTopProducts,
  getInventoryStats,
  getUserStats,
  getProductStats,
  getRecentOrders,
} = require('../repositories/dashboard.repository');

async function getDashboardMetrics() {
  const sales = await getSalesMetrics();
  const orderStatus = await getOrderStatusCount();
  const inventory = await getInventoryStats();
  const users = await getUserStats();
  const products = await getProductStats();

  return {
    sales,
    orderStatus,
    inventory,
    users,
    products,
  };
}

async function getDashboardOverview() {
  const metrics = await getDashboardMetrics();
  const topProducts = await getTopProducts(5);
  const recentOrders = await getRecentOrders(5);

  return {
    metrics,
    topProducts,
    recentOrders,
  };
}

async function getSalesReport() {
  const sales = await getSalesMetrics();
  const orderStatus = await getOrderStatusCount();
  const topProducts = await getTopProducts(10);

  return {
    sales,
    orderStatus,
    topProducts,
  };
}

async function getInventoryReport() {
  const stats = await getInventoryStats();
  const products = await getProductStats();

  return {
    inventory: stats,
    products,
  };
}

module.exports = {
  getDashboardMetrics,
  getDashboardOverview,
  getSalesReport,
  getInventoryReport,
};