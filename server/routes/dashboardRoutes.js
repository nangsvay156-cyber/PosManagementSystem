const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

router.use(authenticate); // both roles can view the dashboard

router.get('/summary', dashboardController.getSummary);

module.exports = router;