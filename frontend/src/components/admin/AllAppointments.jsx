import { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const LIMIT = 20;

  useEffect(() => { fetchAll(); }, [filter, dateFrom, dateTo, page]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filter !== 'All') params.append('status', filter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo)   params.append('to', dateTo);
      const { data } = await api.get(`/admin/appointments?${params}`);
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {Object.keys(APPOINTMENT_STATUS).concat(['All']).map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === s
                  ? 'bg-primary-600 style={{ color: 'var(--text-primary)' }}'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'All' ? 'All' : APPOINTMENT_STATUS[s]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <input
            type="date"
            className="input-field text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-gray-400 self-center">—</span>
          <input
            type="date"
            className="input-field text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Patient</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Doctor</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Date & Time</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden lg:table-cell">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const status = APPOINTMENT_STATUS[apt.status];
                return (
                  <tr key={apt._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{apt.patient?.name}</td>
                    <td className="py-3 px-3 text-gray-600">Dr. {apt.doctor?.name}</td>
                    <td className="py-3 px-3 text-gray-500">
                      {formatDate(apt.date)} • {apt.time}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`badge ${status?.color}`}>{status?.label}</span>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      {apt.preVisitSummary?.urgencyLevel || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * LIMIT >= total}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}