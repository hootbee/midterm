/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - student_id
 *         - uuid
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *         uuid:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         name:
 *           type: string
 *           description: User's full name
 *         student_id:
 *           type: string
 *           description: User's student ID (unique)
 *         reputation_score:
 *           type: integer
 *           description: User's reputation score
 *           default: 0
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was created
 *         admin:
 *           type: boolean
 *           description: True if the user is an administrator
 *           default: false
 *         balance:
 *           type: integer
 *           description: User's current balance
 *           default: 0
 *     NewUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - studentId
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         studentId:
 *           type: string
 *           description: User's student ID
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const express = require('express');
const router = express.Router();
const { signup, login, searchUserByUuid, getMe, deleteUser, deleteMyAccount, updateMyPassword, updateUserProfile, deleteUserProfile, updateUserReputation, updateUserAdminStatus, updateUserBalance, getAllUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 totalUsers:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewUser'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authenticate user and get a JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/users/search/{uuid}:
 *   get:
 *     summary: Search for a user by UUID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to search
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/search/:uuid', authMiddleware, adminMiddleware, searchUserByUuid);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', authMiddleware, getMe);
router.delete('/me', authMiddleware, deleteMyAccount);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Update current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input or incorrect password
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/password', authMiddleware, updateMyPassword);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               studentId:
 *                 type: string
 *             example:
 *               name: "New Name"
 *               email: "new@example.com"
 *               studentId: "12345678"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or duplicate email/student ID
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       500:
 *         description: Server error
 */
router.put('/profile', authMiddleware, updateUserProfile);

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     summary: Delete the current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/profile', authMiddleware, deleteUserProfile);

/**
 * @swagger
 * /api/users/{uuid}:
 *   delete:
 *     summary: Delete a user by UUID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *         description: Forbidden, not an admin user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:uuid', authMiddleware, adminMiddleware, deleteUser);

/**
 * @swagger
 * /api/users/{uuid}/admin:
 *   put:
 *     summary: Update a user's admin status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAdmin
 *             properties:
 *               isAdmin:
 *                 type: boolean
 *                 description: Desired admin status
 *             example:
 *               isAdmin: true
 *     responses:
 *       200:
 *         description: Admin status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:uuid/admin', authMiddleware, adminMiddleware, updateUserAdminStatus);

/**
 * @swagger
 * /api/users/{uuid}/reputation:
 *   put:
 *     summary: Update a user's reputation score (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reputationScore
 *             properties:
 *               reputationScore:
 *                 type: integer
 *                 description: New reputation score
 *             example:
 *               reputationScore: 100
 *     responses:
 *       200:
 *         description: Reputation score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       403:
 *         description: Forbidden, not an admin user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:uuid/reputation', authMiddleware, adminMiddleware, updateUserReputation);

/**
 * @swagger
 * /api/users/balance:
 *   put:
 *     summary: Update user balance
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to add to the user's balance
 *             example:
 *               amount: 5000
 *     responses:
 *       200:
 *         description: Balance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newBalance:
 *                   type: integer
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/balance', authMiddleware, updateUserBalance);

module.exports = router;
