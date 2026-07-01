import { useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Calendar } from 'lucide-react';

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => navigate(`/patient/book/${doctor._id}`)}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center
                        justify-center text-primary-700 text-xl font-bold flex-shrink-0">
          {doctor.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg">Dr. {doctor.name}</h3>
          <p className="text-primary-600 text-sm font-medium">{doctor.specialization}</p>

          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {doctor.slotDuration} min slots
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {doctor.workingHours?.start} - {doctor.workingHours?.end}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-2">
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">4.0</span>
          </div>
        </div>

        <button
          className="btn-primary text-sm flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); navigate(`/patient/book/${doctor._id}`); }}
        >
          Book
        </button>
      </div>

      {/* Specialization tags */}
      {doctor.qualifications?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {doctor.qualifications.slice(0, 3).map((q) => (
            <span key={q} className="badge bg-gray-100 text-gray-600">{q}</span>
          ))}
        </div>
      )}
    </div>
  );
}