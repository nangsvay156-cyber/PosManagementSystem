const express = require('express');
const router = express.Router();

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSales,
} = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { customerSchema, customerUpdateSchema } = require('../validation/commonValidators');

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/sales', getCustomerSales);
router.post('/', validate(customerSchema), createCustomer); // cashiers can add customers at checkout
router.put('/:id', validate(customerUpdateSchema), updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;