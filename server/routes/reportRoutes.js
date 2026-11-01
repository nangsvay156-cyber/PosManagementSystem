const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
router.use(authenticate);
router.use(authorize('admin')); // reports expose financials — admin only

router.get('/sales', reportController.getSalesReport);
router.get('/top-products', reportController.getTopProducts);
router.get('/low-stock', reportController.getLowStockReport);
router.get('/profit', reportController.getProfitReport);

module.exports = router;