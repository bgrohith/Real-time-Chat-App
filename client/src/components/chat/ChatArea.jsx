import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../services/api';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupInfoModal from './GroupInfoModal';
import ImagePreviewModal from './ImagePreviewModal';
import { MessageSquare, Shield, Zap, Sparkles } from 'lucide-react';

const ChatArea = () => {
  const { user } = useAuth();
  const { activeConversation, socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const conversationId = activeConversation?._id;

  // Fetch initial messages when active conversation changes
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setPage(1);
      const res = await messagesAPI.getMessages(convId, 1, 30);
      if (res.data.success) {
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  // Load older messages for pagination (Module 2)
  const loadOlderMessages = async () => {
    if (!hasMore || loadingOlder || !conversationId) return;

    try {
      setLoadingOlder(true);
      const nextPage = page + 1;
      const res = await messagesAPI.getMessages(conversationId, nextPage, 30);
      if (res.data.success) {
        setMessages((prev) => [...res.data.messages, ...prev]);
        setPage(nextPage);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Listen to new_message event via Socket.io
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (newMsg) => {
      // If message belongs to current conversation, append it
      if (newMsg.conversation === conversationId || newMsg.conversation?._id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Mark as read immediately since user is actively viewing this chat
        socket.emit('mark_read', { conversationId });
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  // Handle local optimistic or REST send callback
  const handleMessageSent = (newMsg) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === newMsg._id)) return prev;
      return [...prev, newMsg];
    });
  };

  // If no conversation is selected, show an engaging welcome dashboard
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/25 mb-6">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Chat App</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Welcome to SapphireIQ Chat
        </h2>
        <p className="text-sm text-slate-400 max-w-md mt-2 mb-8 leading-relaxed">
          Select a chat from the sidebar to start messaging, or search for users to start a new 1-on-1 or group conversation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full text-left">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Instant WebSockets</h4>
            <p className="text-[11px] text-slate-400">
              Live messaging powered by Socket.io rooms with zero-refresh delivery.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Rich Presence</h4>
            <p className="text-[11px] text-slate-400">
              Real-time online status indicators, active typing bubbles, and unread counts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Groups & Images</h4>
            <p className="text-[11px] text-slate-400">
              Multi-member group collaboration, admin control, and image sharing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Chat Header */}
      <ChatHeader onOpenGroupInfo={() => setIsGroupInfoOpen(true)} />

      {/* Message List */}
      <MessageList
        messages={messages}
        loadingOlder={loadingOlder}
        hasMore={hasMore}
        onLoadOlder={loadOlderMessages}
        onImageClick={(url) => setPreviewImageUrl(url)}
      />

      {/* Message Input */}
      <MessageInput onMessageSent={handleMessageSent} />

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
};

export default ChatArea;
