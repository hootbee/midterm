const express = require('express');
const router = express.Router();
const { signup, login, searchUserByUuid ,getMe, deleteUser, updateUserProfile, updateUserReputation, updateUserBalance, getAllUsers} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Admin
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

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

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, updateUserProfile);

// @route   PUT /api/users/:uuid/reputation
// @desc    Update a user's reputation score (Admin only)
// @access  Admin
router.put('/:uuid/reputation', authMiddleware, adminMiddleware, updateUserReputation);

// @route   PUT /api/users/balance
// @desc    Update user balance
// @access  Private
router.put('/balance', authMiddleware, updateUserBalance);

module.exports = router;
