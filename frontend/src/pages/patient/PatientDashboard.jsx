import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Search, Activity,
  ChevronRight, Plus, Zap, TrendingUp, Heart,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';

// Shimmer skeleton
function Skeleton({ className = '' }) {
  return <div className={`shimmer ${className}`} />;
}

// Animated stat card
function StatCard({ label, value, icon: Icon, color, delay, suffix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`stat-card stat-card-${color} group cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="style={{ color: 'var(--text-tertiary)' }} text-xs font-semibold uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold style={{ color: 'var(--text-primary)' }}">
            {value}
            {suffix && <span className="text-lg style={{ color: 'var(--text-secondary)' }} ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                          transition-transform group-hover:scale-110 duration-200
                          ${
                            color === 'purple' ? 'bg-violet-500/20' :
                            color === 'blue'   ? 'bg-blue-500/20'   :
                            color === 'green'  ? 'bg-emerald-500/20':
                                                 'bg-orange-500/20'
                          }`}>
          <Icon className={`w-5 h-5 ${
            color === 'purple' ? 'text-violet-400' :
            color === 'blue'   ? 'text-blue-400'   :
            color === 'green'  ? 'text-emerald-400' :
                                  'text-orange-400'
          }`} />
        </div>
      </div>
    </motion.div>
  );
}

// Appointment item
function AppointmentItem({ apt, index, navigate }) {
  const status = APPOINTMENT_STATUS[apt.status] || APPOINTMENT_STATUS.PENDING;
  const urgency = apt.preVisitSummary?.urgencyLevel;

  const urgencyColor = {
    High:   'text-red-400   bg-red-400/10',
    Medium: 'text-amber-400 bg-amber-400/10',
    Low:    'text-emerald-400 bg-emerald-400/10',
  }[urgency] || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => navigate(`/patient/appointments/${apt._id}`)}
      className="glass-card-hover p-4 cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20
                         flex items-center justify-center text-violet-300 font-bold text-lg
                         border border-violet-500/20 flex-shrink-0">
          {apt.doctor?.name?.charAt(0) || 'D'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="style={{ color: 'var(--text-primary)' }} font-semibold text-sm truncate">
              Dr. {apt.doctor?.name}
            </p>
            {urgency && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${urgencyColor}`}>
                {urgency}
              </span>
            )}
          </div>
          <p className="style={{ color: 'var(--text-tertiary)' }} text-xs">{apt.doctor?.specialization}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs style={{ color: 'var(--text-secondary)' }}">
              <Calendar className="w-3 h-3" /> {formatDate(apt.date)}
            </span>
            <span className="flex items-center gap-1 text-xs style={{ color: 'var(--text-secondary)' }}">
              <Clock className="w-3 h-3" /> {apt.time}
            </span>
          </div>
        </div>

        {/* Status + Arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge text-xs ${
            apt.status === 'CONFIRMED'  ? 'badge-blue'   :
            apt.status === 'COMPLETED'  ? 'badge-green'  :
            apt.status === 'CANCELLED'  ? 'badge-red'    :
                                          'badge-yellow'
          }`}>
            {status.label}
          </span>
          <ChevronRight className="w-4 h-4 style={{ color: 'var(--text-muted)' }} group-hover:style={{ color: 'var(--text-secondary)' }}
                                    transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          api.get('/patient/stats'),
          api.get('/appointments?limit=5'),
        ]);
        setStats(sRes.data);
        setUpcoming(aRes.data.appointments?.filter(
          (a) => ['CONFIRMED','PENDING'].includes(a.status)
        ).slice(0, 4) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(79,70,229,0.2) 50%, rgba(6,182,212,0.15) 100%)',
          border:     '1px solid rgba(139,92,246,0.2)',
        }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl"
               style={{ background: 'rgba(139,92,246,0.15)' }} />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl"
               style={{ background: 'rgba(6,182,212,0.1)' }} />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center
                         justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-violet-300 text-sm font-semibold mb-1"
            >
              Good {new Date().getHours() < 12 ? 'Morning' :
                    new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
            </motion.p>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold style={{ color: 'var(--text-primary)' }}"
            >
              {user?.name?.split(' ')[0]},
              <span className="gradient-text"> how are you today?</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1"
            >
              {loading ? 'Loading your health summary...' :
               `You have ${stats?.upcoming || 0} upcoming appointment${stats?.upcoming !== 1 ? 's' : ''}`}
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/patient/search')}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total"     value={stats?.total     || 0} icon={Calendar}  color="purple" delay={0}    />
            <StatCard label="Upcoming"  value={stats?.upcoming  || 0} icon={Clock}     color="blue"   delay={0.1}  />
            <StatCard label="Completed" value={stats?.completed || 0} icon={Activity}  color="green"  delay={0.2}  />
            <StatCard label="Cancelled" value={stats?.cancelled || 0} icon={TrendingUp} color="orange" delay={0.3} />
          </>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="style={{ color: 'var(--text-primary)' }} font-semibold text-sm uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Search,   label: 'Find a Doctor',  desc: 'Browse specialists',  path: '/patient/search',       gradient: 'from-violet-600 to-purple-600' },
            { icon: Calendar, label: 'My Appointments',desc: 'View & manage',       path: '/patient/appointments', gradient: 'from-blue-600 to-cyan-600'     },
            { icon: Heart,    label: 'Health History',  desc: 'Past visits',         path: '/patient/appointments', gradient: 'from-rose-600 to-pink-600'     },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              onClick={() => navigate(action.path)}
              className="glass-card p-4 text-left group hover:border-white/20
                          transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient}
                               flex items-center justify-center mb-3
                               group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-5 h-5 style={{ color: 'var(--text-primary)' }}" />
              </div>
              <p className="style={{ color: 'var(--text-primary)' }} font-semibold text-sm">{action.label}</p>
              <p className="style={{ color: 'var(--text-tertiary)' }} text-xs mt-0.5">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Upcoming Appointments ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="style={{ color: 'var(--text-primary)' }} font-semibold text-sm uppercase tracking-wider">
            Upcoming Appointments
          </h2>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="text-violet-400 hover:text-violet-300 text-xs font-medium
                        transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-11 h-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center
                             justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-violet-400" />
            </div>
            <p className="style={{ color: 'var(--text-primary)' }} font-semibold mb-1">No upcoming appointments</p>
            <p className="style={{ color: 'var(--text-tertiary)' }} text-sm mb-5">
              Book your first appointment to get started
            </p>
            <button onClick={() => navigate('/patient/search')} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Find a Doctor
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt, i) => (
              <AppointmentItem key={apt._id} apt={apt} index={i} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}