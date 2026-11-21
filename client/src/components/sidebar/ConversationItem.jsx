import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../common/Avatar';
import { formatDistanceToNow, isToday, format } from 'date-fns';
import { Users, Image as ImageIcon } from 'lucide-react';

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const isGroup = conversation.isGroup;

  // For 1-on-1 direct conversation, get the other participant
  const otherMember = !isGroup
    ? conversation.members?.find((m) => m._id !== user?._id) || {}
    : null;

  const displayName = isGroup
    ? conversation.name
    : otherMember?.username || 'Unknown User';

  const avatarSrc = isGroup
    ? null
    : otherMember?.avatar;

  const online = !isGroup && isUserOnline(otherMember?._id);

  // Unread badge count for current user
  const unreadCount =
    (conversation.unreadCounts && user?._id && conversation.unreadCounts[user._id]) || 0;

  // Format timestamp of last message
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      }
      return formatDistanceToNow(date, { addSuffix: false });
    } catch {
      return '';
    }
  };

  const lastMsgTime = conversation.lastMessage?.createdAt || conversation.updatedAt;

  // Snippet of last message
  const renderLastMessageSnippet = () => {
    const lastMsg = conversation.lastMessage;
    if (!lastMsg) {
      return <span className="italic text-slate-500">No messages yet</span>;
    }

    const isOwn = lastMsg.sender?._id === user?._id || lastMsg.sender === user?._id;
    const prefix = isOwn ? 'You: ' : isGroup && lastMsg.sender?.username ? `${lastMsg.sender.username}: ` : '';

    if (lastMsg.image && !lastMsg.text) {
      return (
        <span className="flex items-center gap-1 text-indigo-400">
          <span>{prefix}</span>
          <ImageIcon className="w-3.5 h-3.5 inline" />
          <span>Image</span>
        </span>
      );
    }

    return (
      <span className="truncate">
        {prefix}
        {lastMsg.text}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-150 relative ${
        isSelected
          ? 'bg-indigo-600/15 border border-indigo-500/30 shadow-sm'
          : 'hover:bg-slate-800/60 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isGroup ? (
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white ring-2 ring-slate-800/80 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
        ) : (
          <Avatar
            src={avatarSrc}
            name={displayName}
            size="md"
            showStatus={true}
            isOnline={online}
          />
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-sm font-semibold truncate ${
              isSelected ? 'text-indigo-300' : 'text-slate-100 group-hover:text-white'
            }`}
          >
            {displayName}
          </h4>
          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
            {formatTime(lastMsgTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400 truncate max-w-[180px]">
            {renderLastMessageSnippet()}
          </div>

          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white shadow-sm shadow-indigo-500/40 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
