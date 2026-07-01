const User        = require('../models/User');
const Appointment = require('../models/Appointment');
const ApiError    = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/stats
const getAdminStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [
    totalDoctors,
    totalPatients,
    totalAppointments,
    todayAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    User.countDocuments({ role: 'doctor',  isActive: true }),
    User.countDocuments({ role: 'patient', isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: today }),
    Appointment.countDocuments({ status: 'COMPLETED' }),
    Appointment.countDocuments({ status: 'CANCELLED' }),
  ]);

  res.json({
    success: true,
    totalDoctors,
    totalPatients,
    totalAppointments,
    todayAppointments,
    completedAppointments,
    cancelledAppointments,
  });
});

// GET /api/admin/doctors
const getAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, page = 1, limit = 20, isActive } = req.query;

  const filter = { role: 'doctor' };
  if (search) {
    filter.$or = [
      { name:           { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { email:          { $regex: search, $options: 'i' } },
    ];
  }
  if (specialization) filter.specialization = specialization;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [doctors, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, doctors, total });
});

// POST /api/admin/doctors — Create doctor
const createDoctor = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualifications,
    workingHours, workingDays,
    slotDuration, fee, bio,
  } = req.body;

  if (!name || !email || !password || !specialization) {
    throw ApiError.badRequest('name, email, password, and specialization are required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('A user with this email already exists');

  const doctor = await User.create({
    name,
    email:   email.trim().toLowerCase(),
    password,
    phone,
    role: 'doctor',        
    specialization,
    qualifications: qualifications || [],
    workingHours:   workingHours   || { start: '09:00', end: '17:00' },
    workingDays:    workingDays    || ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    slotDuration:   slotDuration   || 30,
    fee:            fee            || 0,
    bio:            bio            || '',
    leaveDays:      [],
    isActive:       true,
  });

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    doctor:  doctor.toJSON(),
  });
});

// PUT /api/admin/doctors/:id — Update doctor
const updateDoctor = asyncHandler(async (req, res) => {
  const {
    name, phone, specialization, qualifications,
    workingHours, workingDays, slotDuration,
    fee, bio, isActive, password,
  } = req.body;

  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  if (name)           doctor.name           = name;
  if (phone)          doctor.phone          = phone;
  if (specialization) doctor.specialization = specialization;
  if (qualifications) doctor.qualifications = qualifications;
  if (workingHours)   doctor.workingHours   = workingHours;
  if (workingDays)    doctor.workingDays    = workingDays;
  if (slotDuration)   doctor.slotDuration   = slotDuration;
  if (fee !== undefined) doctor.fee         = fee;
  if (bio !== undefined) doctor.bio         = bio;
  if (isActive !== undefined) doctor.isActive = isActive;
  if (password && password.trim().length >= 6) doctor.password = password;

  await doctor.save();

  res.json({
    success: true,
    message: 'Doctor updated successfully',
    doctor:  doctor.toJSON(),
  });
});

// DELETE /api/admin/doctors/:id — Soft delete
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  doctor.isActive = false;
  await doctor.save();

  res.json({ success: true, message: 'Doctor deactivated successfully' });
});

// POST /api/admin/doctors/:id/leave — Admin marks doctor leave
const adminAddLeaveDay = asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date) throw ApiError.badRequest('date is required (YYYY-MM-DD)');

  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  if (doctor.leaveDays.includes(date)) {
    throw ApiError.conflict(`Leave already marked for ${date}`);
  }

  // Find & cancel affected appointments
  const { sendEmail }           = require('../services/emailService');
  const { notifyDoctorOnLeave } = require('../services/notificationService');
  const { deleteCalendarEvent } = require('../services/calendarService');

  const affected = await Appointment.find({
    doctor: doctor._id,
    date,
    status: { $nin: ['CANCELLED', 'COMPLETED'] },
  }).populate('patient', 'name email');

  for (const apt of affected) {
    apt.status             = 'CANCELLED';
    apt.cancelledBy        = 'admin';
    apt.cancellationReason = `Dr. ${doctor.name} is on leave on ${date}`;
    apt.cancelledAt        = new Date();
    await apt.save();

    if (apt.calendarEventId) {
      deleteCalendarEvent(apt.calendarEventId).catch(() => {});
    }

    await notifyDoctorOnLeave({
      patientId:  apt.patient._id,
      doctorName: doctor.name,
      date,
    });

    sendEmail({
      to:       apt.patient.email,
      template: 'doctorOnLeave',
      data: {
        patientName: apt.patient.name,
        doctorName:  doctor.name,
        date,
        time:        apt.time,
      },
    });
  }

  doctor.leaveDays.push(date);
  await doctor.save();

  res.json({
    success:       true,
    message:       `Leave marked for ${date}. ${affected.length} appointment(s) cancelled.`,
    affectedCount: affected.length,
    leaveDays:     doctor.leaveDays,
  });
});

// DELETE /api/admin/doctors/:id/leave/:date — Remove leave day
const adminRemoveLeaveDay = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  doctor.leaveDays = doctor.leaveDays.filter((d) => d !== date);
  await doctor.save();

  res.json({
    success:   true,
    message:   `Leave removed for ${date}`,
    leaveDays: doctor.leaveDays,
  });
});

// GET /api/admin/appointments
const getAllAppointments = asyncHandler(async (req, res) => {
  const { status, from, to, doctorId, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status)   filter.status = { $in: status.split(',').map((s) => s.trim()) };
  if (doctorId) filter.doctor = doctorId;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to)   filter.date.$lte = to;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor',  'name email specialization')
      .populate('preVisitSummary', 'urgencyLevel chiefComplaint')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  res.json({ success: true, appointments, total });
});

module.exports = {
  getAdminStats,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  adminAddLeaveDay,
  adminRemoveLeaveDay,
  getAllAppointments,
};