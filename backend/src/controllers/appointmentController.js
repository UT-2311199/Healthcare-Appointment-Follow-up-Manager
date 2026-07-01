const mongoose          = require('mongoose');
const Appointment       = require('../models/Appointment');
const PreVisitSummary   = require('../models/PreVisitSummary');
const PostVisitSummary  = require('../models/PostVisitSummary');
const User              = require('../models/User');
const ApiError          = require('../utils/ApiError');
const asyncHandler      = require('../utils/asyncHandler');

const {
  generatePreVisitSummary,
  generatePostVisitSummary,
} = require('../services/llmService');

const { sendEmail }     = require('../services/emailService');

const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require('../services/calendarService');

const {
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyPostVisitReady,
} = require('../services/notificationService');

const {
  holdSlot,
  releaseHold,
  isSlotAvailable,
} = require('../services/slotService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/appointments/analyze-symptoms
// ─────────────────────────────────────────────────────────────────────────────
const analyzeSymptoms = asyncHandler(async (req, res) => {
  const { symptoms = [], duration, severity, additionalNotes } = req.body;

  const result = await generatePreVisitSummary({
    symptoms,
    duration,
    severity,
    additionalNotes,
  });

  res.json({
    success:            true,
    urgencyLevel:       result.urgencyLevel,
    chiefComplaint:     result.chiefComplaint,
    suggestedQuestions: result.suggestedQuestions,
    llmFailed:          result.llmFailed || false,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/appointments  — Book appointment
// ─────────────────────────────────────────────────────────────────────────────
const bookAppointment = asyncHandler(async (req, res) => {
  const {
    doctorId,
    date,
    time,
    symptoms    = [],
    notes       = '',
    severity    = 'Mild',
    duration    = '',
  } = req.body;

  const patientId = req.user._id;

  // 1. Validate doctor
  const doctor = await User.findOne({
    _id:  doctorId,
    role: 'doctor',
    $or:  [{ isActive: true }, { isActive: { $exists: false } }],
  });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  // 2. Check doctor leave
  if ((doctor.leaveDays || []).includes(date)) {
    throw ApiError.conflict('Doctor is on leave on this date. Please choose another date.');
  }

  // 3. Check working day
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
  });
  const workingDays = doctor.workingDays || ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  if (!workingDays.includes(dayName)) {
    throw ApiError.conflict(`Doctor does not work on ${dayName}.`);
  }

  // 4. Acquire slot hold (race condition protection)
  const held = await holdSlot(doctorId, patientId, date, time);
  if (!held) {
    throw ApiError.conflict(
      'This slot is being booked by another patient. Please try a different time.'
    );
  }

  try {
    // 5. Check slot availability
    const available = await isSlotAvailable(doctorId, date, time);
    if (!available) {
      throw ApiError.conflict('This slot is already booked. Please choose another time.');
    }

    // 6. Generate AI pre-visit summary (graceful on failure)
    const aiResult = await generatePreVisitSummary({
      symptoms,
      duration,
      severity,
      additionalNotes: notes,
    });

    // 7. Create appointment
    let appointment;
    try {
      appointment = await Appointment.create({
        patient:         patientId,
        doctor:          doctorId,
        date,
        time,
        symptoms,
        notes,
        severity,
        symptomDuration: duration,
        status:          'CONFIRMED',
      });
    } catch (err) {
      if (err.code === 11000) {
        throw ApiError.conflict('Slot was just taken. Please choose another time.');
      }
      throw err;
    }

    // 8. Save pre-visit summary
    const preVisit = await PreVisitSummary.create({
      appointment:        appointment._id,
      patient:            patientId,
      doctor:             doctorId,
      symptoms,
      symptomDuration:    duration,
      severity,
      additionalNotes:    notes,
      urgencyLevel:       aiResult.urgencyLevel,
      chiefComplaint:     aiResult.chiefComplaint,
      suggestedQuestions: aiResult.suggestedQuestions,
      rawLLMResponse:     aiResult.raw || '',
      llmFailed:          aiResult.llmFailed || false,
      failureReason:      aiResult.failureReason || '',
    });

    // 9. Link summary to appointment
    appointment.preVisitSummary = preVisit._id;
    await appointment.save();

    // 10. Create Google Calendar event (non-blocking)
    try {
      const calEventId = await createCalendarEvent({
        summary:         `Appointment: ${req.user.name} with Dr. ${doctor.name}`,
        description:     `Chief Complaint: ${aiResult.chiefComplaint}\nUrgency: ${aiResult.urgencyLevel}`,
        date,
        time,
        durationMinutes: doctor.slotDuration || 30,
        attendeeEmails:  [req.user.email, doctor.email],
      });
      if (calEventId) {
        appointment.calendarEventId = calEventId;
        await appointment.save();
      }
    } catch (calErr) {
      console.warn('Calendar event creation failed (non-blocking):', calErr.message);
    }

    // 11. Send emails (non-blocking — fire and forget)
    Promise.allSettled([
      sendEmail({
        to:       req.user.email,
        template: 'bookingConfirmation',
        data: {
          patientName:    req.user.name,
          doctorName:     doctor.name,
          specialization: doctor.specialization,
          date,
          time,
        },
      }),
      sendEmail({
        to:       doctor.email,
        template: 'doctorNewAppointment',
        data: {
          doctorName:     doctor.name,
          patientName:    req.user.name,
          date,
          time,
          chiefComplaint: aiResult.chiefComplaint,
          urgencyLevel:   aiResult.urgencyLevel,
        },
      }),
    ]);

    // 12. In-app notifications
    await notifyAppointmentBooked({
      patientId,
      doctorId,
      appointment: { _id: appointment._id, date, time },
    });

    // 13. Return populated appointment
    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor',  'name email specialization slotDuration')
      .populate('preVisitSummary');

    res.status(201).json({
      success:     true,
      message:     'Appointment booked successfully!',
      appointment: populated,
    });

  } finally {
    // Always release the slot hold
    await releaseHold(doctorId, date, time);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments  — Patient's appointments
// ─────────────────────────────────────────────────────────────────────────────
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, limit = 50, page = 1 } = req.query;

  const filter = { patient: req.user._id };
  if (status) {
    filter.status = { $in: status.split(',').map((s) => s.trim()) };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('doctor',          'name email specialization slotDuration workingHours')
      .populate('preVisitSummary',  'urgencyLevel chiefComplaint suggestedQuestions llmFailed')
      .populate('postVisitSummary', 'diagnosis patientFriendlySummary medications followUpDate followUpSteps medicationSchedule')
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  res.json({ success: true, appointments, total, page: Number(page) });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments/:id  — Single appointment
// ─────────────────────────────────────────────────────────────────────────────
const getAppointmentById = asyncHandler(async (req, res) => {
  const apt = await Appointment.findById(req.params.id)
    .populate('patient', 'name email phone dateOfBirth')
    .populate('doctor',  'name email specialization slotDuration workingHours phone')
    .populate('preVisitSummary')
    .populate('postVisitSummary');

  if (!apt) throw ApiError.notFound('Appointment not found');

  // Ownership check
  const patientId = apt.patient?._id?.toString();
  const doctorId  = apt.doctor?._id?.toString();
  const userId    = req.user._id.toString();

  if (
    patientId !== userId &&
    doctorId  !== userId &&
    req.user.role !== 'admin'
  ) {
    throw ApiError.forbidden('You do not have access to this appointment');
  }

  res.json({ success: true, appointment: apt });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
const cancelAppointment = asyncHandler(async (req, res) => {
  const { reason = '' } = req.body;

  const apt = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor',  'name email');

  if (!apt) throw ApiError.notFound('Appointment not found');

  // Permission
  const isPatient = apt.patient._id.toString() === req.user._id.toString();
  const isDoctor  = apt.doctor._id.toString()  === req.user._id.toString();
  const isAdmin   = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    throw ApiError.forbidden('You cannot cancel this appointment');
  }

  if (['CANCELLED', 'COMPLETED'].includes(apt.status)) {
    throw ApiError.badRequest(`Cannot cancel a ${apt.status.toLowerCase()} appointment`);
  }

  apt.status             = 'CANCELLED';
  apt.cancelledBy        = req.user.role;
  apt.cancellationReason = reason;
  apt.cancelledAt        = new Date();
  await apt.save();

  // Delete calendar event (non-blocking)
  if (apt.calendarEventId) {
    deleteCalendarEvent(apt.calendarEventId).catch((e) =>
      console.warn('Calendar delete failed:', e.message)
    );
  }

  // Notify both parties
  await notifyAppointmentCancelled({
    patientId: apt.patient._id,
    doctorId:  apt.doctor._id,
    appointment: apt,
    reason,
  });

  // Send cancellation emails
  Promise.allSettled([
    sendEmail({
      to:       apt.patient.email,
      template: 'cancellation',
      data: {
        recipientName: apt.patient.name,
        date:          apt.date,
        time:          apt.time,
        reason,
      },
    }),
    sendEmail({
      to:       apt.doctor.email,
      template: 'cancellation',
      data: {
        recipientName: `Dr. ${apt.doctor.name}`,
        date:          apt.date,
        time:          apt.time,
        reason,
      },
    }),
  ]);

  res.json({ success: true, message: 'Appointment cancelled successfully', appointment: apt });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/reschedule
// ─────────────────────────────────────────────────────────────────────────────
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { newDate, newTime } = req.body;

  if (!newDate || !newTime) {
    throw ApiError.badRequest('newDate and newTime are required');
  }

  const apt = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor',  'name email slotDuration');

  if (!apt) throw ApiError.notFound('Appointment not found');

  const isOwner =
    apt.patient._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';
  if (!isOwner) throw ApiError.forbidden('Cannot reschedule this appointment');

  if (['CANCELLED', 'COMPLETED'].includes(apt.status)) {
    throw ApiError.badRequest('Cannot reschedule a cancelled or completed appointment');
  }

  // Hold new slot
  const held = await holdSlot(apt.doctor._id, req.user._id, newDate, newTime);
  if (!held) {
    throw ApiError.conflict('New slot is being held by another patient. Try a different time.');
  }

  try {
    const available = await isSlotAvailable(apt.doctor._id, newDate, newTime);
    if (!available) {
      throw ApiError.conflict('New slot is already taken. Please choose another time.');
    }

    // Store previous values
    apt.previousDate = apt.date;
    apt.previousTime = apt.time;
    apt.date         = newDate;
    apt.time         = newTime;
    apt.status       = 'CONFIRMED';
    await apt.save();

    // Update calendar event (non-blocking)
    if (apt.calendarEventId) {
      updateCalendarEvent(apt.calendarEventId, {
        summary:         `Appointment: ${apt.patient.name} with Dr. ${apt.doctor.name}`,
        date:            newDate,
        time:            newTime,
        durationMinutes: apt.doctor.slotDuration || 30,
      }).catch((e) => console.warn('Calendar update failed:', e.message));
    }

    // Notify & email
    Promise.allSettled([
      sendEmail({
        to:       apt.patient.email,
        template: 'rescheduleConfirmation',
        data: {
          patientName: apt.patient.name,
          doctorName:  apt.doctor.name,
          oldDate:     apt.previousDate,
          oldTime:     apt.previousTime,
          newDate,
          newTime,
        },
      }),
    ]);

    res.json({ success: true, message: 'Appointment rescheduled successfully', appointment: apt });

  } finally {
    await releaseHold(apt.doctor._id, newDate, newTime);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/appointments/:id/post-visit  — Doctor submits notes
// ─────────────────────────────────────────────────────────────────────────────
const submitPostVisit = asyncHandler(async (req, res) => {
  const {
    diagnosis,
    notes,
    medications          = [],
    followUpDate         = '',
    followUpInstructions = '',
  } = req.body;

  if (!diagnosis) throw ApiError.badRequest('Diagnosis is required');
  if (!notes)     throw ApiError.badRequest('Clinical notes are required');

  const apt = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor',  'name email');

  if (!apt) throw ApiError.notFound('Appointment not found');

  if (apt.doctor._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the assigned doctor can submit post-visit notes');
  }

  if (apt.postVisitSummary) {
    throw ApiError.conflict('Post-visit notes already submitted for this appointment');
  }

  // Generate AI patient-friendly summary
  const aiResult = await generatePostVisitSummary({
    diagnosis,
    notes,
    medications,
    followUpDate,
    followUpInstructions,
  });

  // Save post-visit summary
  const postVisit = await PostVisitSummary.create({
    appointment:            apt._id,
    patient:                apt.patient._id,
    doctor:                 apt.doctor._id,
    diagnosis,
    clinicalNotes:          notes,
    medications,
    followUpDate,
    followUpInstructions,
    patientFriendlySummary: aiResult.patientFriendlySummary,
    medicationSchedule:     aiResult.medicationSchedule,
    followUpSteps:          aiResult.followUpSteps,
    rawLLMResponse:         aiResult.raw || '',
    llmFailed:              aiResult.llmFailed || false,
    failureReason:          aiResult.failureReason || '',
    remindersSent:          false,
  });

  // Update appointment status
  apt.postVisitSummary = postVisit._id;
  apt.status           = 'COMPLETED';
  await apt.save();

  // Notify patient
  await notifyPostVisitReady({
    patientId:  apt.patient._id,
    doctorName: apt.doctor.name,
    date:       apt.date,
  });

  // Email patient with summary
  sendEmail({
    to:       apt.patient.email,
    template: 'postVisitReady',
    data: {
      patientName: apt.patient.name,
      doctorName:  apt.doctor.name,
      diagnosis,
      summary:
        aiResult.patientFriendlySummary?.slice(0, 300) ||
        'Your visit summary is now available.',
    },
  });

  res.json({
    success:          true,
    message:          'Post-visit notes submitted and patient summary generated!',
    postVisitSummary: postVisit,
  });
});

module.exports = {
  analyzeSymptoms,
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  submitPostVisit,
};