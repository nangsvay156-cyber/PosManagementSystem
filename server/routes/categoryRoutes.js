const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { categorySchema, categoryUpdateSchema } = require('../validation/commonValidators');

router.use(authenticate);

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authorize('admin'), validate(categorySchema), createCategory);
router.put('/:id', authorize('admin'), validate(categoryUpdateSchema), updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;