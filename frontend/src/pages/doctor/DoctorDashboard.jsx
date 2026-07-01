import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS, URGENCY_CONFIG } from '../../utils/constants';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [today,   setToday]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, todayRes] = await Promise.all([
          api.get('/doctor/stats'),
          api.get('/doctor/appointments/today'),
        ]);
        setStats(statsRes.data);
        setToday(todayRes.data.appointments || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { label: 'Total Patients',  value: stats?.totalPatients || 0, icon: Users,        color: 'bg-blue-50   text-blue-600'   },
    { label: 'Today',           value: stats?.today || 0,         icon: Calendar,     color: 'bg-green-50  text-green-600'  },
    { label: 'This Week',       value: stats?.thisWeek || 0,      icon: Clock,        color: 'bg-purple-50 text-purple-600' },
    { label: 'Completed',       value: stats?.completed || 0,     icon: CheckCircle,  color: 'bg-teal-50   text-teal-600'   },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-2xl p-6 style={{ color: 'var(--text-primary)' }}">
        <h1 className="text-2xl font-bold">Good Morning, Dr. {user?.name}! 🩺</h1>
        <p className="text-green-100 mt-1">
          You have <strong>{stats?.today || 0}</strong> appointments today
        </p>
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

      {/* Today's Schedule */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
        {today.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No appointments today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {today.map((apt) => {
              const urgencyConfig = apt.preVisitSummary?.urgencyLevel
                ? URGENCY_CONFIG[apt.preVisitSummary.urgencyLevel]
                : null;
              const status = APPOINTMENT_STATUS[apt.status];
              return (
                <div
                  key={apt._id}
                  onClick={() => navigate(`/doctor/appointments/${apt._id}`)}
                  className="card hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary-600">{apt.time}</p>
                        <p className="text-xs text-gray-400">
                          {apt.doctor?.slotDuration || 30}min
                        </p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div>
                        <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                        <p className="text-sm text-gray-500">{apt.patient?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {urgencyConfig && (
                        <span className="text-lg">{urgencyConfig.icon}</span>
                      )}
                      <span className={`badge ${status?.color}`}>{status?.label}</span>
                    </div>
                  </div>

                  {apt.preVisitSummary?.chiefComplaint && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                      <strong>Chief Complaint:</strong> {apt.preVisitSummary.chiefComplaint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}