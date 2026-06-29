const {
  getDashboardMetrics,
  getDashboardOverview,
  getSalesReport,
  getInventoryReport,
} = require('../services/dashboard.service');

async function metrics(req, res, next) {
  try {
    const data = await getDashboardMetrics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function overview(req, res, next) {
  try {
    const data = await getDashboardOverview();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function salesReport(req, res, next) {
  try {
    const data = await getSalesReport();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function inventoryReport(req, res, next) {
  try {
    const data = await getInventoryReport();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  metrics,
  overview,
  salesReport,
  inventoryReport,
};
