# Healthcare Appointment & Follow-up Manager

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: React 18, Vite, TailwindCSS
- **AI**: OpenAI GPT-3.5-turbo
- **Email**: Nodemailer (Gmail / SMTP)
- **Calendar**: Google Calendar API (OAuth2)
- **Auth**: JWT (Role-based: patient / doctor / admin)
- **Jobs**: node-cron (reminders, email retry)

---

## Setup Guide

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key
- Gmail account (App Password enabled)
- Google Cloud project with Calendar API

### Installation

```bash
# Clone repo
git clone https://github.com/your/healthcare-app.git
cd healthcare-app

# Backend
cd backend && npm install
cp .env.example .env   # Fill in your values
npm run seed           # Create admin user
npm run dev

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env
npm run dev
```

---

## .env.example

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your_32_char_secret_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-3.5-turbo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=HealthCare+ <noreply@healthcare.com>
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=1//0xxxxx
ADMIN_EMAIL=admin@healthcare.com
ADMIN_PASSWORD=admin123
```

---

## API Documentation

### Auth
| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| POST | `/api/auth/register` | name, email, password, phone | Public |
| POST | `/api/auth/login` | email, password | Public |
| GET  | `/api/auth/me` | — | Any |

### Appointments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/appointments/analyze-symptoms` | Any (auth) |
| POST | `/api/appointments` | Patient |
| GET  | `/api/appointments` | Patient |
| GET  | `/api/appointments/:id` | Owner/Admin |
| PATCH| `/api/appointments/:id/cancel` | Owner/Admin |
| PATCH| `/api/appointments/:id/reschedule` | Patient/Admin |
| POST | `/api/appointments/:id/post-visit` | Doctor |

### Doctors (Public)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/doctors` | `?specialization=&search=` |
| GET | `/api/doctors/:id` | |
| GET | `/api/doctors/:id/slots` | `?date=YYYY-MM-DD` |

### Doctor Portal
| Method | Endpoint | |
|--------|----------|-|
| GET | `/api/doctor/profile` | |
| PUT | `/api/doctor/profile` | |
| POST | `/api/doctor/leave` | `{ date }` |
| DELETE | `/api/doctor/leave/:date` | |
| GET | `/api/doctor/appointments` | `?date=&status=` |
| GET | `/api/doctor/appointments/today` | |
| GET | `/api/doctor/stats` | |

### Admin
| Method | Endpoint | |
|--------|----------|-|
| GET | `/api/admin/stats` | |
| GET | `/api/admin/doctors` | |
| POST | `/api/admin/doctors` | Full doctor object |
| PUT | `/api/admin/doctors/:id` | |
| DELETE | `/api/admin/doctors/:id` | Soft delete |
| GET | `/api/admin/appointments` | |

---

## Database Schema

```
Users
├── _id, name, email, password (hashed), role
├── phone, dateOfBirth, isActive
└── [Doctor only]: specialization, qualifications, bio, fee,
    slotDuration, workingHours{start,end}, workingDays[], leaveDays[]

Appointments
├── patient (ref User), doctor (ref User)
├── date (YYYY-MM-DD), time (HH:mm), status
├── symptoms[], notes, symptomDuration, severity
├── preVisitSummary (ref), postVisitSummary (ref)
├── calendarEventId
└── UNIQUE INDEX: doctor + date + time (excludes CANCELLED/RESCHEDULED)

PreVisitSummary
├── appointment, patient, doctor
├── symptoms[], symptomDuration, severity, additionalNotes
├── urgencyLevel (Low/Medium/High), chiefComplaint
├── suggestedQuestions[], rawLLMResponse
└── llmFailed, failureReason

PostVisitSummary
├── appointment, patient, doctor
├── diagnosis, clinicalNotes, medications[]
├── followUpDate, followUpInstructions
├── patientFriendlySummary, medicationSchedule, followUpSteps
└── llmFailed, failureReason, remindersSent

SlotHold (TTL: 5min)
└── doctor, patient, date, time, expiresAt

Notifications
└── user, type, title, message, read, data

EmailLog
└── to, subject, template, status, attempts, maxRetries, lastError
```

---

## LLM Prompts

### Pre-Visit Prompt
```
Analyse these symptoms and return a JSON object with exactly these fields:
- urgencyLevel: one of "Low", "Medium", or "High"
- chiefComplaint: a concise one-line summary of the main complaint
- suggestedQuestions: an array of exactly 3 questions the doctor should ask

Symptom details:
- Symptoms: {symptomList}
- Duration: {duration}
- Severity: {severity}

Respond ONLY with valid JSON.
```

