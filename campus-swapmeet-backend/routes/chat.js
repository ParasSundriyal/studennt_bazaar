const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'name collegeId collegeName')
    .populate('productId', 'title images price')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
});

// Get or create conversation between two users for a specific product
router.post('/conversations', auth, async (req, res) => {
  try {
    const { otherUserId, productId } = req.body;

    if (!otherUserId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Other user ID and product ID are required'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId] },
      productId: productId,
      isActive: true
    }).populate('participants', 'name collegeId collegeName')
      .populate('productId', 'title images price');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user.id, otherUserId],
        productId: productId
      });
      await conversation.save();
      
      // Populate the conversation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name collegeId collegeName')
        .populate('productId', 'title images price');
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating/finding conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({
      conversationId: conversationId,
      isDeleted: false
    })
    .populate('sender', 'name collegeId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read if they're from other user
    await Message.updateMany(
      {
        conversationId: conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({
          conversationId: conversationId,
          isDeleted: false
        })
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', attachments = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create new message
    const message = new Message({
      conversationId: conversationId,
      sender: req.user.id,
      content: content.trim(),
      messageType,
      attachments
    });

    await message.save();

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageTime: new Date()
    });

    // Populate sender info
    await message.populate('sender', 'name collegeId');

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

// Mark conversation as read
router.put('/conversations/:conversationId/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId: conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
});

// Get unread message count for a user
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      conversationId: {
        $in: await Conversation.find({
          participants: req.user.id,
          isActive: true
        }).distinct('_id')
      },
      sender: { $ne: req.user.id },
      isRead: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
});

module.exports = router; 