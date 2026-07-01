import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PreVisitSummaryCard from '../../components/doctor/PreVisitSummaryCard';
import PostVisitForm from '../../components/doctor/PostVisitForm';
import { formatDate } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt,           setApt]           = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [showPostForm,  setShowPostForm]  = useState(false);
  const [aiGenerated,   setAiGenerated]   = useState(null);

  useEffect(() => {
    api.get(`/appointments/${id}`)
      .then(({ data }) => setApt(data.appointment))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePostVisit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/appointments/${id}/post-visit`, formData);
      setAiGenerated(data.postVisitSummary);
      setApt((prev) => ({ ...prev, status: 'COMPLETED', postVisitSummary: data.postVisitSummary }));
      setShowPostForm(false);
      toast.success('Post-visit notes submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading appointment..." />;
  if (!apt)    return <p className="text-center text-gray-500">Appointment not found</p>;

  const status = APPOINTMENT_STATUS[apt.status];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Patient: {apt.patient?.name}</h1>
          <p className="text-sm text-gray-500">
            {formatDate(apt.date)} at {apt.time}
          </p>
        </div>
        <span className={`badge ${status?.color}`}>{status?.label}</span>
      </div>

      {/* Patient Info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Patient Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name: </span>{apt.patient?.name}</div>
          <div><span className="text-gray-500">Email: </span>{apt.patient?.email}</div>
          <div><span className="text-gray-500">Phone: </span>{apt.patient?.phone || 'N/A'}</div>
        </div>
      </div>

      {/* Symptoms */}
      {apt.symptoms?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Reported Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {apt.symptoms.map((s) => (
              <span key={s} className="badge bg-gray-100 text-gray-700">{s}</span>
            ))}
          </div>
          {apt.notes && <p className="text-sm text-gray-600 mt-3">{apt.notes}</p>}
        </div>
      )}

      {/* AI Pre-visit Summary */}
      {apt.preVisitSummary && (
        <PreVisitSummaryCard summary={apt.preVisitSummary} />
      )}

      {/* Post-Visit - Already completed */}
      {apt.postVisitSummary ? (
        <div className="card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">Post-Visit Completed</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Diagnosis:</strong> {apt.postVisitSummary.diagnosis}
          </p>
          <p className="text-sm text-gray-700">
            {apt.postVisitSummary.patientFriendlySummary}
          </p>
        </div>
      ) : apt.status === 'CONFIRMED' || apt.status === 'PENDING' ? (
        <div className="card">
          {!showPostForm ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Complete the appointment and submit post-visit notes
              </p>
              <button
                onClick={() => setShowPostForm(true)}
                className="btn-primary mx-auto"
              >
                Submit Post-Visit Notes
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Post-Visit Notes</h3>
              <PostVisitForm onSubmit={handlePostVisit} loading={submitting} />
            </div>
          )}
        </div>
      ) : null}

      {/* AI Generated Summary Display */}
      {aiGenerated && (
        <div className="card bg-green-50 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">✅ Patient Summary Generated</h3>
          <p className="text-sm text-green-800">{aiGenerated.patientFriendlySummary}</p>
        </div>
      )}
    </div>
  );
}