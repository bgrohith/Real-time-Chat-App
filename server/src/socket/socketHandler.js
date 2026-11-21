const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Map of userId -> Set of socketIds
const onlineUsers = new Map();

const initSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sapphire_jwt_secret');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.username} [${userId}])`);

    // Add user to onlineUsers map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's individual room for direct notifications
    socket.join(`user:${userId}`);

    // Broadcast updated online users list
    const currentOnlineUserIds = Array.from(onlineUsers.keys());
    io.emit('online_users', currentOnlineUserIds);
    socket.broadcast.emit('user_online', { userId, username: socket.user.username });

    // 1. Join Conversation Room
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      const room = `conv:${conversationId}`;
      socket.join(room);
      console.log(`User ${socket.user.username} joined room ${room}`);
    });

    // 2. Leave Conversation Room
    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      const room = `conv:${conversationId}`;
      socket.leave(room);
      console.log(`User ${socket.user.username} left room ${room}`);
    });

    // 3. Live Message Sending via Socket
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, image } = data;
        if (!conversationId || (!text && !image)) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Check user membership
        const isMember = conversation.members.some(
          m => m.toString() === userId
        );
        if (!isMember) return;

        const newMessage = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text || '',
          image: image || null,
          readBy: [userId]
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username email avatar');

        // Update conversation last message & unread counts
        conversation.lastMessage = newMessage._id;
        if (!conversation.unreadCounts) {
          conversation.unreadCounts = new Map();
        }

        conversation.members.forEach((mId) => {
          const mIdStr = mId.toString();
          if (mIdStr !== userId) {
            const current = conversation.unreadCounts.get(mIdStr) || 0;
            conversation.unreadCounts.set(mIdStr, current + 1);
          }
        });

        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
          .populate('members', 'username email avatar statusMessage')
          .populate({
            path: 'lastMessage',
            populate: {
              path: 'sender',
              select: 'username avatar'
            }
          })
          .populate('groupAdmin', 'username email avatar');

        // Broadcast to the conversation room
        io.to(`conv:${conversationId}`).emit('new_message', populatedMessage);

        // Notify each conversation member's personal room about the updated conversation
        conversation.members.forEach((mId) => {
          io.to(`user:${mId.toString()}`).emit('conversation_updated', {
            conversation: populatedConversation,
            message: populatedMessage
          });
        });
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 4. Typing Events
    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username: socket.user.username
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      });
    });

    // 5. Read State / Mark as Read Event
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        if (conversation.unreadCounts) {
          conversation.unreadCounts.set(userId, 0);
          await conversation.save();
        }

        await Message.updateMany(
          {
            conversation: conversationId,
            readBy: { $ne: userId }
          },
          {
            $addToSet: { readBy: userId }
          }
        );

        // Notify room members that messages were read
        io.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          userId
        });

        // Also notify user's other devices
        io.to(`user:${userId}`).emit('unread_cleared', {
          conversationId
        });
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.user.username})`);
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId, username: socket.user.username });
          io.emit('online_users', Array.from(onlineUsers.keys()));
        }
      }
    });
  });
};

module.exports = { initSocket };
