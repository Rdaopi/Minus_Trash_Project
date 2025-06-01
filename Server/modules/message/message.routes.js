import express from 'express';
import { jwtAuth } from '../auth/middlewares/jwtAuth.js';
import { sendMessage, getMessages, getMessage, deleteMessage, markAsRead, getUnreadCount } from './message.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all messages for the current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   sender:
 *                     type: string
 *                   recipient:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   isRead:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', jwtAuth, getMessages);

/**
 * @swagger
 * /api/messages/unread/count:
 *   get:
 *     summary: Get count of unread messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of unread messages
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/unread/count', jwtAuth, getUnreadCount);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   get:
 *     summary: Get a specific message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to retrieve
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 sender:
 *                   type: string
 *                 recipient:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 isRead:
 *                   type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.get('/:messageId', jwtAuth, getMessage);

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - recipientId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content of the message
 *               recipientId:
 *                 type: string
 *                 description: ID of the recipient user
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 sender:
 *                   type: string
 *                 recipient:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Internal server error
 */
router.post('/send', jwtAuth, sendMessage);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   post:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.post('/:messageId/read', jwtAuth, markAsRead);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a specific message
 *     tags: [Messages]
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
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:messageId', jwtAuth, deleteMessage);

export default router; 