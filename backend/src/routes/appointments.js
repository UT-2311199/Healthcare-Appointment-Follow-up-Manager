const express = require('express');
const { body } = require('express-validator');
const {
  analyzeSymptoms,
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  submitPostVisit,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Analyze symptoms (pre-booking, any role)
router.post('/analyze-symptoms', analyzeSymptoms);

// Book appointment (patient only)
router.post(
  '/',
  restrictTo('patient'),
  [
    body('doctorId').notEmpty().withMessage('Doctor ID required'),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
    body('time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:mm'),
  ],
  validate,
  bookAppointment
);

// Patient appointments list
router.get('/', restrictTo('patient'), getMyAppointments);

// Single appointment — all roles with ownership check
router.get('/:id', getAppointmentById);

// Cancel
router.patch('/:id/cancel', cancelAppointment);

// Reschedule
router.patch(
  '/:id/reschedule',
  restrictTo('patient', 'admin'),
  [
    body('newDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date'),
    body('newTime').matches(/^\d{2}:\d{2}$/).withMessage('Invalid time'),
  ],
  validate,
  rescheduleAppointment
);

// Post-visit notes (doctor only)
router.post(
  '/:id/post-visit',
  restrictTo('doctor'),
  [
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('notes').notEmpty().withMessage('Notes are required'),
  ],
  validate,
  submitPostVisit
);

module.exports = router;