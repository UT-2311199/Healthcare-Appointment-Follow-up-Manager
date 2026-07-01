const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/patient/stats
const getPatientStats = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const [total, upcoming, completed, cancelled] = await Promise.all([
    Appointment.countDocuments({ patient: patientId }),
    Appointment.countDocuments({ patient: patientId, status: { $in: ['CONFIRMED', 'PENDING'] } }),
    Appointment.countDocuments({ patient: patientId, status: 'COMPLETED' }),
    Appointment.countDocuments({ patient: patientId, status: 'CANCELLED' }),
  ]);

  res.json({ success: true, total, upcoming, completed, cancelled });
});

module.exports = { getPatientStats };