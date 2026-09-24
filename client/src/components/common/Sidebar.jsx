import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Settings,
  Play,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/course', label: 'My Course', icon: BookOpen, isPrefix: true },
  { path: '/assignments', label: 'Assignments', icon: ClipboardList },
  { path: '/community', label: 'Community', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path, isPrefix) => {
    if (isPrefix) return location.pathname.startsWith(path);
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Hamburger Trigger (Floating) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        // ✅ FIX 1: Changed z-30 to z-[60] so it sits ABOVE the TopBar (which is z-40)
        // ✅ FIX 2: Added 'hidden' when menu is open so it doesn't float over the sidebar
        className={`lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-dark-800 text-white rounded-xl shadow-lg border border-dark-700 hover:bg-dark-700 active:scale-95 transition-all ${isMobileOpen ? 'hidden' : 'block'}`}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div
          // ✅ FIX 3: Changed z-40 to z-[55] so it sits above TopBar but below Sidebar
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        // ✅ FIX 4: Changed z-50 to z-[60] so the sidebar covers the TopBar completely
        className={`fixed top-0 left-0 h-full bg-dark-900 border-r border-dark-800 z-[60] transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-20' : 'lg:w-[var(--spacing-sidebar)]'}
          ${isMobileOpen 
            ? 'w-[280px] translate-x-0 shadow-2xl shadow-black/50 flex' 
            : '-translate-x-full lg:translate-x-0 lg:flex'
          }
          flex-col`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-dark-800 shrink-0">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-primary-600/20">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-white tracking-tight">
                YouTube<span className="text-primary-500">Auto</span>
              </span>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.isPrefix);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20 shadow-sm'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary-400' : 'group-hover:text-white'}`} />
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-dark-800 shrink-0">
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors text-sm w-full p-2.5 rounded-xl ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}