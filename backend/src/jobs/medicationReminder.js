const Appointment      = require('../models/Appointment');
const PostVisitSummary = require('../models/PostVisitSummary');
const { sendEmail }    = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// Send appointment reminders for TOMORROW's appointments
// Runs: daily at 8:00 AM via cron
// ─────────────────────────────────────────────────────────────────────────────
const sendAppointmentReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log(`[REMINDER] Checking appointments for ${tomorrowStr}`);

  const appointments = await Appointment.find({
    date:   tomorrowStr,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  })
    .populate('patient', 'name email')
    .populate('doctor',  'name email specialization');

  console.log(`[REMINDER] Found ${appointments.length} appointments to remind`);

  for (const apt of appointments) {
    try {
      // Email reminder to patient
      await sendEmail({
        to:       apt.patient.email,
        template: 'appointmentReminder',
        data: {
          patientName: apt.patient.name,
          doctorName:  apt.doctor.name,
          date:        apt.date,
          time:        apt.time,
          specialization: apt.doctor.specialization,
        },
      });

      // In-app notification
      await createNotification({
        userId:  apt.patient._id,
        type:    'APPOINTMENT_REMINDER',
        title:   '⏰ Appointment Tomorrow',
        message: `Reminder: You have an appointment with Dr. ${apt.doctor.name} tomorrow at ${apt.time}`,
        data:    { appointmentId: apt._id },
      });

      console.log(`[REMINDER] ✅ Sent reminder to ${apt.patient.email}`);
    } catch (err) {
      console.error(`[REMINDER] ❌ Failed for apt ${apt._id}:`, err.message);
    }
  }

  return appointments.length;
};

// ─────────────────────────────────────────────────────────────────────────────
// Send medication reminders based on prescription frequency
// Runs: every 6 hours via cron
//
// Frequency mapping:
//   "Once daily"        → remind once per day (6:00 AM)
//   "Twice daily"       → remind twice per day (8:00 AM, 8:00 PM)
//   "Three times daily" → remind 3x per day    (8AM, 2PM, 8PM)
//   "Every 6 hours"     → remind every 6 hours
//   "Every 8 hours"     → remind every 8 hours
//   "As needed"         → skip (no automatic reminder)
// ─────────────────────────────────────────────────────────────────────────────
const sendMedicationReminders = async () => {
  const now  = new Date();
  const hour = now.getHours(); // 0-23

  console.log(`[MED-REMINDER] Running at hour ${hour}`);

  // Find post-visit summaries with medications that need reminders
  // Only summaries from the last 30 days (active prescriptions)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const summaries = await PostVisitSummary.find({
    'medications.0': { $exists: true },   // has at least 1 medication
    createdAt:       { $gte: thirtyDaysAgo },
  })
    .populate('patient', 'name email')
    .lean();

  console.log(`[MED-REMINDER] Found ${summaries.length} active prescriptions`);

  let sentCount = 0;

  for (const summary of summaries) {
    if (!summary.patient?.email) continue;

    for (const med of summary.medications) {
      if (!med.name) continue;

      const shouldSend = shouldSendReminderNow(med.frequency, hour);

      if (shouldSend) {
        try {
          await sendEmail({
            to:       summary.patient.email,
            template: 'medicationReminder',
            data: {
              patientName:    summary.patient.name,
              medicationName: med.name,
              dosage:         med.dosage   || 'As prescribed',
              frequency:      med.frequency || 'As directed',
              duration:       med.duration  || '',
              timing:         getTimingLabel(hour),
            },
          });

          await createNotification({
            userId:  summary.patient._id,
            type:    'MEDICATION_REMINDER',
            title:   '💊 Medication Reminder',
            message: `Time to take ${med.name} — ${med.dosage || ''} (${med.frequency || 'as directed'})`,
            data:    { medication: med.name, dosage: med.dosage },
          });

          sentCount++;
          console.log(
            `[MED-REMINDER] ✅ Sent reminder for ${med.name} to ${summary.patient.email}`
          );
        } catch (err) {
          console.error(`[MED-REMINDER] ❌ Failed:`, err.message);
        }
      }
    }
  }

  console.log(`[MED-REMINDER] Sent ${sentCount} reminders total`);
  return sentCount;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if a medication reminder should be sent at this hour
 * based on the prescription frequency.
 */
const shouldSendReminderNow = (frequency = '', hour) => {
  const f = frequency.toLowerCase();

  if (f.includes('once daily'))        return hour === 8;
  if (f.includes('twice daily'))       return hour === 8 || hour === 20;
  if (f.includes('three times'))       return hour === 8 || hour === 14 || hour === 20;
  if (f.includes('every 6 hours'))     return [0, 6, 12, 18].includes(hour);
  if (f.includes('every 8 hours'))     return [8, 16, 0].includes(hour);
  if (f.includes('every 4 hours'))     return [8, 12, 16, 20].includes(hour);
  if (f.includes('four times'))        return [8, 12, 16, 20].includes(hour);
  if (f.includes('as needed'))         return false;
  if (f.includes('before bed'))        return hour === 21;
  if (f.includes('morning'))           return hour === 8;
  if (f.includes('night') || f.includes('evening')) return hour === 21;

  // Default: once daily at 8 AM
  return hour === 8;
};

const getTimingLabel = (hour) => {
  if (hour < 12) return 'Morning Dose';
  if (hour < 17) return 'Afternoon Dose';
  if (hour < 21) return 'Evening Dose';
  return 'Night Dose';
};

module.exports = { sendAppointmentReminders, sendMedicationReminders };