import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const MessageList = ({
  messages,
  loadingOlder,
  hasMore,
  onLoadOlder,
  onImageClick
}) => {
  const { user } = useAuth();
  const { activeConversation, typingMap } = useSocket();
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive (unless user is loading older)
  useEffect(() => {
    if (!loadingOlder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingOlder]);

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;

  // Active typing list for this conversation
  const typingList = (typingMap[activeConversation._id] || []).filter(
    (u) => u.userId !== user?._id
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-start">
      {/* Load More Button for Pagination (Module 2 Message History with pagination) */}
      {hasMore && (
        <div className="text-center my-2">
          <button
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-indigo-300 font-medium transition inline-flex items-center gap-1.5 shadow-sm"
          >
            {loadingOlder ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading older messages...
              </>
            ) : (
              'Load older messages'
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
          <p className="text-sm font-semibold text-slate-400">No messages in this chat yet</p>
          <p className="text-xs text-slate-500 mt-1">Say hello to get the conversation started!</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isGroup={isGroup}
            onImageClick={onImageClick}
          />
        ))
      )}

      {/* Animated Typing Indicator Bubble (Module 4) */}
      {typingList.length > 0 && (
        <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1 animate-fade-in">
          <div className="flex gap-1 items-center bg-slate-800/90 border border-slate-700/70 px-3 py-2 rounded-2xl rounded-bl-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-slate-400">
            {typingList.map((u) => u.username).join(', ')} {typingList.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
