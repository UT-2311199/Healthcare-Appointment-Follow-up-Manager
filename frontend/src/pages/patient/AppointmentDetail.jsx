import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, Pill } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';

export default function PatientAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt,     setApt]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/appointments/${id}`)
      .then(({ data }) => setApt(data.appointment))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading appointment..." />;
  if (!apt) return <p className="text-center text-gray-500">Appointment not found</p>;

  const status = APPOINTMENT_STATUS[apt.status];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
        </div>
        <span className={`badge ${status?.color}`}>{status?.label}</span>
      </div>

      {/* Doctor Info */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center
                        justify-center text-primary-700 text-2xl font-bold">
          {apt.doctor?.name?.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold">Dr. {apt.doctor?.name}</h2>
          <p className="text-primary-600">{apt.doctor?.specialization}</p>
          <p className="text-sm text-gray-500 mt-1">{apt.doctor?.email}</p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Appointment Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium">{formatDate(apt.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-medium">{apt.time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Visit AI Summary */}
      {apt.preVisitSummary && (
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Pre-Visit AI Summary</h3>
            <UrgencyBadge level={apt.preVisitSummary.urgencyLevel} />
          </div>
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Chief Complaint:</span>{' '}
            {apt.preVisitSummary.chiefComplaint}
          </p>
          {apt.preVisitSummary.suggestedQuestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Suggested Questions:</p>
              <ul className="space-y-1">
                {apt.preVisitSummary.suggestedQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-primary-600 font-bold">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Post-Visit Summary */}
      {apt.postVisitSummary && (
        <div className="card border-l-4 border-green-500">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Post-Visit Summary
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {apt.postVisitSummary.patientFriendlySummary}
          </p>

          {apt.postVisitSummary.medications?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-primary-600" />
                Medications
              </h4>
              <div className="space-y-2">
                {apt.postVisitSummary.medications.map((med, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-800">{med.name}</p>
                    <p className="text-gray-500">{med.dosage} — {med.frequency}</p>
                    {med.duration && <p className="text-gray-500">Duration: {med.duration}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {apt.postVisitSummary.followUpSteps && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Follow-up Steps</h4>
              <p className="text-sm text-gray-600">{apt.postVisitSummary.followUpSteps}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}