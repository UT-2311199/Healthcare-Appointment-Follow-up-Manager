const express = require('express');
const {
  getAdminStats,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  adminAddLeaveDay,
  adminRemoveLeaveDay,
  getAllAppointments,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats',                          getAdminStats);
router.get('/doctors',                        getAllDoctors);
router.post('/doctors',                       createDoctor);
router.put('/doctors/:id',                    updateDoctor);
router.delete('/doctors/:id',                 deleteDoctor);
router.post('/doctors/:id/leave',             adminAddLeaveDay);
router.delete('/doctors/:id/leave/:date',     adminRemoveLeaveDay);
router.get('/appointments',                   getAllAppointments);

module.exports = router;