const Appointment = require('../models/Appointment');
const SlotHold    = require('../models/SlotHold');
const User        = require('../models/User');
const ApiError    = require('../utils/ApiError');
const { generateTimeSlots } = require('../utils/generateSlots');

/**
 * Get available slots for a doctor on a given date
 */
const getAvailableSlots = async (doctorId, dateStr) => {
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') throw ApiError.notFound('Doctor not found');

  // Check working day
  const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  if (!doctor.workingDays.includes(dayName)) {
    return { slots: [], reason: 'Doctor does not work on this day' };
  }

  // Check leave
  if (doctor.leaveDays.includes(dateStr)) {
    return { slots: [], reason: 'Doctor is on leave this day' };
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(
    doctor.workingHours.start,
    doctor.workingHours.end,
    doctor.slotDuration
  );

  // Get booked slots
  const booked = await Appointment.find({
    doctor: doctorId,
    date:   dateStr,
    status: { $nin: ['CANCELLED', 'RESCHEDULED'] },
  }).select('time');

  const bookedTimes = new Set(booked.map((a) => a.time));

  // Get held slots (by other patients)
  const held = await SlotHold.find({
    doctor:    doctorId,
    date:      dateStr,
    expiresAt: { $gt: new Date() },
  }).select('time');

  const heldTimes = new Set(held.map((h) => h.time));

  const slots = allSlots.map((time) => ({
    time,
    booked: bookedTimes.has(time) || heldTimes.has(time),
  }));

  return { slots };
};

/**
 * Hold a slot temporarily (5 minutes) to prevent race conditions
 */
const holdSlot = async (doctorId, patientId, date, time) => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    await SlotHold.findOneAndUpdate(
      { doctor: doctorId, date, time },
      { patient: patientId, expiresAt },
      { upsert: true, new: true }
    );
    return true;
  } catch (err) {
    if (err.code === 11000) return false; // Already held by someone else
    throw err;
  }
};

/**
 * Release a slot hold
 */
const releaseHold = async (doctorId, date, time) => {
  await SlotHold.deleteOne({ doctor: doctorId, date, time });
};

/**
 * Check if a slot is available (for booking validation)
 */
const isSlotAvailable = async (doctorId, date, time) => {
  const existing = await Appointment.findOne({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ['CANCELLED', 'RESCHEDULED'] },
  });
  return !existing;
};

module.exports = { getAvailableSlots, holdSlot, releaseHold, isSlotAvailable };