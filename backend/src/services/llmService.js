const OpenAI = require('openai');

let openaiClient = null;

const getClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/**
 * Generate pre-visit summary from patient symptoms
 * @param {Object} params
 * @returns {Object} { urgencyLevel, chiefComplaint, suggestedQuestions, raw }
 */
const generatePreVisitSummary = async ({ symptoms, duration, severity, additionalNotes }) => {
  const symptomText = [
    ...symptoms,
    additionalNotes ? `Additional: ${additionalNotes}` : '',
  ].filter(Boolean).join(', ');

  const prompt = `Analyse these symptoms and return a JSON object with exactly these fields:
- urgencyLevel: one of "Low", "Medium", or "High"
- chiefComplaint: a concise one-line summary of the main complaint
- suggestedQuestions: an array of exactly 3 questions the doctor should ask

Symptom details:
- Symptoms: ${symptomText}
- Duration: ${duration || 'Not specified'}
- Severity: ${severity || 'Not specified'}

Respond ONLY with valid JSON. No markdown, no explanation.`;

  const client = getClient();
  if (!client) {
    return buildFallbackPreVisit(symptoms, severity);
  }

  try {
    const response = await client.chat.completions.create({
      model:       process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens:  500,
    });

    const raw  = response.choices[0]?.message?.content?.trim();
    const json = JSON.parse(raw);

    return {
      urgencyLevel:       json.urgencyLevel       || 'Low',
      chiefComplaint:     json.chiefComplaint      || symptomText,
      suggestedQuestions: json.suggestedQuestions  || [],
      raw,
      llmFailed: false,
    };
  } catch (err) {
    console.error('LLM pre-visit failed:', err.message);
    return { ...buildFallbackPreVisit(symptoms, severity), llmFailed: true, failureReason: err.message };
  }
};

/**
 * Generate patient-friendly post-visit summary
 */
const generatePostVisitSummary = async ({ diagnosis, notes, medications, followUpDate, followUpInstructions }) => {
  const medText = medications
    .filter((m) => m.name)
    .map((m) => `${m.name} ${m.dosage} — ${m.frequency} for ${m.duration || 'as directed'}`)
    .join('\n');

  const prompt = `Convert these clinical notes into a patient-friendly summary. Return a JSON object with:
- patientFriendlySummary: a warm, easy-to-understand explanation of the diagnosis and treatment (2-3 paragraphs)
- medicationSchedule: a clear medication schedule the patient can follow
- followUpSteps: what the patient should do next

Clinical Notes:
Diagnosis: ${diagnosis}
Notes: ${notes}
Medications:
${medText || 'None prescribed'}
Follow-up Date: ${followUpDate || 'As needed'}
Follow-up Instructions: ${followUpInstructions || 'None'}

Respond ONLY with valid JSON. Use simple language, avoid medical jargon.`;

  const client = getClient();
  if (!client) {
    return buildFallbackPostVisit(diagnosis, medications);
  }

  try {
    const response = await client.chat.completions.create({
      model:       process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens:  800,
    });

    const raw  = response.choices[0]?.message?.content?.trim();
    const json = JSON.parse(raw);

    return {
      patientFriendlySummary: json.patientFriendlySummary || '',
      medicationSchedule:     json.medicationSchedule     || '',
      followUpSteps:          json.followUpSteps           || '',
      raw,
      llmFailed: false,
    };
  } catch (err) {
    console.error('LLM post-visit failed:', err.message);
    return { ...buildFallbackPostVisit(diagnosis, medications), llmFailed: true, failureReason: err.message };
  }
};

// ─── Graceful Fallbacks ───────────────────────────────────────────────────────

const buildFallbackPreVisit = (symptoms, severity) => ({
  urgencyLevel: severity === 'Severe' ? 'High' : severity === 'Moderate' ? 'Medium' : 'Low',
  chiefComplaint: symptoms.slice(0, 3).join(', ') || 'General consultation',
  suggestedQuestions: [
    'When did you first notice these symptoms?',
    'Have you taken any medications for this?',
    'Do you have any known allergies or chronic conditions?',
  ],
  llmFailed: false,
});

const buildFallbackPostVisit = (diagnosis, medications) => ({
  patientFriendlySummary: `You were diagnosed with ${diagnosis}. Please follow the prescribed treatment plan and medication schedule carefully. Contact your doctor if symptoms worsen.`,
  medicationSchedule: medications
    .filter((m) => m.name)
    .map((m) => `${m.name}: ${m.dosage}, ${m.frequency}`)
    .join('. ') || 'No medications prescribed.',
  followUpSteps: 'Follow up with your doctor as scheduled. Rest adequately and stay hydrated.',
  llmFailed: false,
});

module.exports = { generatePreVisitSummary, generatePostVisitSummary };