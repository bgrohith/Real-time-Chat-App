const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Get messages for a conversation with pagination
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify requesting user is a member
    const isMember = conversation.members.some(
      m => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages in this conversation' });
    }

    const totalMessages = await Message.countDocuments({ conversation: conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    // Fetch messages sorted newest first for pagination, then reversed for display
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username email avatar')
      .populate('readBy', 'username');

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page,
      totalPages,
      totalMessages,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

// @desc    Send a message via REST
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, image } = req.body;
    const senderId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    if (!text && !image && !req.file) {
      return res.status(400).json({ success: false, message: 'Message must contain text or an image' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify sender is in conversation
    const isMember = conversation.members.some(
      m => m.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this conversation' });
    }

    let imageUrl = image || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: text || '',
      image: imageUrl,
      readBy: [senderId]
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username email avatar');

    // Update conversation lastMessage and increment unread count for other members
    conversation.lastMessage = newMessage._id;
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    conversation.members.forEach(memberId => {
      const idStr = memberId.toString();
      if (idStr !== senderId.toString()) {
        const currentCount = conversation.unreadCounts.get(idStr) || 0;
        conversation.unreadCounts.set(idStr, currentCount + 1);
      }
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

module.exports = {
  getMessages,
  sendMessage
};
