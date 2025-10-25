const express = require('express');
const router = express.Router();
const { toggleFavorite, getFavorites, getFavoriteStatus, importFavorites, removeFavorite, clearFavorites } = require('../controllers/favoriteAuctionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Favorite Auctions
 *   description: API for managing user's favorite auction items
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FavoriteAuction:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the favorite entry
 *         userUuid:
 *           type: string
 *           description: UUID of the user who favorited the item
 *         auctionItemId:
 *           type: string
 *           description: ID of the auction item that was favorited
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the item was favorited
 */

/**
 * @swagger
 * /api/favorites/toggle:
 *   post:
 *     summary: Add or remove an auction item from favorites
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auctionItemId
 *             properties:
 *               auctionItemId:
 *                 type: string
 *                 description: ID of the auction item to favorite/unfavorite
 *     responses:
 *       200:
 *         description: Favorite status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorited:
 *                   type: boolean
 *                 favorite:
 *                   $ref: '#/components/schemas/FavoriteAuction'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/toggle', authMiddleware, toggleFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorite auction items for the authenticated user
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of favorite auction items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FavoriteAuction'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove all favorite auction items for the authenticated user
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites cleared successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, getFavorites);
router.delete('/', authMiddleware, clearFavorites);

/**
 * @swagger
 * /api/favorites/import:
 *   post:
 *     summary: Import multiple favorite auction items
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auctionItemIds
 *             properties:
 *               auctionItemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of auction items to add to favorites
 *     responses:
 *       201:
 *         description: Favorites imported successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/import', authMiddleware, importFavorites);

/**
 * @swagger
 * /api/favorites/{auctionItemId}:
 *   delete:
 *     summary: Remove a specific auction item from favorites
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to remove from favorites
 *     responses:
 *       200:
 *         description: Auction item removed from favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 *       500:
 *         description: Server error
 *
 * /api/favorites/status/{auctionItemId}:
 *   get:
 *     summary: Check if an auction item is favorited by the authenticated user
 *     tags: [Favorite Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auction item to check status for
 *     responses:
 *       200:
 *         description: Favorite status of the item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction item not found
 *       500:
 *         description: Server error
 */
router.delete('/:auctionItemId', authMiddleware, removeFavorite);
router.get('/status/:auctionItemId', authMiddleware, getFavoriteStatus);

module.exports = router;
