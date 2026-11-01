const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateUserSchema,
} = require('../validation/authValidators');

// ---------- Public ----------
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

// ---------- Authenticated (any logged-in user) ----------
router.get('/me', authenticate, authController.getMe);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

// ---------- Admin-only: creating new staff accounts ----------
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  validate(registerSchema),
  authController.register
);

// ---------- Admin-only: staff/user management ----------
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.get('/users/:id', authenticate, authorize('admin'), authController.getUserById);
router.put(
  '/users/:id',
  authenticate,
  authorize('admin'),
  validate(updateUserSchema),
  authController.updateUser
);

module.exports = router;