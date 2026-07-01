import { useState, useEffect }     from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Loader, Calendar, Clock, User } from 'lucide-react';
import api          from '../../api/axios';
import SlotPicker   from '../../components/patient/SlotPicker';
import SymptomForm  from '../../components/patient/SymptomForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import toast        from 'react-hot-toast';

const STEPS = [
  { label: 'Select Slot',       icon: '📅' },
  { label: 'Describe Symptoms', icon: '🩺' },
  { label: 'Confirm',           icon: '✅' },
];

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate     = useNavigate();

  const [step,         setStep]         = useState(0);
  const [doctor,       setDoctor]       = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [aiSummary,    setAiSummary]    = useState(null);
  const [loadingDoc,   setLoadingDoc]   = useState(true);
  const [loadingAI,    setLoadingAI]    = useState(false);
  const [booking,      setBooking]      = useState(false);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`)
      .then(({ data }) => setDoctor(data.doctor))
      .catch(() => toast.error('Failed to load doctor info'))
      .finally(() => setLoadingDoc(false));
  }, [doctorId]);

  // ── Step styles (no mixed className + style) ──────────────────
  const getStepCircleStyle = (i) => {
    if (i < step) {
      return {
        background: 'linear-gradient(135deg,#10b981,#059669)',
        color:      '#ffffff',
        border:     '1px solid transparent',
      };
    }
    if (i === step) {
      return {
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        color:      '#ffffff',
        border:     '1px solid transparent',
        boxShadow:  '0 4px 12px rgba(124,58,237,0.4)',
      };
    }
    return {
      background: 'var(--bg-input)',
      color:      'var(--text-muted)',
      border:     '1px solid var(--border-input)',
    };
  };

  const getStepLabelStyle = (i) => ({
    color: i === step
      ? 'var(--text-accent)'
      : i < step
      ? 'var(--success-text)'
      : 'var(--text-muted)',
    fontWeight: i === step ? 600 : 400,
  });

  const getConnectorStyle = (i) => ({
    flex:       1,
    height:     2,
    background: i < step
      ? 'linear-gradient(90deg,#10b981,#059669)'
      : 'var(--border-primary)',
    borderRadius: 2,
    transition:   'background 0.3s ease',
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handleSymptomSubmit = async (data) => {
    setLoadingAI(true);
    try {
      const res = await api.post('/appointments/analyze-symptoms', {
        symptoms:        data.symptoms || [],
        duration:        data.duration,
        severity:        data.severity,
        additionalNotes: data.additionalNotes,
      });
      setAiSummary({ ...res.data, rawSymptoms: data });
    } catch {
      toast.error('AI analysis unavailable — using fallback summary');
      setAiSummary({ failed: true, rawSymptoms: data });
    } finally {
      setLoadingAI(false);
      setStep(2);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId,
        date:     selectedSlot.date,
        time:     selectedSlot.time,
        symptoms: aiSummary?.rawSymptoms?.symptoms || [],
        notes:    aiSummary?.rawSymptoms?.additionalNotes || '',
        duration: aiSummary?.rawSymptoms?.duration || '',
        severity: aiSummary?.rawSymptoms?.severity || 'Mild',
      });
      toast.success('Appointment booked successfully! 🎉');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loadingDoc) return <LoadingSpinner text="Loading doctor info..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     transition-all"
          style={{
            background: 'var(--bg-input)',
            border:     '1px solid var(--border-input)',
          }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </motion.button>

        <div className="flex-1">
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Book Appointment
          </h1>
          {doctor && (
            <p
              className="text-sm mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Dr. {doctor.name} — {doctor.specialization}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Doctor Card ── */}
      {doctor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 flex items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center
                        text-white font-bold text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#06b6d4)' }}
          >
            {doctor.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Dr. {doctor.name}
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--text-accent)' }}
            >
              {doctor.specialization}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Clock className="w-3 h-3" />
                {doctor.slotDuration || 30} min slots
              </span>
              {doctor.fee > 0 && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ${doctor.fee} / visit
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Progress Steps ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 px-1"
      >
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1 last:flex-none">

            {/* Step Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={getStepCircleStyle(i)}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-sm font-bold flex-shrink-0"
                style={getStepCircleStyle(i)}
              >
                {i < step
                  ? <CheckCircle className="w-4 h-4" />
                  : <span>{i + 1}</span>
                }
              </motion.div>
              <span
                className="text-xs whitespace-nowrap hidden sm:block"
                style={getStepLabelStyle(i)}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div style={getConnectorStyle(i)} className="mb-5" />
            )}
          </div>
        ))}
      </motion.div>

      {/* ── Step Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0  }}
          exit={{   opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-card p-6"
        >

          {/* ── STEP 0: Select Slot ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  📅 Select a Time Slot
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Choose a convenient date and time
                </p>
              </div>

              <SlotPicker
                doctorId={doctorId}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
              />

              <motion.button
                whileHover={selectedSlot ? { scale: 1.01 } : {}}
                whileTap={selectedSlot   ? { scale: 0.99 } : {}}
                onClick={() => selectedSlot && setStep(1)}
                disabled={!selectedSlot}
                className="btn-primary w-full py-3"
                style={!selectedSlot ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Continue to Symptoms →
              </motion.button>
            </div>
          )}

          {/* ── STEP 1: Symptoms ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  🩺 Describe Your Symptoms
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  This helps the doctor prepare before your visit
                </p>
              </div>

              {loadingAI ? (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-violet-500/30
                               border-t-violet-500 rounded-full mx-auto mb-4"
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    🤖 AI is analyzing your symptoms...
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Generating pre-visit summary
                  </p>
                </div>
              ) : (
                <SymptomForm onSubmit={handleSymptomSubmit} loading={loadingAI} />
              )}

              <button
                onClick={() => setStep(0)}
                className="btn-secondary w-full justify-center"
              >
                ← Back to Slot Selection
              </button>
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ✅ Confirm Appointment
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Review your booking details before confirming
                </p>
              </div>

              {/* Booking Summary */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'var(--bg-card)',
                  border:     '1px solid var(--border-primary)',
                }}
              >
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Appointment Details
                </h3>

                {[
                  { label: 'Doctor',  value: `Dr. ${doctor?.name}`,       icon: '👨‍⚕️' },
                  { label: 'Date',    value: selectedSlot?.date || 'N/A', icon: '📅' },
                  { label: 'Time',    value: selectedSlot?.time || 'N/A', icon: '🕐' },
                  { label: 'Duration',value: `${doctor?.slotDuration || 30} minutes`, icon: '⏱️' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="text-sm flex items-center gap-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {item.icon} {item.label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              {aiSummary && !aiSummary.failed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: 'var(--brand-light)',
                    border:     '1px solid var(--border-accent)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      🤖 AI Pre-Visit Summary
                    </h3>
                    {aiSummary.urgencyLevel && (
                      <UrgencyBadge level={aiSummary.urgencyLevel} />
                    )}
                  </div>

                  {aiSummary.chiefComplaint && (
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Chief Complaint:
                      </span>{' '}
                      {aiSummary.chiefComplaint}
                    </p>
                  )}

                  {aiSummary.suggestedQuestions?.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Suggested Questions for Doctor:
                      </p>
                      <ul className="space-y-1.5">
                        {aiSummary.suggestedQuestions.map((q, qi) => (
                          <li
                            key={qi}
                            className="flex gap-2 text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span style={{ color: 'var(--text-accent)' }}>
                              {qi + 1}.
                            </span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* LLM failed notice */}
              {aiSummary?.failed && (
                <div
                  className="rounded-xl p-3 flex items-center gap-2"
                  style={{
                    background: 'var(--warning-bg)',
                    border:     '1px solid var(--warning-border)',
                  }}
                >
                  <span>⚠️</span>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--warning-text)' }}
                  >
                    AI summary unavailable. Your appointment will still be booked successfully.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 justify-center"
                >
                  ← Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBooking}
                  disabled={booking}
                  className="btn-primary flex-1 py-3"
                >
                  {booking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30
                                       border-t-white rounded-full animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking ✓'
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}