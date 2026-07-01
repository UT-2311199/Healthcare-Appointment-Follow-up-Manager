require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');

const connectDB      = require('./src/config/db');
const errorHandler   = require('./src/middleware/errorHandler');
const { initScheduler } = require('./src/jobs/scheduler');

// Route imports
const authRoutes         = require('./src/routes/auth');
const appointmentRoutes  = require('./src/routes/appointments');
const doctorsRoutes      = require('./src/routes/doctors');
const patientRoutes      = require('./src/routes/patient');
const doctorRoutes       = require('./src/routes/doctor');
const adminRoutes        = require('./src/routes/admin');
const notificationRoutes = require('./src/routes/notifications');

const app = express();

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/doctors',       doctorsRoutes);
app.use('/api/patient',       patientRoutes);
app.use('/api/doctor',        doctorRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initScheduler();
});

module.exports = app;