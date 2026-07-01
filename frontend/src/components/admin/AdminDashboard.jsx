import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Stethoscope, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/appointments?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data.appointments || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { label: 'Total Doctors',       value: stats?.totalDoctors       || 0, icon: Stethoscope, color: 'bg-blue-50   text-blue-600'   },
    { label: 'Total Patients',      value: stats?.totalPatients      || 0, icon: Users,       color: 'bg-green-50  text-green-600'  },
    { label: 'Total Appointments',  value: stats?.totalAppointments  || 0, icon: Calendar,    color: 'bg-purple-50 text-purple-600' },
    { label: 'Today Appointments',  value: stats?.todayAppointments  || 0, icon: TrendingUp,  color: 'bg-teal-50   text-teal-600'   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 style={{ color: 'var(--text-primary)' }}">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-300 mt-1">Healthcare+ Management Portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center
                            justify-center mx-auto mb-3`}>
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/admin/doctors')}
          className="card hover:shadow-md transition-shadow text-left cursor-pointer"
        >
          <Stethoscope className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Manage Doctors</h3>
          <p className="text-sm text-gray-500">Add, edit, or remove doctors</p>
        </button>
        <button
          onClick={() => navigate('/admin/appointments')}
          className="card hover:shadow-md transition-shadow text-left cursor-pointer"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-900">All Appointments</h3>
          <p className="text-sm text-gray-500">View and manage bookings</p>
        </button>
      </div>

      {/* Recent Appointments */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Patient</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Doctor</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((apt) => {
                const status = APPOINTMENT_STATUS[apt.status];
                return (
                  <tr key={apt._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{apt.patient?.name}</td>
                    <td className="py-3 px-2 text-gray-600">Dr. {apt.doctor?.name}</td>
                    <td className="py-3 px-2 text-gray-500">
                      {formatDate(apt.date)} {apt.time}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${status?.color}`}>{status?.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}