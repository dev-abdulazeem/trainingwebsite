import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { Play, Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Helper to close mobile menu when a link is clicked
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    // ✅ CHANGED: Removed 'fixed', now uses 'sticky top-0' so it stays at top but flows naturally
    <nav className="sticky top-0 z-50 w-full bg-dark-950/95 backdrop-blur-md border-b border-dark-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMobileMenu}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              YouTube<span className="text-primary-500">Auto</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isLanding && (
              <>
                <a href="#curriculum" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">Curriculum</a>
                <a href="#pricing" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">Pricing</a>
                <a href="#faq" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">FAQ</a>
              </>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4 pl-6 border-l border-dark-800">
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 pl-6 border-l border-dark-800">
                <Link to="/login" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ✅ Mobile Dropdown Menu (Sidebar-like) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-dark-800 bg-dark-900/95 backdrop-blur-md animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {isLanding && (
              <>
                <a href="#curriculum" onClick={closeMobileMenu} className="block px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors font-medium">
                  Curriculum
                </a>
                <a href="#pricing" onClick={closeMobileMenu} className="block px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors font-medium">
                  Pricing
                </a>
                <a href="#faq" onClick={closeMobileMenu} className="block px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors font-medium">
                  FAQ
                </a>
                <div className="border-t border-dark-800 my-2" />
              </>
            )}
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-primary-400 hover:bg-dark-800 transition-colors font-medium">
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <div className="border-t border-dark-800 my-2" />
                <button 
                  onClick={() => { logout(); closeMobileMenu(); }} 
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-danger-500 hover:bg-danger-500/10 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu} className="block px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors font-medium">
                  Sign In
                </Link>
                <Link to="/register" onClick={closeMobileMenu} className="block px-3 py-2.5 mt-2 text-center bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}