import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  ClipboardCheck,
  MessageSquare,
  Play,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/students', label: 'Students', icon: Users },
  { path: '/admin/courses', label: 'Courses', icon: BookOpen },
  { path: '/admin/coupons', label: 'Coupons', icon: Tag },
  { path: '/admin/submissions', label: 'Submissions', icon: ClipboardCheck },
  { path: '/admin/community', label: 'Community', icon: MessageSquare },
];

export default function AdminSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[var(--spacing-sidebar)] bg-dark-900 border-r border-dark-800 z-50 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-dark-800">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Admin<span className="text-primary-500">Panel</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                active
                  ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-400' : ''}`} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-dark-400 hover:text-danger-500 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}