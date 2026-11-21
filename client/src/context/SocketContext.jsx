import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { initiateSocket, disconnectSocket, getSocket } from '../services/socket';
import { conversationsAPI } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [typingMap, setTypingMap] = useState({}); // { [convId]: [ { userId, username } ] }
  const activeConvRef = useRef(activeConversation);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Load conversations on mount or login
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await conversationsAPI.getConversations();
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
    }
  }, [token, loadConversations]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const s = initiateSocket(token);
    setSocket(s);

    if (!s) return;

    // Listen to online users list
    s.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    s.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    s.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Listen to typing events
    s.on('user_typing', ({ conversationId, userId, username }) => {
      setTypingMap((prev) => {
        const list = prev[conversationId] || [];
        if (list.some((u) => u.userId === userId)) return prev;
        return {
          ...prev,
          [conversationId]: [...list, { userId, username }]
        };
      });
    });

    s.on('user_stop_typing', ({ conversationId, userId }) => {
      setTypingMap((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.filter((u) => u.userId !== userId)
        };
      });
    });

    // Conversation update / re-ordering when new message arrives anywhere
    s.on('conversation_updated', ({ conversation, message }) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversation._id);
        let updatedList;
        if (exists) {
          updatedList = prev.map((c) => (c._id === conversation._id ? conversation : c));
        } else {
          updatedList = [conversation, ...prev];
        }

        // Keep active conversation reference in sync
        if (activeConvRef.current && activeConvRef.current._id === conversation._id) {
          setActiveConversation(conversation);
        }

        // Sort by updatedAt descending
        return updatedList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    // Mark as read receipt
    s.on('messages_read', ({ conversationId, userId: readerId }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            const counts = c.unreadCounts ? { ...c.unreadCounts } : {};
            counts[readerId] = 0;
            return { ...c, unreadCounts: counts };
          }
          return c;
        })
      );
    });

    // Unread cleared on current device
    s.on('unread_cleared', ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId && c.unreadCounts) {
            const counts = { ...c.unreadCounts };
            if (user?._id) counts[user._id] = 0;
            return { ...c, unreadCounts: counts };
          }
          return c;
        })
      );
    });

    return () => {
      s.off('online_users');
      s.off('user_online');
      s.off('user_offline');
      s.off('user_typing');
      s.off('user_stop_typing');
      s.off('conversation_updated');
      s.off('messages_read');
      s.off('unread_cleared');
    };
  }, [token, user]);

  // Join/leave conversation room when activeConversation changes
  useEffect(() => {
    const s = getSocket();
    if (!s || !activeConversation) return;

    s.emit('join_conversation', activeConversation._id);
    s.emit('mark_read', { conversationId: activeConversation._id });

    // Mark read locally in unread counts
    setConversations((prev) =>
      prev.map((c) => {
        if (c._id === activeConversation._id && c.unreadCounts && user?._id) {
          const counts = { ...c.unreadCounts };
          counts[user._id] = 0;
          return { ...c, unreadCounts: counts };
        }
        return c;
      })
    );

    return () => {
      s.emit('leave_conversation', activeConversation._id);
    };
  }, [activeConversation, user]);

  const selectConversation = (conv) => {
    setActiveConversation(conv);
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation: selectConversation,
        refreshConversations: loadConversations,
        typingMap
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
