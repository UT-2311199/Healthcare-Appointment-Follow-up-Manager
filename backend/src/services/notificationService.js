const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    await Notification.create({ user: userId, type, title, message, data });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

const notifyAppointmentBooked = async ({ patientId, doctorId, appointment }) => {
  await Promise.all([
    createNotification({
      userId:  patientId,
      type:    'APPOINTMENT_BOOKED',
      title:   'Appointment Confirmed',
      message: `Your appointment on ${appointment.date} at ${appointment.time} is confirmed.`,
      data:    { appointmentId: appointment._id },
    }),
    createNotification({
      userId:  doctorId,
      type:    'APPOINTMENT_BOOKED',
      title:   'New Appointment',
      message: `New appointment booked for ${appointment.date} at ${appointment.time}.`,
      data:    { appointmentId: appointment._id },
    }),
  ]);
};

const notifyAppointmentCancelled = async ({ patientId, doctorId, appointment, reason }) => {
  await Promise.all([
    createNotification({
      userId:  patientId,
      type:    'APPOINTMENT_CANCELLED',
      title:   'Appointment Cancelled',
      message: `Your appointment on ${appointment.date} at ${appointment.time} was cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    }),
    createNotification({
      userId:  doctorId,
      type:    'APPOINTMENT_CANCELLED',
      title:   'Appointment Cancelled',
      message: `Appointment with patient on ${appointment.date} at ${appointment.time} was cancelled.`,
    }),
  ]);
};

const notifyPostVisitReady = async ({ patientId, doctorName, date }) => {
  await createNotification({
    userId:  patientId,
    type:    'POST_VISIT_READY',
    title:   'Visit Summary Ready',
    message: `Dr. ${doctorName} has completed your visit notes for ${date}. View your summary.`,
  });
};

const notifyDoctorOnLeave = async ({ patientId, doctorName, date }) => {
  await createNotification({
    userId:  patientId,
    type:    'DOCTOR_ON_LEAVE',
    title:   'Appointment Affected',
    message: `Dr. ${doctorName} is on leave on ${date}. Your appointment has been cancelled. Please rebook.`,
  });
};

module.exports = {
  createNotification,
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyPostVisitReady,
  notifyDoctorOnLeave,
};