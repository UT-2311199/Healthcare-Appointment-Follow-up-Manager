const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role:  { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    isActive: { type: Boolean, default: true },

    // Doctor-specific fields
    specialization: { type: String },
    qualifications: [{ type: String }],
    bio:            { type: String },
    fee:            { type: Number, default: 0 },
    slotDuration:   { type: Number, default: 30 },     // minutes
    workingHours: {
      start: { type: String, default: '09:00' },
      end:   { type: String, default: '17:00' },
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    leaveDays: [{ type: String }],                     // "YYYY-MM-DD"

    // Google Calendar tokens per user
    googleCalendar: {
      accessToken:  { type: String, select: false },
      refreshToken: { type: String, select: false },
      calendarId:   { type: String },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields on toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleCalendar;
  return obj;
};

module.exports = mongoose.model('User', userSchema);