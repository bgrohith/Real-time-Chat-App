import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../common/Avatar';
import { Users, Info, MoreVertical } from 'lucide-react';

const ChatHeader = ({ onOpenGroupInfo }) => {
  const { user } = useAuth();
  const { activeConversation, isUserOnline, typingMap } = useSocket();

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;

  const otherMember = !isGroup
    ? activeConversation.members?.find((m) => m._id !== user?._id) || {}
    : null;

  const title = isGroup
    ? activeConversation.name
    : otherMember?.username || 'Chat';

  const isOnline = !isGroup && isUserOnline(otherMember?._id);

  // Check if anyone in this conversation is currently typing
  const typingList = typingMap[activeConversation._id] || [];
  const activeTypingUsers = typingList.filter((u) => u.userId !== user?._id);

  const getSubtitle = () => {
    if (activeTypingUsers.length > 0) {
      if (activeTypingUsers.length === 1) {
        return (
          <span className="text-indigo-400 font-medium animate-pulse">
            {activeTypingUsers[0].username} is typing...
          </span>
        );
      }
      return (
        <span className="text-indigo-400 font-medium animate-pulse">
          Several people are typing...
        </span>
      );
    }

    if (isGroup) {
      const count = activeConversation.members?.length || 0;
      return <span>{count} members</span>;
    }

    if (isOnline) {
      return <span className="text-emerald-400 font-medium">Online</span>;
    }

    return <span>Offline</span>;
  };

  return (
    <div className="h-16 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        {isGroup ? (
          <div
            onClick={onOpenGroupInfo}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white ring-2 ring-slate-800/80 shadow-inner cursor-pointer"
          >
            <Users className="w-5 h-5" />
          </div>
        ) : (
          <Avatar
            src={otherMember?.avatar}
            name={title}
            size="md"
            showStatus={true}
            isOnline={isOnline}
          />
        )}

        <div>
          <h2
            onClick={isGroup ? onOpenGroupInfo : undefined}
            className={`text-sm font-bold text-white flex items-center gap-1.5 ${
              isGroup ? 'cursor-pointer hover:text-indigo-300' : ''
            }`}
          >
            {title}
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            {getSubtitle()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isGroup && (
          <button
            onClick={onOpenGroupInfo}
            title="Group Info & Members"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
