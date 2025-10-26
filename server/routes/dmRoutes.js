const express = require('express');
const router = express.Router();
const { getOrCreateDMRoom, getDMRooms, getDMMessages, leaveDMRoom, sendDMMessage, deleteDMRoom, deleteMessage } = require('../controllers/dmController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Direct Messages
 *   description: API for managing direct messages and rooms
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DMRoom:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the DM room
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: UUIDs of the participants in the DM room
 *         lastMessage:
 *           type: string
 *           description: ID of the last message in the room
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the DM room was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the DM room was last updated
 *     DMMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the DM message
 *         roomId:
 *           type: string
 *           description: ID of the DM room the message belongs to
 *         senderUuid:
 *           type: string
 *           description: UUID of the sender
 *         receiverUuid:
 *           type: string
 *           description: UUID of the receiver
 *         content:
 *           type: string
 *           description: The message content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the message was sent
 */

/**
 * @swagger
 * /api/dm/room:
 *   post:
 *     summary: Get or create a DM room with another user
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserUuid
 *             properties:
 *               targetUserUuid:
 *                 type: string
 *                 description: UUID of the other user to chat with
 *     responses:
 *       200:
 *         description: Successfully retrieved or created DM room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DMRoom'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/room', authMiddleware, getOrCreateDMRoom);

/**
 * @swagger
 * /api/dm/rooms:
 *   get:
 *     summary: Get all DM rooms for the authenticated user
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of DM rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DMRoom'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/rooms', authMiddleware, getDMRooms);

/**
 * @swagger
 * /api/dm/room/{roomId}/messages:
 *   get:
 *     summary: Get messages for a specific DM room
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the DM room
 *     responses:
 *       200:
 *         description: A list of DM messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DMMessage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: DM room not found
 *       500:
 *         description: Server error
 */
router.get('/room/:roomId/messages', authMiddleware, getDMMessages);

/**
 * @swagger
 * /api/dm/room/{roomId}/messages:
 *   post:
 *     summary: Send a new DM message
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the DM room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message text
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to send messages in this room
 *       404:
 *         description: DM room not found
 *       500:
 *         description: Server error
 */
router.post('/room/:roomId/messages', authMiddleware, sendDMMessage);

/**
 * @swagger
 * /api/dm/room/{roomId}/leave:
 *   delete:
 *     summary: Leave a DM room
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the DM room to leave
 *     responses:
 *       200:
 *         description: Successfully left DM room
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to leave this DM room
 *       404:
 *         description: DM room not found
 *       500:
 *         description: Server error
 */
router.delete('/room/:roomId/leave', authMiddleware, leaveDMRoom);

/**
 * @swagger
 * /api/dm/room/{roomId}:
 *   delete:
 *     summary: Permanently delete a DM room and its messages
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the DM room to delete
 *     responses:
 *       200:
 *         description: DM room deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this DM room
 *       404:
 *         description: DM room not found
 *       500:
 *         description: Server error
 */
router.delete('/room/:roomId', authMiddleware, deleteDMRoom);

/**
 * @swagger
 * /api/dm/messages/{messageId}:
 *   delete:
 *     summary: Delete a specific DM (for the receiver only)
 *     tags: [Direct Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to delete
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this message (not the receiver)
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

module.exports = router;
