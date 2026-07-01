const User         = require('../models/User');
const Appointment  = require('../models/Appointment');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getAvailableSlots } = require('../services/slotService');

// ─── PUBLIC: Search / List Doctors ───────────────────────────────────────────
const searchDoctors = asyncHandler(async (req, res) => {
  const {
    specialization,
    search,
    page  = 1,
    limit = 50,
  } = req.query;

  // Build filter — always only doctors who are active
  const filter = { role: 'doctor', isActive: true };

  if (specialization && specialization.trim() !== '') {
    filter.specialization = { $regex: specialization.trim(), $options: 'i' };
  }

  if (search && search.trim() !== '') {
    filter.$or = [
      { name:           { $regex: search.trim(), $options: 'i' } },
      { specialization: { $regex: search.trim(), $options: 'i' } },
      { bio:            { $regex: search.trim(), $options: 'i' } },
    ];
  }

  console.log('🔍 Doctor search filter:', JSON.stringify(filter));

  const skip = (Number(page) - 1) * Number(limit);

  const [doctors, total] = await Promise.all([
    User.find(filter)
      .select(
        'name email specialization qualifications bio fee slotDuration ' +
        'workingHours workingDays leaveDays isActive createdAt'
      )
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),                          // plain JS objects — faster
    User.countDocuments(filter),
  ]);

  console.log(`✅ Found ${doctors.length} doctors (total: ${total})`);

  res.json({
    success: true,
    doctors,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─── PUBLIC: Single Doctor ────────────────────────────────────────────────────
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({
    _id:      req.params.id,
    role:     'doctor',
    isActive: true,
  })
    .select(
      'name email specialization qualifications bio fee slotDuration ' +
      'workingHours workingDays leaveDays'
    )
    .lean();

  if (!doctor) throw ApiError.notFound('Doctor not found');

  res.json({ success: true, doctor });
});

// ─── PUBLIC: Get Available Slots ──────────────────────────────────────────────
const getDoctorSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw ApiError.badRequest('Date query param is required (YYYY-MM-DD)');

  const result = await getAvailableSlots(req.params.id, date);
  res.json({ success: true, ...result });
});

// ═══ DOCTOR PORTAL (authenticated, role=doctor) ═══════════════════════════════

// GET /api/doctor/profile
const getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await User.findById(req.user._id)
    .select('-password')
    .lean();

  if (!doctor) throw ApiError.notFound('Profile not found');
  res.json({ success: true, doctor });
});

// PUT /api/doctor/profile
const updateDoctorProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'phone', 'bio',
    'workingHours', 'workingDays',
    'slotDuration', 'fee', 'qualifications',
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const doctor = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, doctor });
});

// POST /api/doctor/leave  — mark leave day
const addLeaveDay = asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date) throw ApiError.badRequest('date is required (YYYY-MM-DD)');

  const doctor = await User.findById(req.user._id);
  if (!doctor) throw ApiError.notFound('Doctor not found');

  if (doctor.leaveDays.includes(date)) {
    throw ApiError.conflict('Leave already marked for this date');
  }

  // Find affected appointments
  const affected = await Appointment.find({
    doctor: req.user._id,
    date,
    status: { $nin: ['CANCELLED', 'COMPLETED'] },
  }).populate('patient', 'name email');

  const { sendEmail }           = require('../services/emailService');
  const { notifyDoctorOnLeave } = require('../services/notificationService');
  const { deleteCalendarEvent } = require('../services/calendarService');

  let cancelledCount = 0;
  for (const apt of affected) {
    apt.status             = 'CANCELLED';
    apt.cancelledBy        = 'doctor';
    apt.cancellationReason = 'Doctor on leave';
    apt.cancelledAt        = new Date();
    await apt.save();
    cancelledCount++;

    if (apt.calendarEventId) {
      await deleteCalendarEvent(apt.calendarEventId);
    }

    await notifyDoctorOnLeave({
      patientId:  apt.patient._id,
      doctorName: doctor.name,
      date,
    });

    sendEmail({
      to:       apt.patient.email,
      template: 'cancellation',
      data: {
        recipientName: apt.patient.name,
        date,
        time:   apt.time,
        reason: `Dr. ${doctor.name} is on leave on ${date}. Please rebook your appointment.`,
      },
    });
  }

  doctor.leaveDays.push(date);
  await doctor.save();

  res.json({
    success: true,
    message: `Leave marked for ${date}. ${cancelledCount} appointment(s) cancelled and patients notified.`,
    affectedCount: cancelledCount,
  });
});

// DELETE /api/doctor/leave/:date
const removeLeaveDay = asyncHandler(async (req, res) => {
  const { date } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { leaveDays: date } });
  res.json({ success: true, message: `Leave removed for ${date}` });
});

// GET /api/doctor/appointments
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { date, status, page = 1, limit = 20 } = req.query;

  const filter = { doctor: req.user._id };
  if (date)   filter.date   = date;
  if (status) filter.status = { $in: status.split(',') };

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name email phone dateOfBirth')
      .populate('preVisitSummary')
      .populate('postVisitSummary')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  res.json({ success: true, appointments, total });
});

// GET /api/doctor/appointments/today
const getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const appointments = await Appointment.find({
    doctor: req.user._id,
    date:   today,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  })
    .populate('patient', 'name email phone')
    .populate('preVisitSummary')
    .sort({ time: 1 });

  res.json({ success: true, appointments });
});

// GET /api/doctor/stats
const getDoctorStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const [patientIds, todayCount, thisWeek, completed] = await Promise.all([
    Appointment.distinct('patient', { doctor: req.user._id }),
    Appointment.countDocuments({
      doctor: req.user._id,
      date:   today,
      status: { $nin: ['CANCELLED'] },
    }),
    Appointment.countDocuments({
      doctor: req.user._id,
      date:   { $gte: weekStartStr },
      status: { $nin: ['CANCELLED'] },
    }),
    Appointment.countDocuments({
      doctor: req.user._id,
      status: 'COMPLETED',
    }),
  ]);

  res.json({
    success:       true,
    totalPatients: patientIds.length,
    today:         todayCount,
    thisWeek,
    completed,
  });
});

module.exports = {
  searchDoctors,
  getDoctorById,
  getDoctorSlots,
  getDoctorProfile,
  updateDoctorProfile,
  addLeaveDay,
  removeLeaveDay,
  getDoctorAppointments,
  getTodayAppointments,
  getDoctorStats,
};