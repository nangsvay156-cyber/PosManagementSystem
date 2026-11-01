const express = require('express');
const router = express.Router();

const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
} = require('../controllers/purchaseOrderController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { purchaseOrderSchema, receivePOSchema } = require('../validation/transactionValidators');

router.use(authenticate);
router.use(authorize('admin')); // purchasing is an admin function

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', validate(purchaseOrderSchema), createPurchaseOrder);
router.patch('/:id/status', updatePurchaseOrderStatus);
router.post('/:id/receive', validate(receivePOSchema), receivePurchaseOrder);

module.exports = router;