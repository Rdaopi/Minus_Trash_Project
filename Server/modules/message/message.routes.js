import express from 'express';
import { jwtAuth } from '../auth/middlewares/jwtAuth.js';
import { sendMessage, getMessages, getMessage, deleteMessage, markAsRead, getUnreadCount } from './message.controller.js';

const router = express.Router();

// Get all messages for the current user
router.get('/', jwtAuth, getMessages);

// Get unread message count
router.get('/unread/count', jwtAuth, getUnreadCount);

// Get a specific message
router.get('/:messageId', jwtAuth, getMessage);

// Send a message (admin check is in controller)
router.post('/send', jwtAuth, sendMessage);

// Mark a message as read
router.post('/:messageId/read', jwtAuth, markAsRead);

// Delete a message
router.delete('/:messageId', jwtAuth, deleteMessage);

export default router; 