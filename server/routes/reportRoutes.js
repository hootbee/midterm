const express = require('express');
const router = express.Router();
const { getReportsForItem, deleteAllReportsForAuctionItem } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/reports/:auctionItemId
// @desc    Get all reports for an item (Admin only)
// @access  Admin
router.get('/:auctionItemId', authMiddleware, adminMiddleware, getReportsForItem);

// @route   DELETE /api/reports/:auctionItemId
// @desc    Delete all reports for a specific auction item (Admin only)
// @access  Admin
router.delete('/:auctionItemId', authMiddleware, adminMiddleware, deleteAllReportsForAuctionItem);

module.exports = router;
