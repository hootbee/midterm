const express = require('express');
const router = express.Router();
const { getReportsForItem } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/reports/:auctionItemId
// @desc    Get all reports for an item (Admin only)
// @access  Admin
router.get('/:auctionItemId', authMiddleware, adminMiddleware, getReportsForItem);

module.exports = router;
