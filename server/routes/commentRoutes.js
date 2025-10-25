const express = require('express');
const router = express.Router();
const { createComment, getComments, updateComment, deleteComment, deleteCommentsForAuction } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management for auction items
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *         auctionItemId:
 *           type: string
 *           description: ID of the auction item the comment belongs to
 *         commenterUuid:
 *           type: string
 *           description: UUID of the user who posted the comment
 *         content:
 *           type: string
 *           description: The comment text
 *         nickname:
 *           type: string
 *           description: Display name of the commenter (e.g., '판매자', '익명1')
 *         commentOrder:
 *           type: integer
 *           nullable: true
 *           description: Sequential number for anonymous comments on a post
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the comment was last updated
 *     NewComment:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: The comment text
 *     UpdateComment:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: The updated comment text
 */

/**
 * @swagger
 * /api/auctions/{auctionItemId}/comments:
 *   post:
 *     summary: Create a new comment for an auction item
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewComment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all comments for an auction item
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to retrieve comments for
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete all comments for an auction item (Seller or Admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comments deleted successfully
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not the seller or admin
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.post('/auctions/:auctionItemId/comments', authMiddleware, createComment);
router.get('/auctions/:auctionItemId/comments', getComments);
router.delete('/auctions/:auctionItemId/comments', authMiddleware, deleteCommentsForAuction);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateComment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not authorized to update this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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
 *         description: Forbidden, not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/comments/:commentId', authMiddleware, updateComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
