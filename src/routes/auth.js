const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth');
const { protect } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', protect, auth.logout);
router.post('/forgot-password', auth.forgotPassword);
router.put('/reset-password/:token', auth.resetPassword);
router.get('/me', protect, auth.getMe);

module.exports = router;
