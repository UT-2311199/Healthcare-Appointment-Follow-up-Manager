import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';

const STATUS_FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const LIMIT = 20;

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);

  useEffect(() => {
    fetchAll();
  }, [filter, dateFrom, dateTo, page]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page',  page);
      params.append('limit', LIMIT);
      if (filter !== 'All') params.append('status', filter);
      if (dateFrom)         params.append('from',   dateFrom);
      if (dateTo)           params.append('to',     dateTo);

      const { data } = await api.get(`/admin/appointments?${params.toString()}`);
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">All Appointments</h1>
        <p className="page-subtitle">{total} total records</p>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        {/* Status Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTERS.map((s) => {
            const isActive = filter === s;
            return (
              <motion.button
                key={s}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setFilter(s); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                    : 'var(--bg-input)',
                  color: isActive
                    ? '#ffffff'
                    : 'var(--text-secondary)',
                  border: isActive
                    ? '1px solid transparent'
                    : '1px solid var(--border-input)',
                  boxShadow: isActive
                    ? '0 4px 12px rgba(124,58,237,0.3)'
                    : 'none',
                }}
              >
                {s === 'All'
                  ? 'All'
                  : APPOINTMENT_STATUS[s]?.label || s}
              </motion.button>
            );
          })}
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Date Range:
            </span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="input-field text-sm"
            style={{ width: 'auto' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="input-field text-sm"
            style={{ width: 'auto' }}
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                color:      'var(--error-text)',
                background: 'var(--error-bg)',
                border:     '1px solid var(--error-border)',
              }}
            >
              Clear Dates
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Table ── */}
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
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            No appointments found
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Try adjusting your filters
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Patient', 'Doctor', 'Date & Time', 'Status', 'Urgency'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3.5 px-4 text-xs font-semibold
                                 uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, i) => {
                  const status  = APPOINTMENT_STATUS[apt.status];
                  const urgency = apt.preVisitSummary?.urgencyLevel;

                  const urgencyStyle = {
                    High:   { color: 'var(--error-text)',   bg: 'var(--error-bg)'   },
                    Medium: { color: 'var(--warning-text)', bg: 'var(--warning-bg)' },
                    Low:    { color: 'var(--success-text)', bg: 'var(--success-bg)' },
                  };

                  const statusStyle = {
                    CONFIRMED:   { color: 'var(--info-text)',    bg: 'var(--info-bg)'    },
                    COMPLETED:   { color: 'var(--success-text)', bg: 'var(--success-bg)' },
                    CANCELLED:   { color: 'var(--error-text)',   bg: 'var(--error-bg)'   },
                    PENDING:     { color: 'var(--warning-text)', bg: 'var(--warning-bg)' },
                    RESCHEDULED: { color: 'var(--text-accent)',  bg: 'var(--brand-light)' },
                  };

                  const sStyle = statusStyle[apt.status] || statusStyle.PENDING;
                  const uStyle = urgency ? urgencyStyle[urgency] : null;

                  return (
                    <motion.tr
                      key={apt._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid var(--border-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center
                                       text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                            }}
                          >
                            {apt.patient?.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p
                              className="font-medium text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {apt.patient?.name || 'N/A'}
                            </p>
                            <p
                              className="text-xs truncate max-w-32"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {apt.patient?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center
                                       text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg,#0d9488,#06b6d4)',
                            }}
                          >
                            {apt.doctor?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p
                              className="font-medium text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              Dr. {apt.doctor?.name || 'N/A'}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {apt.doctor?.specialization || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {apt.date ? formatDate(apt.date) : 'N/A'}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {apt.time || ''}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full
                                     text-xs font-semibold"
                          style={{
                            color:      sStyle.color,
                            background: sStyle.bg,
                            border:     `1px solid ${sStyle.color}33`,
                          }}
                        >
                          {status?.label || apt.status}
                        </span>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4">
                        {uStyle ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1
                                       rounded-full text-xs font-semibold"
                            style={{
                              color:      uStyle.color,
                              background: uStyle.bg,
                              border:     `1px solid ${uStyle.color}33`,
                            }}
                          >
                            {urgency === 'High'   && '🔴'}
                            {urgency === 'Medium' && '🟡'}
                            {urgency === 'Low'    && '🟢'}
                            {urgency}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {Math.min((page - 1) * LIMIT + 1, total)}
              </span>
              {' '}–{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {Math.min(page * LIMIT, total)}
              </span>
              {' '}of{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {total}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                           font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--bg-input)',
                  border:     '1px solid var(--border-input)',
                  color:      'var(--text-secondary)',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </motion.button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === page;
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(pageNum)}
                      className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: isCurrentPage
                          ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                          : 'var(--bg-input)',
                        color: isCurrentPage
                          ? '#ffffff'
                          : 'var(--text-secondary)',
                        border: isCurrentPage
                          ? '1px solid transparent'
                          : '1px solid var(--border-input)',
                      }}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                           font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--bg-input)',
                  border:     '1px solid var(--border-input)',
                  color:      'var(--text-secondary)',
                }}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}