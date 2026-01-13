'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { userService } from '@/services';
import type { User } from '@/types';
import { toast } from 'sonner';

interface UserSearchDropdownProps {
  onSelect: (user: User) => void;
  selectedUser: User | null;
  currentUserId: string;
  placeholder?: string;
}

export default function UserSearchDropdown({
  onSelect,
  selectedUser,
  currentUserId,
  placeholder = 'Search by username or email'
}: UserSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
    fetchRecentUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = userService.searchUsers(allUsers, searchQuery);
      setFilteredUsers(filtered.filter(u => u.id !== currentUserId));
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery, allUsers, currentUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data?.users) {
        // Filter out current user
        const users = response.data.users.filter(u => u.id !== currentUserId);
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const recent = await userService.getRecentlyPlayedWith();
      setRecentUsers(recent.filter(u => u.id !== currentUserId));
    } catch (error) {
      console.error('Failed to fetch recent users:', error);
    }
  };

  const handleSelect = (user: User) => {
    onSelect(user);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null as any);
    setSearchQuery('');
  };

  const renderUserItem = (user: User) => (
    <button
      key={user.id}
      onClick={() => handleSelect(user)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-600 flex-shrink-0">
        {user.profileImage ? (
          <img src={user.profileImage} alt={user.username || user.email} className="w-full h-full object-cover" />
        ) : user.gravatarUrl ? (
          <img src={user.gravatarUrl} alt={user.username || user.email} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
            {(user.username || user.email)[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-white font-medium truncate">
          {user.username || user.email}
        </p>
        {user.username && (
          <p className="text-slate-400 text-sm truncate">{user.email}</p>
        )}
        <p className="text-slate-500 text-xs truncate">{user.walletAddress}</p>
      </div>

      {/* Stats */}
      {(user.totalBets !== undefined && user.totalBets > 0) && (
        <div className="text-xs text-slate-400">
          {user.totalBets} predictions
        </div>
      )}
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected User Display or Search Input */}
      {selectedUser ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-600 flex-shrink-0">
            {selectedUser.profileImage ? (
              <img src={selectedUser.profileImage} alt={selectedUser.username || selectedUser.email} className="w-full h-full object-cover" />
            ) : selectedUser.gravatarUrl ? (
              <img src={selectedUser.gravatarUrl} alt={selectedUser.username || selectedUser.email} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                {(selectedUser.username || selectedUser.email)[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {selectedUser.username || selectedUser.email}
            </p>
            {selectedUser.username && (
              <p className="text-slate-400 text-sm truncate">{selectedUser.email}</p>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedUser && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Recently Played With */}
              {!searchQuery && recentUsers.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Recently Played With
                  </div>
                  {recentUsers.map(renderUserItem)}
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div>
                  {filteredUsers.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                        Search Results ({filteredUsers.length})
                      </div>
                      {filteredUsers.map(renderUserItem)}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <p className="mb-2">No users found</p>
                      <p className="text-sm">Try searching by username or email</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!searchQuery && recentUsers.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-1">Start typing to search for players</p>
                  <p className="text-sm">Search by username or email</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
