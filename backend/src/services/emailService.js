const { getTransporter } = require('../config/email');
const EmailLog           = require('../models/EmailLog');

// ─────────────────────────────────────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────────────────────────────────────
const templates = {

  // 1. Booking Confirmation → Patient
  bookingConfirmation: (d) => ({
    subject: `✅ Appointment Confirmed with Dr. ${d.doctorName} on ${d.date}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">🏥 HealthCare+</h1>
        <p style="color:#bfdbfe;margin:6px 0 0">Appointment Management System</p>
      </div>
      <div style="padding:32px;background:#ffffff">
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="color:#15803d;font-weight:bold;margin:0;font-size:16px">✅ Your appointment is confirmed!</p>
        </div>
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">Your appointment has been successfully booked. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f9fafb">
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:40%">Doctor</td>
            <td style="padding:12px;font-weight:bold;border-bottom:1px solid #e5e7eb">Dr. ${d.doctorName}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb">Specialization</td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb">${d.specialization || 'N/A'}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb">Date</td>
            <td style="padding:12px;font-weight:bold;color:#2563eb;border-bottom:1px solid #e5e7eb">${d.date}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#6b7280">Time</td>
            <td style="padding:12px;font-weight:bold;color:#2563eb">${d.time}</td>
          </tr>
        </table>
        <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:16px">
          <p style="color:#1e40af;margin:0;font-size:14px">
            📋 <strong>Before your visit:</strong> Please arrive 10 minutes early and bring any relevant medical records or previous prescriptions.
          </p>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">HealthCare+ Appointment Manager | Do not reply to this email</p>
      </div>
    </div>`,
  }),

  // 2. New Appointment Alert → Doctor
  doctorNewAppointment: (d) => ({
    subject: `🩺 New Appointment: ${d.patientName} on ${d.date} at ${d.time}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">🩺 New Appointment Booked</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear Dr. <strong>${d.doctorName}</strong>,</p>
        <p style="color:#6b7280">A new appointment has been booked with you.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f9fafb">
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:40%">Patient</td>
            <td style="padding:12px;font-weight:bold;border-bottom:1px solid #e5e7eb">${d.patientName}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb">Date</td>
            <td style="padding:12px;font-weight:bold;color:#0d9488;border-bottom:1px solid #e5e7eb">${d.date}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb">Time</td>
            <td style="padding:12px;font-weight:bold;color:#0d9488;border-bottom:1px solid #e5e7eb">${d.time}</td>
          </tr>
          ${d.chiefComplaint ? `
          <tr>
            <td style="padding:12px;color:#6b7280;border-bottom:1px solid #e5e7eb">Chief Complaint</td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb">${d.chiefComplaint}</td>
          </tr>` : ''}
          ${d.urgencyLevel ? `
          <tr style="background:#f9fafb">
            <td style="padding:12px;color:#6b7280">Urgency Level</td>
            <td style="padding:12px;font-weight:bold;color:${
              d.urgencyLevel === 'High'   ? '#dc2626' :
              d.urgencyLevel === 'Medium' ? '#d97706' : '#16a34a'
            }">${
              d.urgencyLevel === 'High'   ? '🔴' :
              d.urgencyLevel === 'Medium' ? '🟡' : '🟢'
            } ${d.urgencyLevel}</td>
          </tr>` : ''}
        </table>
        <p style="color:#6b7280;font-size:14px">Log in to your dashboard to view the full pre-visit summary and patient notes.</p>
      </div>
    </div>`,
  }),

  // 3. Appointment Reminder → Patient (day before)
  appointmentReminder: (d) => ({
    subject: `⏰ Reminder: Appointment Tomorrow with Dr. ${d.doctorName} at ${d.time}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">⏰ Appointment Reminder</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">This is a friendly reminder about your appointment <strong>tomorrow</strong>.</p>
        <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;color:#374151"><strong>👨‍⚕️ Doctor:</strong> Dr. ${d.doctorName}</p>
          ${d.specialization ? `<p style="margin:4px 0;color:#6b7280"><strong>Specialty:</strong> ${d.specialization}</p>` : ''}
          <p style="margin:4px 0;color:#374151"><strong>📅 Date:</strong> ${d.date}</p>
          <p style="margin:4px 0;color:#374151"><strong>🕐 Time:</strong> ${d.time}</p>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px">
          <p style="color:#92400e;margin:0;font-size:14px">
            ⚠️ Please arrive 10 minutes early. If you need to cancel or reschedule, please do so at least 2 hours in advance.
          </p>
        </div>
      </div>
    </div>`,
  }),

  // 4. Cancellation → Patient or Doctor
  cancellation: (d) => ({
    subject: `❌ Appointment Cancelled — ${d.date} at ${d.time}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">Appointment Cancelled</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.recipientName}</strong>,</p>
        <p style="color:#6b7280">Your appointment has been cancelled.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;color:#374151"><strong>📅 Date:</strong> ${d.date}</p>
          <p style="margin:4px 0;color:#374151"><strong>🕐 Time:</strong> ${d.time}</p>
          ${d.reason ? `<p style="margin:8px 0 0;color:#dc2626"><strong>Reason:</strong> ${d.reason}</p>` : ''}
        </div>
        <p style="color:#6b7280">Please log in to rebook your appointment at a convenient time.</p>
      </div>
    </div>`,
  }),

  // 5. Reschedule Confirmation → Patient
  rescheduleConfirmation: (d) => ({
    subject: `📅 Appointment Rescheduled — Now on ${d.newDate} at ${d.newTime}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">📅 Appointment Rescheduled</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">Your appointment with Dr. <strong>${d.doctorName}</strong> has been rescheduled.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><th colspan="2" style="padding:8px;background:#f1f5f9;text-align:left;color:#64748b">Previous Schedule</th></tr>
          <tr>
            <td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Date</td>
            <td style="padding:10px;text-decoration:line-through;color:#9ca3af;border-bottom:1px solid #e5e7eb">${d.oldDate}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px;color:#6b7280">Time</td>
            <td style="padding:10px;text-decoration:line-through;color:#9ca3af">${d.oldTime}</td>
          </tr>
          <tr><th colspan="2" style="padding:8px;background:#f0fdf4;text-align:left;color:#15803d;border-top:8px solid #f1f5f9">New Schedule ✅</th></tr>
          <tr>
            <td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Date</td>
            <td style="padding:10px;font-weight:bold;color:#15803d;border-bottom:1px solid #e5e7eb">${d.newDate}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px;color:#6b7280">Time</td>
            <td style="padding:10px;font-weight:bold;color:#15803d">${d.newTime}</td>
          </tr>
        </table>
      </div>
    </div>`,
  }),

  // 6. Post-Visit Summary Ready → Patient
  postVisitReady: (d) => ({
    subject: `📋 Your Visit Summary is Ready — Dr. ${d.doctorName}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">✅ Visit Summary Ready</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">Dr. <strong>${d.doctorName}</strong> has completed your visit notes and generated your personalized summary.</p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#15803d;font-weight:bold">📋 Diagnosis: ${d.diagnosis}</p>
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.6">${d.summary}</p>
        </div>
        <div style="background:#eff6ff;border-radius:8px;padding:16px">
          <p style="color:#1e40af;margin:0;font-size:14px">
            💊 Log in to view your complete prescription, medication schedule, and follow-up instructions.
          </p>
        </div>
      </div>
    </div>`,
  }),

  // 7. Medication Reminder → Patient
  medicationReminder: (d) => ({
    subject: `💊 ${d.timing}: Time to take ${d.medicationName}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">💊 Medication Reminder</h1>
        <p style="color:#ddd6fe;margin:6px 0 0">${d.timing}</p>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">It's time to take your medication:</p>
        <div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#7c3aed">${d.medicationName}</p>
          <p style="margin:4px 0;color:#374151"><strong>Dosage:</strong> ${d.dosage}</p>
          <p style="margin:4px 0;color:#374151"><strong>Frequency:</strong> ${d.frequency}</p>
          ${d.duration ? `<p style="margin:4px 0;color:#6b7280"><strong>Duration:</strong> ${d.duration}</p>` : ''}
        </div>
        <p style="color:#9ca3af;font-size:13px">
          ⚠️ Do not skip doses. If you experience side effects, contact your doctor immediately.
        </p>
      </div>
    </div>`,
  }),

  // 8. Doctor Leave Notification → Patient
  doctorOnLeave: (d) => ({
    subject: `⚠️ Appointment Cancelled — Dr. ${d.doctorName} is on leave on ${d.date}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">⚠️ Appointment Affected</h1>
      </div>
      <div style="padding:32px;background:#ffffff">
        <p style="color:#374151">Dear <strong>${d.patientName}</strong>,</p>
        <p style="color:#6b7280">We regret to inform you that Dr. <strong>${d.doctorName}</strong> has been marked on leave on <strong>${d.date}</strong>. As a result, your appointment has been cancelled.</p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;color:#374151"><strong>Cancelled Appointment:</strong></p>
          <p style="margin:4px 0;color:#ea580c">📅 ${d.date} at ${d.time}</p>
        </div>
        <p style="color:#6b7280">Please log in to rebook your appointment with Dr. ${d.doctorName} on a different date, or choose another available doctor.</p>
        <p style="color:#9ca3af;font-size:13px">We apologize for any inconvenience caused.</p>
      </div>
    </div>`,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Send email with logging & graceful failure
// ─────────────────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, template, data }) => {
  if (!to) {
    console.warn('[EMAIL] No recipient provided, skipping');
    return;
  }

  const tmpl = templates[template]?.(data);
  if (!tmpl) {
    console.warn(`[EMAIL] Unknown template: "${template}"`);
    return;
  }

  // Create log entry
  let log;
  try {
    log = await EmailLog.create({
      to,
      subject:  tmpl.subject,
      template,
      payload:  data,
      status:   'pending',
    });
  } catch (logErr) {
    console.warn('[EMAIL] Could not create email log:', logErr.message);
  }

  // Dev mode — no real SMTP configured
  const isDev =
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER === 'youremail@gmail.com' ||
    process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log(`[EMAIL DEV] ✉️  To: ${to}`);
    console.log(`[EMAIL DEV]    Subject: ${tmpl.subject}`);
    if (log) {
      await EmailLog.findByIdAndUpdate(log._id, {
        status: 'sent',
        sentAt: new Date(),
        $inc:   { attempts: 1 },
      }).catch(() => {});
    }
    return;
  }

  // Real send
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `HealthCare+ <${process.env.EMAIL_USER}>`,
      to,
      subject: tmpl.subject,
      html:    tmpl.html,
    });

    if (log) {
      await EmailLog.findByIdAndUpdate(log._id, {
        status: 'sent',
        sentAt: new Date(),
        $inc:   { attempts: 1 },
      }).catch(() => {});
    }

    console.log(`[EMAIL] ✅ Sent to ${to}: ${tmpl.subject}`);
  } catch (err) {
    if (log) {
      await EmailLog.findByIdAndUpdate(log._id, {
        status:    'failed',
        lastError: err.message,
        $inc:      { attempts: 1 },
      }).catch(() => {});
    }
    console.error(`[EMAIL] ❌ Failed to ${to}:`, err.message);
    // Non-blocking — do not throw
  }
};

module.exports = { sendEmail };