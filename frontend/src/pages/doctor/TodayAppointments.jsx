import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { motion }              from 'framer-motion';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import api                     from '../../api/axios';
import LoadingSpinner          from '../../components/common/LoadingSpinner';
import { formatDate }          from '../../utils/dateUtils';
import { APPOINTMENT_STATUS, URGENCY_CONFIG } from '../../utils/constants';

const DATE_FILTERS   = ['today', 'week', 'all'];
const STATUS_FILTERS = ['All', 'CONFIRMED', 'COMPLETED', 'PENDING', 'CANCELLED'];

export default function TodayAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [dateFilter,   setDateFilter]   = useState('today');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter === 'today') {
        params.append('date', new Date().toISOString().split('T')[0]);
      }
      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      const { data } = await api.get(`/doctor/appointments?${params.toString()}`);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter button style helper ──────────────────────────────────
  const activeStyle = {
    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    color:      '#ffffff',
    border:     '1px solid transparent',
    boxShadow:  '0 4px 12px rgba(124,58,237,0.3)',
  };

  const inactiveStyle = {
    background: 'var(--bg-input)',
    color:      'var(--text-secondary)',
    border:     '1px solid var(--border-input)',
  };

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">Appointments</h1>
        <p className="page-subtitle">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
        </p>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 space-y-3"
      >
        {/* Date Filters */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Time Period
          </p>
          <div className="flex gap-2 flex-wrap">
            {DATE_FILTERS.map((d) => {
              const isActive = dateFilter === d;
              const label    =
                d === 'today' ? 'Today' :
                d === 'week'  ? 'This Week' : 'All Time';
              return (
                <motion.button
                  key={d}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDateFilter(d)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold
                             capitalize transition-all duration-200"
                  style={isActive ? activeStyle : inactiveStyle}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Status
          </p>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => {
              const isActive = statusFilter === s;
              return (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                             transition-all duration-200"
                  style={isActive ? activeStyle : inactiveStyle}
                >
                  {s === 'All'
                    ? 'All'
                    : APPOINTMENT_STATUS[s]?.label || s}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Content ── */}
      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-16 text-center"
        >
          <Calendar
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <p
            className="font-semibold text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            No appointments found
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Try changing the filters above
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, i) => {
            const status  = APPOINTMENT_STATUS[apt.status];
            const urgency = apt.preVisitSummary?.urgencyLevel;

            const statusColors = {
              CONFIRMED:   { color: 'var(--info-text)',    bg: 'var(--info-bg)'    },
              COMPLETED:   { color: 'var(--success-text)', bg: 'var(--success-bg)' },
              CANCELLED:   { color: 'var(--error-text)',   bg: 'var(--error-bg)'   },
              PENDING:     { color: 'var(--warning-text)', bg: 'var(--warning-bg)' },
              RESCHEDULED: { color: 'var(--text-accent)',  bg: 'var(--brand-light)' },
            };

            const urgencyColors = {
              High:   { color: 'var(--error-text)',   bg: 'var(--error-bg)',   icon: '🔴' },
              Medium: { color: 'var(--warning-text)', bg: 'var(--warning-bg)', icon: '🟡' },
              Low:    { color: 'var(--success-text)', bg: 'var(--success-bg)', icon: '🟢' },
            };

            const sColor = statusColors[apt.status]  || statusColors.PENDING;
            const uColor = urgency ? urgencyColors[urgency] : null;

            return (
              <motion.div
                key={apt._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/doctor/appointments/${apt._id}`)}
                className="glass-card-hover p-4 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left — Patient info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">

                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center
                                  text-white font-bold text-lg flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg,#0d9488,#06b6d4)',
                      }}
                    >
                      {apt.patient?.name?.charAt(0) || 'P'}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {apt.patient?.name || 'Unknown Patient'}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {apt.patient?.email || ''}
                      </p>

                      {/* Date + Time */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Calendar className="w-3 h-3" />
                          {apt.date ? formatDate(apt.date) : 'N/A'}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Clock className="w-3 h-3" />
                          {apt.time || 'N/A'}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      {apt.preVisitSummary?.chiefComplaint && (
                        <p
                          className="text-xs mt-1.5 line-clamp-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span style={{ color: 'var(--text-accent)' }}>
                            Chief Complaint:
                          </span>{' '}
                          {apt.preVisitSummary.chiefComplaint}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right — Status + Urgency + Arrow */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Status Badge */}
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full
                                 text-xs font-semibold"
                      style={{
                        color:      sColor.color,
                        background: sColor.bg,
                        border:     `1px solid ${sColor.color}33`,
                      }}
                    >
                      {status?.label || apt.status}
                    </span>

                    {/* Urgency Badge */}
                    {uColor && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5
                                   rounded-full text-xs font-medium"
                        style={{
                          color:      uColor.color,
                          background: uColor.bg,
                        }}
                      >
                        {uColor.icon} {urgency}
                      </span>
                    )}

                    {/* Arrow */}
                    <ChevronRight
                      className="w-4 h-4 mt-1 transition-transform
                                 group-hover:translate-x-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}