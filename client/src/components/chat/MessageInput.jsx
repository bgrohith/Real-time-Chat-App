import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../services/api';
import { Send, Image, X, Smile } from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🎉', '🚀', '😄', '🙌', '✨'];

const MessageInput = ({ onMessageSent }) => {
  const { user } = useAuth();
  const { socket, activeConversation } = useSocket();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversationId = activeConversation?._id;

  // Handle typing indicator emission
  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (!socket || !conversationId) return;

    // Emit typing_start immediately
    socket.emit('typing_start', { conversationId });

    // Debounce typing_stop
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId });
    }, 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending || !conversationId) return;

    if (socket && conversationId) {
      socket.emit('typing_stop', { conversationId });
    }

    try {
      setIsSending(true);

      if (selectedFile) {
        // Send multipart form-data via REST (Module 5 image upload with multer)
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        if (text.trim()) formData.append('text', text.trim());
        formData.append('imageFile', selectedFile);

        const res = await messagesAPI.sendMessage(formData, true);
        if (res.data.success) {
          // Socket handles broadcast server-side or local update
          onMessageSent && onMessageSent(res.data.message);
        }
      } else {
        // Send via Socket.io for immediate live messaging (Module 3)
        if (socket && socket.connected) {
          socket.emit('send_message', {
            conversationId,
            text: text.trim()
          });
        } else {
          // Fallback to REST API
          const res = await messagesAPI.sendMessage({
            conversationId,
            text: text.trim()
          });
          if (res.data.success) {
            onMessageSent && onMessageSent(res.data.message);
          }
        }
      }

      // Reset input state
      setText('');
      removeSelectedFile();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-900/90 relative">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 p-2 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl flex items-center gap-1.5 animate-fade-in z-20">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Selected Image Preview Pill */}
      {previewUrl && (
        <div className="mb-3 flex items-center gap-3 p-2 bg-slate-800/80 rounded-xl border border-slate-700 w-fit animate-fade-in">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="text-xs">
            <p className="font-medium text-slate-200 truncate max-w-[150px]">
              {selectedFile?.name}
            </p>
            <p className="text-[11px] text-slate-400">Ready to send</p>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="p-1 rounded-full bg-slate-700 text-slate-300 hover:text-rose-400 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Attach Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image"
          className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Insert Emoji"
          className="p-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send)"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isSending}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isSending ? (
            <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
