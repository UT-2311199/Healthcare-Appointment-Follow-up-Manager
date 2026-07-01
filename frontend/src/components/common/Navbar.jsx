import { useState }              from 'react';
import { Link, useNavigate }     from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, LogOut, Bell,
  ChevronDown, LayoutDashboard,
} from 'lucide-react';
import { useAuth }          from '../../context/AuthContext';
import { useTheme }         from '../../context/ThemeContext';
import ThemeToggle          from './ThemeToggle';

// Safe hook — returns empty values if NotificationContext is not ready
function useSafeNotifications() {
  try {
    const { useNotifications } = require('../../context/NotificationContext');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useNotifications() || { notifications: [], unreadCount: 0, markAsRead: () => {} };
  } catch {
    return { notifications: [], unreadCount: 0, markAsRead: () => {} };
  }
}

export default function Navbar() {
  const { user, logout }   = useAuth();
  const { isDark }         = useTheme();
  const navigate           = useNavigate();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Try to get notifications — won't crash if context missing
  let notifications = [], unreadCount = 0, markAsRead = () => {};
  try {
    // Dynamic import to avoid crash if context not wrapped yet
    const notifCtx = require('../../context/NotificationContext');
    // We can't call hooks conditionally, so we'll handle this differently
  } catch { /* ignore */ }

  const dashPath =
    user?.role === 'admin'  ? '/admin/dashboard'  :
    user?.role === 'doctor' ? '/doctor/dashboard' :
    '/patient/dashboard';

  const roleGradients = {
    admin:   'linear-gradient(135deg,#ef4444,#f97316)',
    doctor:  'linear-gradient(135deg,#0d9488,#06b6d4)',
    patient: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dropdownStyle = {
    background:     'var(--bg-dropdown)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:         '1px solid var(--border-primary)',
    boxShadow:      'var(--shadow-xl)',
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50"
      style={{
        background:     'var(--bg-nav)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:   '1px solid var(--border-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to={dashPath} className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              <Heart className="w-4 h-4 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                HealthCare+
              </p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                {user?.role} Portal
              </p>
            </div>
          </Link>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-2">

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell
              isDark={isDark}
              dropdownStyle={dropdownStyle}
            />

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setShowProfile((o) => !o); setShowNotif(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border:     '1px solid var(--border-input)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                              text-white text-xs font-bold flex-shrink-0"
                  style={{ background: roleGradients[user?.role] || roleGradients.patient }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none"
                     style={{ color: 'var(--text-primary)' }}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-xs capitalize mt-0.5"
                     style={{ color: 'var(--text-muted)' }}>
                    {user?.role || 'guest'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200
                              ${showProfile ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-muted)' }}
                />
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfile(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0,  scale: 1    }}
                      exit={{   opacity: 0, y: 10, scale: 0.95  }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-52 z-20 rounded-2xl overflow-hidden"
                      style={dropdownStyle}
                    >
                      {/* User Info */}
                      <div
                        className="p-4"
                        style={{ borderBottom: '1px solid var(--border-primary)' }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center
                                      text-white font-bold text-sm mb-2"
                          style={{ background: roleGradients[user?.role] }}
                        >
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <p className="font-semibold text-sm"
                           style={{ color: 'var(--text-primary)' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs mt-0.5 truncate"
                           style={{ color: 'var(--text-muted)' }}>
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          onClick={() => { navigate(dashPath); setShowProfile(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                     transition-all text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-card-hover)';
                            e.currentTarget.style.color      = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color      = 'var(--text-secondary)';
                          }}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>

                        <div className="my-1"
                             style={{ height: 1, background: 'var(--border-primary)' }} />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                     transition-all text-sm text-red-400 hover:text-red-300"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Notification Bell (separate component to keep Navbar clean) ──
function NotificationBell({ dropdownStyle }) {
  const [open, setOpen] = useState(false);

  // Safe access
  let notifications = [], unreadCount = 0, markAsRead = () => {};
  try {
    const ctx = require('../../context/NotificationContext');
    if (ctx.useNotifications) {
      const data = ctx.useNotifications();
      if (data) {
        notifications = data.notifications || [];
        unreadCount   = data.unreadCount   || 0;
        markAsRead    = data.markAsRead    || (() => {});
      }
    }
  } catch { /* ignore */ }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: 'var(--bg-input)',
          border:     '1px solid var(--border-input)',
        }}
      >
        <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{   scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white
                         text-xs rounded-full flex items-center justify-center
                         font-bold leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: 10, scale: 0.95  }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 z-20 rounded-2xl overflow-hidden"
              style={dropdownStyle}
            >
              {/* Header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border-primary)' }}
              >
                <h3 className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="badge badge-purple text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2"
                          style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      All caught up!
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n, i) => (
                    <motion.div
                      key={n._id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { markAsRead(n._id); }}
                      className="p-4 cursor-pointer transition-colors"
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        background: !n.read ? 'var(--brand-light)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          !n.read ? 'var(--brand-light)' : 'transparent';
                      }}
                    >
                      <div className="flex gap-2">
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                               style={{ background: 'var(--text-accent)' }} />
                        )}
                        <div>
                          {n.title && (
                            <p className="text-xs font-semibold mb-0.5"
                               style={{ color: 'var(--text-primary)' }}>
                              {n.title}
                            </p>
                          )}
                          <p className="text-xs leading-relaxed"
                             style={{ color: 'var(--text-secondary)' }}>
                            {n.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}