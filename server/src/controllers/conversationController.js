const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for current user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({ members: currentUserId })
      .populate('members', 'username email avatar statusMessage')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      })
      .populate('groupAdmin', 'username email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching conversations' });
  }
};

// @desc    Find or create 1-on-1 direct conversation
// @route   POST /api/conversations/direct
// @access  Private
const getOrCreateDirectConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    // Check if 1-to-1 conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [currentUserId, recipientId], $size: 2 }
    })
      .populate('members', 'username email avatar statusMessage')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });

    if (conversation) {
      return res.status(200).json({
        success: true,
        conversation,
        isNew: false
      });
    }

    // Create new direct conversation
    const newConv = await Conversation.create({
      isGroup: false,
      members: [currentUserId, recipientId],
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [recipientId.toString()]: 0
      }
    });

    const populatedConv = await Conversation.findById(newConv._id)
      .populate('members', 'username email avatar statusMessage');

    res.status(201).json({
      success: true,
      conversation: populatedConv,
      isNew: true
    });
  } catch (error) {
    console.error('Error in getOrCreateDirectConversation:', error);
    res.status(500).json({ success: false, message: 'Server error creating or finding conversation' });
  }
};

// @desc    Create a new group conversation
// @route   POST /api/conversations/group
// @access  Private
const createGroupConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const currentUserId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ success: false, message: 'A group requires at least one other member' });
    }

    // Combine current user with other members and remove duplicates
    const allMemberIds = Array.from(new Set([currentUserId.toString(), ...memberIds]));

    const unreadCounts = {};
    allMemberIds.forEach(id => {
      unreadCounts[id] = 0;
    });

    const groupConv = await Conversation.create({
      isGroup: true,
      name: name.trim(),
      groupAdmin: currentUserId,
      members: allMemberIds,
      unreadCounts
    });

    const populatedGroup = await Conversation.findById(groupConv._id)
      .populate('members', 'username email avatar statusMessage')
      .populate('groupAdmin', 'username email avatar');

    res.status(201).json({
      success: true,
      conversation: populatedGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: 'Server error creating group' });
  }
};

// @desc    Add member to group conversation
// @route   POST /api/conversations/:id/members
// @access  Private
const addGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ success: false, message: 'Cannot add members to a direct 1-to-1 conversation' });
    }

    // Only admin can add members (as specified in Module 5: "admin can add members")
    if (conversation.groupAdmin.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Only group admin can add members' });
    }

    if (conversation.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this group' });
    }

    conversation.members.push(userId);
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    conversation.unreadCounts.set(userId, 0);

    await conversation.save();

    const updatedConv = await Conversation.findById(id)
      .populate('members', 'username email avatar statusMessage')
      .populate('groupAdmin', 'username email avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });

    res.status(200).json({
      success: true,
      conversation: updatedConv
    });
  } catch (error) {
    console.error('Error adding member to group:', error);
    res.status(500).json({ success: false, message: 'Server error adding member' });
  }
};

// @desc    Mark conversation messages as read
// @route   PUT /api/conversations/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Reset unread count for current user
    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(currentUserId.toString(), 0);
      await conversation.save();
    }

    // Mark messages as readBy current user
    await Message.updateMany(
      {
        conversation: id,
        readBy: { $ne: currentUserId }
      },
      {
        $addToSet: { readBy: currentUserId }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, message: 'Server error marking conversation as read' });
  }
};

module.exports = {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  addGroupMember,
  markAsRead
};
