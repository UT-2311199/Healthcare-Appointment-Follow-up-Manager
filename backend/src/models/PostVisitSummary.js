const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  dosage:    { type: String },
  frequency: { type: String },
  duration:  { type: String },
  timing:    { type: String },
}, { _id: false });

const postVisitSummarySchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Appointment',
      required: true,
    },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Doctor inputs
    diagnosis:            { type: String, required: true },
    clinicalNotes:        { type: String, required: true },
    medications:          [medicationSchema],
    followUpDate:         { type: String },
    followUpInstructions: { type: String },

    // LLM outputs
    patientFriendlySummary: { type: String },
    medicationSchedule:     { type: String },
    followUpSteps:          { type: String },
    rawLLMResponse:         { type: String },

    // LLM metadata
    llmFailed:     { type: Boolean, default: false },
    failureReason: { type: String },

    // Medication reminders sent
    remindersSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PostVisitSummary', postVisitSummarySchema);