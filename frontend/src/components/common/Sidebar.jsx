import { NavLink, useLocation } from 'react-router-dom';
import { motion }               from 'framer-motion';
import { useAuth }              from '../../context/AuthContext';
import { useTheme }             from '../../context/ThemeContext';
import ThemeToggle              from './ThemeToggle';
import {
  LayoutDashboard, Search, Calendar,
  User, ClipboardList, Stethoscope,
} from 'lucide-react';

const NAV = {
  patient: [
    { to: '/patient/dashboard',    icon: LayoutDashboard, label: 'Dashboard',       desc: 'Overview'           },
    { to: '/patient/search',       icon: Search,          label: 'Find Doctors',    desc: 'Search specialists' },
    { to: '/patient/appointments', icon: Calendar,        label: 'My Appointments', desc: 'Manage bookings'    },
  ],
  doctor: [
    { to: '/doctor/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    desc: 'Overview'       },
    { to: '/doctor/appointments', icon: ClipboardList,   label: 'Appointments', desc: 'Patient visits'  },
    { to: '/doctor/profile',      icon: User,            label: 'My Profile',   desc: 'Settings'       },
  ],
  admin: [
    { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    desc: 'System overview' },
    { to: '/admin/doctors',      icon: Stethoscope,     label: 'Doctors',      desc: 'Manage doctors'  },
    { to: '/admin/appointments', icon: Calendar,        label: 'Appointments', desc: 'All bookings'    },
  ],
};

export default function Sidebar() {
  const { user }   = useAuth();
  const { isDark } = useTheme();
  const links      = NAV[user?.role] || [];

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-64 min-h-screen hidden md:flex flex-col py-6 px-3"
      style={{
        background:     'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight:    '1px solid var(--border-primary)',
      }}
    >
      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1">
        <p
          className="text-xs font-semibold uppercase tracking-widest px-3 mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Navigation
        </p>

        {links.map((link, i) => (
          <NavLink key={link.to} to={link.to}>
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0  }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1
                             cursor-pointer transition-all duration-200 group
                             ${isActive ? 'nav-active' : ''}`}
                style={!isActive ? {} : {}}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Icon Box */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                               flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--brand-light)' : 'var(--bg-card)',
                    border:     '1px solid var(--border-primary)',
                  }}
                >
                  <link.icon
                    className="w-4 h-4"
                    style={{
                      color: isActive
                        ? 'var(--text-accent)'
                        : 'var(--text-muted)',
                    }}
                  />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-none"
                    style={{
                      color: isActive
                        ? 'var(--text-accent)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {link.label}
                  </p>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {link.desc}
                  </p>
                </div>

                {/* Active dot */}
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--text-accent)' }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="mt-auto space-y-3">

        {/* Theme Toggle Card */}
        <div className="glass-card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                Appearance
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {isDark ? '🌙 Dark mode' : '☀️ Light mode'}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="pulse-dot" />
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--success-text)' }}
            >
              System Online
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'API',      status: 'Online' },
              { label: 'Database', status: 'Online' },
              { label: 'Email',    status: 'Active' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {s.label}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--success-text)' }}
                >
                  ● {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}