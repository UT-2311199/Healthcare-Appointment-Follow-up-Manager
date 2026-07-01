import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/dateUtils';

export default function AppointmentCard({ appointment, onCancel }) {
  const navigate = useNavigate();
  const status = APPOINTMENT_STATUS[appointment.status] || APPOINTMENT_STATUS.PENDING;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Doctor Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center
                          justify-center text-primary-700 font-bold flex-shrink-0">
            {appointment.doctor?.name?.charAt(0) || 'D'}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">
                Dr. {appointment.doctor?.name}
              </h3>
              <span className={`badge ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-primary-600">{appointment.doctor?.specialization}</p>

            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(appointment.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.time}
              </span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate(`/patient/appointments/${appointment._id}`)}
          className="btn-secondary text-sm flex-1"
        >
          View Details
        </button>
        {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
          <button
            onClick={() => onCancel(appointment._id)}
            className="btn-danger text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}