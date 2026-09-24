import { useAuthStore } from '@store/authStore';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 w-full h-[var(--spacing-topbar)] bg-dark-950/90 backdrop-blur-md border-b border-dark-800 z-40">
      <div className="h-full max-w-[1400px] mx-auto flex items-center gap-4 px-4 lg:px-6">
        
        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 group-focus-within:text-primary-400 transition-colors" />
            <input
              type="text"
              placeholder="Search lessons, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-lg transition-colors ${
                showNotifications
                  ? 'bg-dark-800 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-dark-950" />
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <>
                {/* Click-away overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-dark-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <span className="text-xs text-dark-500">0 unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-dark-700 mx-auto mb-3" />
                      <p className="text-dark-500 text-sm">No new notifications</p>
                    </div>
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block px-4 py-3 text-center text-primary-400 hover:text-primary-300 hover:bg-dark-800/50 text-sm font-medium border-t border-dark-800 transition-colors"
                  >
                    View all notifications
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-dark-800 mx-1 hidden sm:block" />

          {/* User avatar */}
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:ring-2 hover:ring-primary-500/40 transition-all">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}