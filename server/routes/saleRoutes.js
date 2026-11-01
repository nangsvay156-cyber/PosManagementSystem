const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { createSaleSchema, createRefundSchema } = require('../validation/saleValidator');

router.use(authenticate);

router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.get('/:id/invoice', saleController.getSaleById);         // ✅ JSON for InvoicePrint page
router.get('/:id/invoice/pdf', saleController.downloadInvoice); // ✅ PDF stream
router.post('/', validate(createSaleSchema), saleController.createSale);
router.post('/:id/refund', authorize('admin'), validate(createRefundSchema), saleController.refundSale);

module.exports = router;