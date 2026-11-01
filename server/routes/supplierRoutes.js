const express = require('express');
const router = express.Router();

const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { supplierSchema, supplierUpdateSchema } = require('../validation/commonValidators');

router.use(authenticate);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authorize('admin'), validate(supplierSchema), createSupplier);
router.put('/:id', authorize('admin'), validate(supplierUpdateSchema), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;