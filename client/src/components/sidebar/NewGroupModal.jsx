import React, { useState, useEffect } from 'react';
import { usersAPI, conversationsAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import { X, Search, Check, Users, AlertCircle } from 'lucide-react';

const NewGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Search users whenever modal opens or search query changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setSearching(true);
        const res = await usersAPI.searchUsers(searchTerm);
        if (res.data.success) {
          setAvailableUsers(res.data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  const toggleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least 1 other member to form a group');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await conversationsAPI.createGroup(groupName.trim(), selectedUserIds);
      if (res.data.success) {
        onGroupCreated(res.data.conversation);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Group Chat</h3>
              <p className="text-xs text-slate-400">Add members to start collaborating</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col overflow-hidden p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Group Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Design Team 🎨 or Project Roadmap"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              required
            />
          </div>

          {/* Search Users Input */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Members ({selectedUserIds.length} selected)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/50 border border-slate-700/80 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 my-2 min-h-[160px] max-h-[220px]">
            {searching ? (
              <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                <span className="inline-block w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                Searching users...
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No users found
              </div>
            ) : (
              availableUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleSelectUser(u._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={u.username} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{u.username}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{u.email}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-900/50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUserIds.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-md shadow-indigo-600/20"
            >
              {loading ? 'Creating...' : `Create Group (${selectedUserIds.length + 1} members)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
