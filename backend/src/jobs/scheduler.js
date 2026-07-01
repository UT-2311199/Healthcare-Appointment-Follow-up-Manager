const cron = require('node-cron');

const initScheduler = () => {
  console.log('⏰ Background job scheduler initialized');

  // ── Appointment Reminders ──────────────────────────────────────
  // Every day at 8:00 AM — remind patients about tomorrow's appointments
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] ⏰ Running appointment reminder job...');
    try {
      const { sendAppointmentReminders } = require('./medicationReminder');
      const count = await sendAppointmentReminders();
      console.log(`[CRON] ✅ Sent ${count} appointment reminders`);
    } catch (err) {
      console.error('[CRON] ❌ Appointment reminder job failed:', err.message);
    }
  });

  // ── Medication Reminders ───────────────────────────────────────
  // Every hour — check if any medication needs to be reminded now
  cron.schedule('0 * * * *', async () => {
    const hour = new Date().getHours();
    // Only send during active hours: 6AM to 10PM
    if (hour < 6 || hour > 22) return;

    console.log(`[CRON] 💊 Running medication reminder job (hour: ${hour})...`);
    try {
      const { sendMedicationReminders } = require('./medicationReminder');
      const count = await sendMedicationReminders();
      if (count > 0) {
        console.log(`[CRON] ✅ Sent ${count} medication reminders`);
      }
    } catch (err) {
      console.error('[CRON] ❌ Medication reminder job failed:', err.message);
    }
  });

  // ── Email Retry ────────────────────────────────────────────────
  // Every 10 minutes — retry failed emails
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { retryFailedEmails } = require('./emailRetry');
      await retryFailedEmails();
    } catch (err) {
      console.error('[CRON] ❌ Email retry job failed:', err.message);
    }
  });

  console.log('📋 Scheduled jobs:');
  console.log('   • Appointment reminders  → Daily at 8:00 AM');
  console.log('   • Medication reminders   → Every hour (6AM–10PM)');
  console.log('   • Email retry            → Every 10 minutes');
};

module.exports = { initScheduler };