const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require Authorization: Bearer <token>)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
