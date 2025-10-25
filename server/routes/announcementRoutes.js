const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, getBannerAnnouncement, updateAnnouncement, deleteAnnouncement, toggleBannerStatus } = require('../controllers/announcementController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: API for managing announcements
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the announcement
 *         title:
 *           type: string
 *           description: Title of the announcement
 *         content:
 *           type: string
 *           description: Content of the announcement
 *         isBanner:
 *           type: boolean
 *           description: Whether the announcement is displayed as a banner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the announcement was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the announcement was last updated
 *     NewAnnouncement:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the announcement
 *         content:
 *           type: string
 *           description: Content of the announcement
 *     UpdateAnnouncement:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Updated title of the announcement
 *         content:
 *           type: string
 *           description: Updated content of the announcement
 *         isBanner:
 *           type: boolean
 *           description: Whether the announcement should be displayed as a banner
 */

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create a new announcement (Admin only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewAnnouncement'
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: A list of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, adminMiddleware, createAnnouncement);
router.get('/', getAnnouncements);

/**
 * @swagger
 * /api/announcements/banner:
 *   get:
 *     summary: Get the announcement currently set as banner
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: The banner announcement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: No banner announcement found
 *       500:
 *         description: Server error
 */
router.get('/banner', getBannerAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     summary: Update an announcement (Admin only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the announcement to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAnnouncement'
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete an announcement (Admin only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the announcement to delete
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, adminMiddleware, updateAnnouncement);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}/toggle-banner:
 *   put:
 *     summary: Toggle banner status of an announcement (Admin only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the announcement to toggle banner status
 *     responses:
 *       200:
 *         description: Banner status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 */
router.put('/:id/toggle-banner', authMiddleware, adminMiddleware, toggleBannerStatus);

module.exports = router;
