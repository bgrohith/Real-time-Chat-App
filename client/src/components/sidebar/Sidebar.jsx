import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { usersAPI, conversationsAPI } from '../../services/api';
import ConversationItem from './ConversationItem';
import NewGroupModal from './NewGroupModal';
import Avatar from '../common/Avatar';
import {
  Search,
  Plus,
  Users,
  LogOut,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserPlus
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    refreshConversations,
    isUserOnline
  } = useSocket();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'direct', 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Handle user search in the global directory to start a new chat
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const res = await usersAPI.searchUsers(val.trim());
      if (res.data.success) {
        setSearchResults(res.data.users);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Start or open a direct 1-to-1 conversation with a discovered user
  const handleStartDirectChat = async (recipientId) => {
    try {
      const res = await conversationsAPI.getOrCreateDirect(recipientId);
      if (res.data.success) {
        const conv = res.data.conversation;
        await refreshConversations();
        setActiveConversation(conv);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  // Filter conversations according to tab
  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'direct') return !c.isGroup;
    if (activeTab === 'groups') return c.isGroup;
    return true;
  });

  return (
    <aside className="w-80 md:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* 1. Header & Current User Card */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.avatar}
            name={user?.username}
            size="md"
            showStatus={true}
            isOnline={true}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{user?.username}</h3>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            title="Create New Group"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Global Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search users or start new chat..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* 3. Search Results Overlay or Tabs */}
      {searchQuery.trim() ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
            <span>Discovered Users</span>
            {isSearchingUsers && (
              <span className="inline-block w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            )}
          </div>

          {searchResults.length === 0 && !isSearchingUsers ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No users matching "{searchQuery}"
            </div>
          ) : (
            searchResults.map((u) => {
              const online = isUserOnline(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => handleStartDirectChat(u._id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/30 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={u.avatar}
                      name={u.username}
                      size="sm"
                      showStatus={true}
                      isOnline={online}
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{u.username}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                        {u.statusMessage || u.email}
                      </p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-indigo-400 hover:text-indigo-300" />
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          {/* Tabs: All, Direct, Groups */}
          <div className="flex items-center gap-1 px-3 pb-2 border-b border-slate-800/60">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              All Chats
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'direct'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'groups'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Groups
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-400">No conversations yet</p>
                <p className="mt-1">Search for a user or create a group to start chatting!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={activeConversation?._id === conv._id}
                  onClick={() => setActiveConversation(conv)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Group Creation Modal */}
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={(newGroup) => {
          refreshConversations();
          setActiveConversation(newGroup);
        }}
      />
    </aside>
  );
};

export default Sidebar;
