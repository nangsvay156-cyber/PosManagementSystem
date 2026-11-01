const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/purchase-orders', require('./purchaseOrderRoutes'));
router.use('/sales', require('./saleRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;