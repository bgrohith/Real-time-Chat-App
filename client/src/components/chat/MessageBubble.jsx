import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isGroup, onImageClick }) => {
  const { user } = useAuth();
  const isOwn = message.sender?._id === user?._id || message.sender === user?._id;

  const senderName = message.sender?.username || 'User';
  const senderAvatar = message.sender?.avatar;

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  // Check if read by anyone else
  const isReadByOthers =
    Array.isArray(message.readBy) &&
    message.readBy.some((r) => {
      const rId = typeof r === 'object' ? r._id : r;
      return rId && rId.toString() !== user?._id.toString();
    });

  return (
    <div className={`flex items-end gap-2.5 my-2 animate-fade-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Show sender avatar for group chats from others */}
      {!isOwn && isGroup && (
        <Avatar src={senderAvatar} name={senderName} size="sm" className="mb-1" />
      )}

      <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {!isOwn && isGroup && (
          <span className="text-[11px] font-semibold text-indigo-400 mb-1 ml-1">
            {senderName}
          </span>
        )}

        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words leading-relaxed ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-600/20'
              : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/60'
          }`}
        >
          {/* Attached Image */}
          {message.image && (
            <div className="mb-2 overflow-hidden rounded-xl bg-slate-900/40">
              <img
                src={message.image}
                alt="Shared attachment"
                onClick={() => onImageClick && onImageClick(message.image)}
                className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                loading="lazy"
              />
            </div>
          )}

          {/* Message Text */}
          {message.text && (
            <p className="whitespace-pre-wrap select-text">{message.text}</p>
          )}

          {/* Footer: Time & Read Receipt */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
              isOwn ? 'text-indigo-200/80' : 'text-slate-400'
            }`}
          >
            <span>{formattedTime}</span>
            {isOwn && (
              <span>
                {isReadByOthers ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300" title="Read" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-70" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
