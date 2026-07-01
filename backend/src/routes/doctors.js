const express = require('express');
const {
  searchDoctors,
  getDoctorById,
  getDoctorSlots,
} = require('../controllers/doctorController');

const router = express.Router();

// All public — no auth required
router.get('/',           searchDoctors);   // GET /api/doctors
router.get('/:id/slots',  getDoctorSlots);  // GET /api/doctors/:id/slots?date=YYYY-MM-DD
router.get('/:id',        getDoctorById);   // GET /api/doctors/:id

module.exports = router;