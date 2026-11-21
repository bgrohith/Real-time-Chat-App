import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { usersAPI, conversationsAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import { X, UserPlus, Crown, Users, AlertCircle, Check } from 'lucide-react';

const GroupInfoModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeConversation, setActiveConversation, isUserOnline, refreshConversations } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [addingMemberId, setAddingMemberId] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !activeConversation || !activeConversation.isGroup) return null;

  const isAdmin =
    activeConversation.groupAdmin?._id === user?._id ||
    activeConversation.groupAdmin === user?._id;

  const memberIds = (activeConversation.members || []).map((m) =>
    typeof m === 'object' ? m._id : m
  );

  // Search users who are not yet in this group
  useEffect(() => {
    if (!isAdmin) return;

    const searchCandidates = async () => {
      try {
        const res = await usersAPI.searchUsers(searchTerm);
        if (res.data.success) {
          const nonMembers = res.data.users.filter(
            (u) => !memberIds.includes(u._id)
          );
          setAvailableUsers(nonMembers);
        }
      } catch (err) {
        console.error('Error searching candidates:', err);
      }
    };

    const timer = setTimeout(searchCandidates, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isAdmin, activeConversation]);

  const handleAddMember = async (userId) => {
    try {
      setError('');
      setAddingMemberId(userId);
      const res = await conversationsAPI.addGroupMember(activeConversation._id, userId);
      if (res.data.success) {
        setActiveConversation(res.data.conversation);
        await refreshConversations();
        setSearchTerm('');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setAddingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white truncate max-w-[240px]">
                {activeConversation.name}
              </h3>
              <p className="text-xs text-slate-400">
                {activeConversation.members?.length || 0} Members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Members List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Group Members
            </h4>
            <div className="space-y-1.5">
              {activeConversation.members?.map((m) => {
                const isGroupAdmin =
                  activeConversation.groupAdmin?._id === m._id ||
                  activeConversation.groupAdmin === m._id;
                const online = isUserOnline(m._id);

                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={m.avatar}
                        name={m.username}
                        size="sm"
                        showStatus={true}
                        isOnline={online}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-200">
                            {m.username}
                          </span>
                          {m._id === user?._id && (
                            <span className="text-[10px] text-slate-500">(You)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {m.statusMessage || m.email}
                        </p>
                      </div>
                    </div>

                    {isGroupAdmin && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Crown className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members Section (Admin only - as per Module 5 rules) */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Add New Members
              </h4>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users to invite..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition mb-2"
              />

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {availableUsers.length === 0 ? (
                  <p className="text-center py-3 text-xs text-slate-500">
                    No eligible users found
                  </p>
                ) : (
                  availableUsers.map((cand) => (
                    <div
                      key={cand._id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={cand.avatar} name={cand.username} size="sm" />
                        <span className="text-xs font-medium text-slate-200">
                          {cand.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMember(cand._id)}
                        disabled={addingMemberId === cand._id}
                        className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition"
                      >
                        {addingMemberId === cand._id ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
