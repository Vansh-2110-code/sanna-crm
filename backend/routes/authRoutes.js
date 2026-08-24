const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
