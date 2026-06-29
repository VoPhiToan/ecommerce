const express = require('express');
const router  = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate }    = require('../middleware/auth.middleware');
const { authorize }       = require('../middleware/rbac.middleware');

router.get('/metrics',   authenticate, authorize('dashboard:read'), dashboardController.metrics);
router.get('/overview',  authenticate, authorize('dashboard:read'), dashboardController.overview);
router.get('/sales',     authenticate, authorize('dashboard:read'), dashboardController.salesReport);
router.get('/inventory', authenticate, authorize('dashboard:read'), dashboardController.inventoryReport);
router.get('/',          authenticate, authorize('dashboard:read'), dashboardController.overview);

module.exports = router;