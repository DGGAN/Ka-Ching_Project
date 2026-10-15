const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define routes for register and login (POST requests)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;