const express = require('express');
const router = express.Router();
const { signup, login, searchUserByUuid ,getMe, deleteUser} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/signup', signup);
router.post('/login', login);

// @route   GET /api/users/search/:uuid
// @desc    Search for a user by UUID (Admin only)
// @access  Admin
router.get('/search/:uuid', authMiddleware, adminMiddleware, searchUserByUuid);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, getMe);

// @route   DELETE /api/users/:uuid
// @desc    Delete a user by UUID (Admin only)
// @access  Admin
router.delete('/:uuid', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
