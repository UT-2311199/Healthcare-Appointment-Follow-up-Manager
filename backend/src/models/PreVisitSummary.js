const mongoose = require('mongoose');

const preVisitSummarySchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Appointment',
      required: true,
    },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Raw inputs
    symptoms:        [{ type: String }],
    symptomDuration: { type: String },
    severity:        { type: String },
    additionalNotes: { type: String },

    // LLM outputs
    urgencyLevel:       { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    chiefComplaint:     { type: String },
    suggestedQuestions: [{ type: String }],
    rawLLMResponse:     { type: String },

    // LLM metadata
    llmModel:   { type: String },
    llmFailed:  { type: Boolean, default: false },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PreVisitSummary', preVisitSummarySchema);