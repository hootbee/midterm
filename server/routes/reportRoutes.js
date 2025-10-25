const express = require('express');
const router = express.Router();
const { getReportsForItem, deleteAllReportsForAuctionItem, createReportForItem } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * /api/reports/{auctionItemId}:
 *   get:
 *     summary: Get all reports for an auction item (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not an admin
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a report for an auction item
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Invalid input or already reported
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.get('/:auctionItemId', authMiddleware, adminMiddleware, getReportsForItem);
router.post('/:auctionItemId', authMiddleware, createReportForItem);

// @route   DELETE /api/reports/:auctionItemId
// @desc    Delete all reports for a specific auction item (Admin only)
// @access  Admin
router.delete('/:auctionItemId', authMiddleware, adminMiddleware, deleteAllReportsForAuctionItem);

module.exports = router;
