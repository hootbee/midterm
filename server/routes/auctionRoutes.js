/**
 * @swagger
 * tags:
 *   name: Auctions
 *   description: Auction item management and bidding
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuctionItem:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - imagePath
 *         - filePath
 *         - startPrice
 *         - endTime
 *         - sellerEmail
 *         - sellerUuid
 *         - sellerReputationScore
 *         - currentPrice
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the auction item
 *         title:
 *           type: string
 *           description: Title of the auction item
 *         content:
 *           type: string
 *           description: Description of the auction item
 *         imagePath:
 *           type: string
 *           description: Path to the thumbnail image of the item
 *         filePath:
 *           type: string
 *           description: Path to the protected file of the item (downloadable by winner)
 *         startPrice:
 *           type: number
 *           description: Starting price of the auction
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: The time when the auction ends
 *         sellerEmail:
 *           type: string
 *           format: email
 *           description: Email of the seller
 *         sellerUuid:
 *           type: string
 *           format: uuid
 *           description: UUID of the seller
 *         sellerReputationScore:
 *           type: number
 *           description: Reputation score of the seller at the time of creation
 *         currentPrice:
 *           type: number
 *           description: Current highest bid price
 *         highestBidderUuid:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the current highest bidder
 *         reportCount:
 *           type: integer
 *           description: Number of times the item has been reported
 *           default: 0
 *         bids:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               bidderUuid:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *           description: Array of bid history
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the auction item was created
 *     NewAuctionItem: # For POST /api/auctions
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - startPrice
 *         - endTime
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the auction item
 *         content:
 *           type: string
 *           description: Description of the auction item
 *         startPrice:
 *           type: number
 *           description: Starting price of the auction
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: The time when the auction ends (e.g., 2025-10-27T10:00:00Z)
 *         photo:
 *           type: string
 *           format: binary
 *           description: Thumbnail image file
 *         itemFile:
 *           type: string
 *           format: binary
 *           description: Protected item file (e.g., PDF, ZIP)
 *     UpdateAuctionItem: # For PUT /api/auctions/{id}
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: New title of the auction item
 *         content:
 *           type: string
 *           description: New description of the auction item
 *         startPrice:
 *           type: number
 *           description: New starting price of the auction
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: New end time of the auction
 *     ReportAuctionItem: # For POST /api/auctions/{id}/report
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for reporting the auction item
 */

const express = require('express');
const router = express.Router();
const { createAuctionItem, getAuctionItems, getAuctionItemById, downloadItemFile, deleteAuctionItem, updateAuctionItem, reportAuctionItem, getReportedItems, resetReportsForItem, getBidAuctions, getSellingAuctions, markPaid, markCompleted, cancelAuction, hideAuctionsForBidder } = require('../controllers/auctionController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.put('/hide-for-user', authMiddleware, hideAuctionsForBidder);

/**
 * @swagger
 * /api/auctions:
 *   get:
 *     summary: Get all auction items
 *     tags: [Auctions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, content, or sellerUuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [title, content, sellerUuid]
 *         description: Type of search to perform
 *     responses:
 *       200:
 *         description: A list of auction items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuctionItem'
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new auction item
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/NewAuctionItem'
 *     responses:
 *       201:
 *         description: Auction item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: Invalid input or missing files
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       500:
 *         description: Server error
 */
router.get('/', getAuctionItems);
router.post('/', authMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'itemFile', maxCount: 1 }]), createAuctionItem);

/**
 * @swagger
 * /api/auctions/reported:
 *   get:
 *     summary: Get all reported auction items (Admin only)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of reported auction items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuctionItem'
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       500:
 *         description: Server error
 */
router.get('/reported', authMiddleware, adminMiddleware, getReportedItems);

/**
 * @swagger
 * /api/auctions/{id}:
 *   get:
 *     summary: Get a single auction item by ID
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to retrieve
 *     responses:
 *       200:
 *         description: A single auction item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update an auction item
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAuctionItem'
 *     responses:
 *       200:
 *         description: Auction item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, user not authorized to update this item
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete an auction item
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to delete
 *     responses:
 *       200:
 *         description: Auction item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, user not authorized to delete this item
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getAuctionItemById);
router.put('/:id', authMiddleware, updateAuctionItem);
router.delete('/:id', authMiddleware, deleteAuctionItem);

/**
 * @swagger
 * /api/auctions/{id}/download:
 *   get:
 *     summary: Download an item file after winning
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, auction not ended or user not the winner
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.get('/:id/download', authMiddleware, downloadItemFile);

/**
 * @swagger
 * /api/auctions/{id}/report:
 *   post:
 *     summary: Report an auction item
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportAuctionItem'
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Invalid input or item already reported by user
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.post('/:id/report', authMiddleware, reportAuctionItem);

/**
 * @swagger
 * /api/auctions/{id}/reset-reports:
 *   put:
 *     summary: Reset all reports for an auction item (Admin only)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to reset reports for
 *     responses:
 *       200:
 *         description: Reports reset successfully
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.put('/:id/reset-reports', authMiddleware, adminMiddleware, resetReportsForItem);

/**
 * @swagger
 * /api/auctions/bids/me:
 *   get:
 *     summary: Get all auction items the current user has bid on
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of auction items the user has bid on
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuctionItem'
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       500:
 *         description: Server error
 */
router.get('/bids/me', authMiddleware, getBidAuctions);

/**
 * @swagger
 * /api/auctions/selling/me:
 *   get:
 *     summary: Get all auction items the current user is selling
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of auction items the user is selling
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuctionItem'
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       500:
 *         description: Server error
 */
router.get('/selling/me', authMiddleware, getSellingAuctions);

/**
 * @swagger
 * /api/auctions/{id}/mark-paid:
 *   put:
 *     summary: Mark an auction item as paid (Winner or Admin)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to mark as paid
 *     responses:
 *       200:
 *         description: Auction item marked as paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: Invalid status or already paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not the winner or admin
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.put('/:id/mark-paid', authMiddleware, markPaid);


/**
 * @swagger
 * /api/auctions/{id}/mark-completed:
 *   put:
 *     summary: Mark an auction item as completed (Winner or Admin)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to mark as completed
 *     responses:
 *       200:
 *         description: Auction item marked as completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: Invalid status or not yet delivered
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not the winner or admin
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.put('/:id/mark-completed', authMiddleware, markCompleted);

/**
 * @swagger
 * /api/auctions/{id}/cancel:
 *   post:
 *     summary: Cancel an active auction (Seller or Admin)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to cancel
 *     responses:
 *       200:
 *         description: Auction item cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: Invalid status (only active auctions can be cancelled)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not the seller or admin
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.post('/:id/cancel', authMiddleware, cancelAuction);

module.exports = router;
