const express = require('express');
const { getPatientStats } = require('../controllers/patientController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('patient'));
router.get('/stats', getPatientStats);

module.exports = router;