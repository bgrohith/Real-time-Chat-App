import React from 'react';

const Avatar = ({ src, name = 'User', size = 'md', isOnline = false, showStatus = false, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const dotSizeClasses = {
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'w-4 h-4 bottom-1 right-1 border-2'
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const avatarUrl = src || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover bg-slate-800 ring-2 ring-slate-800/80 shadow-inner`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        }}
      />
      {showStatus && (
        <span
          className={`absolute ${dotSizeClasses[size] || dotSizeClasses.md} rounded-full border-slate-900 ${
            isOnline ? 'bg-emerald-500 ring-1 ring-emerald-400/50' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
