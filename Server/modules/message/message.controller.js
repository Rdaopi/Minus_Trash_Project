import Message from './message.model.js';
import User from '../auth/models/User.js';
import { createError } from '../../core/error-handling.js';

/**
 * Send a message to multiple recipients
 */
export async function sendMessage(req, res, next) {
  try {
    const { content, recipients } = req.body;
    const senderId = req.user.id;

    // Validate input
    if (!content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw createError(400, 'Invalid message data');
    }

    // Check if all recipients exist
    const users = await User.find({ _id: { $in: recipients } });
    if (users.length !== recipients.length) {
      throw createError(400, 'One or more recipients do not exist');
    }

    // Create and save the message
    const message = new Message({
      content,
      sender: senderId,
      recipients,
      readBy: [] // Initialize empty readBy array
    });

    await message.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all messages for the current user
 */
export async function getMessages(req, res, next) {
  try {
    const userId = req.user.id;

    // Find all messages where the user is a recipient
    const messages = await Message.find({ recipients: userId })
      .populate('sender', 'email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific message by ID
 */
export async function getMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      recipients: userId
    }).populate('sender', 'email');

    if (!message) {
      throw createError(404, 'Message not found');
    }

    // Mark message as read if not already read by this user
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    });

    if (!message) {
      throw createError(404, 'Message not found');
    }

    await message.deleteOne();

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a message as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      recipients: userId
    });

    if (!message) {
      throw createError(404, 'Message not found');
    }

    // Add user to readBy if not already there
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json({
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread message count for current user
 */
export async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      recipients: userId,
      readBy: { $ne: userId }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
} 