### Post-Visit Prompt
```
Convert these clinical notes into a patient-friendly summary.
Return a JSON object with:
- patientFriendlySummary: warm, easy-to-understand explanation (2-3 paragraphs)
- medicationSchedule: clear medication schedule
- followUpSteps: what the patient should do next

Clinical Notes: {notes}
Diagnosis: {diagnosis}
Medications: {medicationList}

Respond ONLY with valid JSON. Use simple language.
```

---

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web Application)
4. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Get refresh token using OAuth 2.0 Playground:
   - Scope: `https://www.googleapis.com/auth/calendar`
   - Exchange auth code → copy **refresh token**
6. Add all values to `.env`

---

## System Design (800 words)

### Double-Booking Prevention
The system uses a **three-layer defence** against double booking:

**Layer 1 — Slot Hold (Redis-style via MongoDB TTL)**
When a patient begins checkout, a `SlotHold` document is created with a 5-minute TTL using MongoDB's `expireAfterSeconds` index. This document carries a unique compound index on `{doctor, date, time}`. Any concurrent request for the same slot hits a duplicate key error immediately and returns a friendly "slot is being held" message. The hold is released either when booking completes or when the TTL expires.

**Layer 2 — Application-Level Check**
Before inserting an appointment, the service queries for any non-cancelled/non-rescheduled appointment with the same `{doctor, date, time}` tuple. This provides an explicit pre-check that gives a clear error message before hitting the database constraint.

**Layer 3 — MongoDB Unique Index**
The `Appointment` collection has a partial unique index on `{doctor, date, time}` with `partialFilterExpression: { status: { $nin: ['CANCELLED', 'RESCHEDULED'] } }`. This is the absolute last line of defence — even if layers 1 and 2 are bypassed in a race condition, the database will reject the duplicate with a `code: 11000` error, which the error handler converts to a user-friendly 409 Conflict response.

### Doctor Leave Conflict Handling
When an admin or doctor marks a leave day, the system:
1. Queries all non-cancelled appointments for that doctor on that date
2. Iterates and cancels each appointment, setting `cancelledBy: 'doctor'` and `cancellationReason: 'Doctor on leave'`
3. For each affected appointment, deletes the associated Google Calendar event
4. Sends an in-app notification via `notifyDoctorOnLeave()` to each patient
5. Sends a cancellation email to each patient with rebooking guidance
6. Finally marks the leave date in `doctor.leaveDays[]`

The slot availability check also reads `leaveDays` so new bookings on that day are rejected immediately.

### Slot Hold Mechanism
The `SlotHold` model serves as a distributed mutex. Key design decisions:
- **TTL Index** (`expireAfterSeconds: 0` with a field-level `expiresAt` date) ensures MongoDB automatically removes expired holds without a cleanup job
- **Upsert strategy** (`findOneAndUpdate` with `upsert: true`) means a patient refreshing their page doesn't create duplicate holds — it just renews the hold
- **Always-release pattern** — the hold release (`releaseHold()`) is called inside a `finally` block, guaranteeing it runs even if booking fails partway through
- **Conflict detection** — a `code: 11000` from the upsert means another patient holds the slot, returned as a 409 immediately

### Notification Failure Handling
All external integrations (email, calendar, LLM) are designed to be **non-blocking**:

**Email**: Every email attempt creates an `EmailLog` record first. On failure, the log is marked `failed` with `attempts` incremented. A `node-cron` job runs every 10 minutes, picks up failed logs where `attempts < maxRetries (3)`, and retries. This ensures transient SMTP failures don't permanently lose emails.

**Google Calendar**: All calendar operations are wrapped in try/catch with `return null` on failure. The appointment is saved successfully regardless. Calendar event IDs are stored when available but their absence doesn't break any flow.

**LLM (OpenAI)**: Both pre-visit and post-visit LLM calls have dedicated fallback functions. If the API is unavailable, the key is missing, or JSON parsing fails, the system falls back to rule-based summaries (e.g., severity → urgency mapping, symptom concatenation). The `llmFailed` flag is stored in the DB for observability. The booking flow continues normally — the LLM is an enhancement, not a dependency.

**In-App Notifications**: Notification creation is wrapped in its own try/catch and never throws to the caller, preventing notification failures from affecting the main transaction.