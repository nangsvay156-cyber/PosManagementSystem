const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { productSchema, productUpdateSchema } = require('../validation/productValidators');

router.use(authenticate);

router.get('/', getProducts);
router.get('/barcode/:code', getProductByBarcode);
router.get('/:id', getProductById);

router.post('/', authorize('admin'), upload.single('image'), validate(productSchema), createProduct);
router.put('/:id', authorize('admin'), upload.single('image'), validate(productUpdateSchema), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

router.patch('/:id/stock', authorize('admin'), adjustStock);

module.exports = router;