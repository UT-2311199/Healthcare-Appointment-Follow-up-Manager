const express = require('express');
const {
  getDoctorProfile,
  updateDoctorProfile,
  addLeaveDay,
  removeLeaveDay,
  getDoctorAppointments,
  getTodayAppointments,
  getDoctorStats,
} = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require doctor role
router.use(protect, restrictTo('doctor'));

router.get('/stats',              getDoctorStats);
router.get('/profile',            getDoctorProfile);
router.put('/profile',            updateDoctorProfile);
router.post('/leave',             addLeaveDay);
router.delete('/leave/:date',     removeLeaveDay);
router.get('/appointments/today', getTodayAppointments);  // must be before /:id
router.get('/appointments',       getDoctorAppointments);

module.exports = router;