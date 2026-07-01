import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Plus, X } from 'lucide-react';
import api                     from '../../api/axios';
import LoadingSpinner          from '../../components/common/LoadingSpinner';
import { formatDate }          from '../../utils/dateUtils';
import { APPOINTMENT_STATUS }  from '../../utils/constants';
import toast                   from 'react-hot-toast';

const FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.append('status', filter);
      const { data } = await api.get(`/appointments?${params.toString()}`);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Style helpers ──────────────────────────────────────────────
  const activeFilterStyle = {
    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    color:      '#ffffff',
    border:     '1px solid transparent',
    boxShadow:  '0 4px 12px rgba(124,58,237,0.3)',
  };

  const inactiveFilterStyle = {
    background: 'var(--bg-input)',
    color:      'var(--text-secondary)',
    border:     '1px solid var(--border-input)',
  };

  const statusColors = {
    CONFIRMED:   { color: 'var(--info-text)',    bg: 'var(--info-bg)'     },
    COMPLETED:   { color: 'var(--success-text)', bg: 'var(--success-bg)'  },
    CANCELLED:   { color: 'var(--error-text)',   bg: 'var(--error-bg)'    },
    PENDING:     { color: 'var(--warning-text)', bg: 'var(--warning-bg)'  },
    RESCHEDULED: { color: 'var(--text-accent)',  bg: 'var(--brand-light)' },
  };

  const urgencyColors = {
    High:   { color: 'var(--error-text)',   bg: 'var(--error-bg)',   icon: '🔴' },
    Medium: { color: 'var(--warning-text)', bg: 'var(--warning-bg)', icon: '🟡' },
    Low:    { color: 'var(--success-text)', bg: 'var(--success-bg)', icon: '🟢' },
  };

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/patient/search')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Book New
        </motion.button>
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <motion.button
              key={f}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-semibold
                         transition-all duration-200"
              style={isActive ? activeFilterStyle : inactiveFilterStyle}
            >
              {f === 'All'
                ? 'All'
                : APPOINTMENT_STATUS[f]?.label || f}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Content ── */}
      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-16 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center
                        mx-auto mb-4 text-3xl"
            style={{ background: 'var(--brand-light)' }}
          >
            📅
          </div>
          <p
            className="font-semibold text-lg mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            No appointments found
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {filter !== 'All'
              ? `No ${APPOINTMENT_STATUS[filter]?.label?.toLowerCase() || filter} appointments`
              : 'You have no appointments yet'}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/patient/search')}
            className="btn-primary mx-auto"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </motion.button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {appointments.map((apt, i) => {
              const status  = APPOINTMENT_STATUS[apt.status];
              const urgency = apt.preVisitSummary?.urgencyLevel;
              const sColor  = statusColors[apt.status] || statusColors.PENDING;
              const uColor  = urgency ? urgencyColors[urgency] : null;
              const canCancel =
                ['CONFIRMED', 'PENDING'].includes(apt.status);

              return (
                <motion.div
                  key={apt._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{   opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card-hover p-5 group"
                >
                  <div className="flex items-start gap-4">

                    {/* ── Doctor Avatar ── */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center
                                  text-white font-bold text-xl flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg,#0d9488,#06b6d4)',
                      }}
                    >
                      {apt.doctor?.name?.charAt(0) || 'D'}
                    </div>

                    {/* ── Info ── */}
                    <div className="flex-1 min-w-0">

                      {/* Doctor Name + Status */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Dr. {apt.doctor?.name || 'Unknown'}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--text-accent)' }}
                          >
                            {apt.doctor?.specialization || 'Specialist'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Urgency */}
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

                          {/* Status */}
                          <span
                            className="inline-flex items-center px-2.5 py-1
                                       rounded-full text-xs font-semibold"
                            style={{
                              color:      sColor.color,
                              background: sColor.bg,
                              border:     `1px solid ${sColor.color}33`,
                            }}
                          >
                            {status?.label || apt.status}
                          </span>
                        </div>
                      </div>

                      {/* Date + Time */}
                      <div className="flex items-center gap-4 mt-2.5">
                        <span
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {apt.date ? formatDate(apt.date) : 'N/A'}
                        </span>
                        <span
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {apt.time || 'N/A'}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      {apt.preVisitSummary?.chiefComplaint && (
                        <p
                          className="text-xs mt-2 line-clamp-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span style={{ color: 'var(--text-accent)' }}>
                            Chief Complaint:
                          </span>{' '}
                          {apt.preVisitSummary.chiefComplaint}
                        </p>
                      )}

                      {/* Post-visit available */}
                      {apt.postVisitSummary && (
                        <div
                          className="flex items-center gap-1.5 mt-2 text-xs font-medium"
                          style={{ color: 'var(--success-text)' }}
                        >
                          ✅ Visit summary available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div
                    className="flex items-center gap-2 mt-4 pt-4"
                    style={{ borderTop: '1px solid var(--border-primary)' }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/patient/appointments/${apt._id}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl
                                 text-sm font-medium transition-all flex-1
                                 justify-center"
                      style={{
                        background: 'var(--brand-light)',
                        color:      'var(--text-accent)',
                        border:     '1px solid var(--border-accent)',
                      }}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    {canCancel && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCancel(apt._id)}
                        disabled={cancellingId === apt._id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl
                                   text-sm font-medium transition-all disabled:opacity-50"
                        style={{
                          background: 'var(--error-bg)',
                          color:      'var(--error-text)',
                          border:     '1px solid var(--error-border)',
                        }}
                      >
                        {cancellingId === apt._id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current
                                             border-t-transparent rounded-full animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}