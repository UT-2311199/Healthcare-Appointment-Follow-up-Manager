require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const seed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    // Clear model cache
    Object.keys(mongoose.connection.models).forEach((key) => {
      delete mongoose.connection.models[key];
    });

    const { Schema } = mongoose;

    const UserSchema = new Schema(
      {
        name:           { type: String, required: true },
        email:          { type: String, required: true, unique: true, lowercase: true },
        password:       { type: String, required: true },
        role:           { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
        phone:          { type: String },
        isActive:       { type: Boolean, default: true },
        specialization: { type: String },
        qualifications: [{ type: String }],
        bio:            { type: String },
        fee:            { type: Number, default: 0 },
        slotDuration:   { type: Number, default: 30 },
        workingHours: {
          start: { type: String, default: '09:00' },
          end:   { type: String, default: '17:00' },
        },
        workingDays: {
          type:    [String],
          default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        leaveDays:   [{ type: String }],
        dateOfBirth: { type: Date },
      },
      { timestamps: true }
    );

    const User = mongoose.model('User', UserSchema);

    const hash = (pw) => bcrypt.hash(pw, 12);

    // ── Wipe existing users (clean slate) ─────────────────────────
    const deleted = await User.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing users`);

    // ── 1. Admin ───────────────────────────────────────────────────
    await User.create({
      name:     'Admin User',
      email:    'admin@healthcare.com',
      password: await hash('admin123'),
      role:     'admin',
      isActive: true,
    });
    console.log('✅ Admin:   admin@healthcare.com       / admin123');

    // ── 2. Doctors ─────────────────────────────────────────────────
    const doctorPassword = await hash('doctor123');

    const doctors = [
      {
        name:           'Demo Doctor',
        email:          'doctor@healthcare.com',   // ← the credential you wanted
        specialization: 'General Physician',
        bio:            'Demo doctor account for testing. General physician with broad expertise.',
        fee:            100,
        slotDuration:   30,
        qualifications: ['MBBS', 'FCPS'],
        workingHours:   { start: '09:00', end: '17:00' },
        workingDays:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        phone:          '+1000000001',
      },
      {
        name:           'Sarah Johnson',
        email:          'sarah@healthcare.com',
        specialization: 'Cardiologist',
        bio:            'Expert cardiologist with 15+ years of experience in heart disease management.',
        fee:            200,
        slotDuration:   30,
        qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
        workingHours:   { start: '09:00', end: '17:00' },
        workingDays:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        phone:          '+1000000002',
      },
      {
        name:           'Michael Chen',
        email:          'michael@healthcare.com',
        specialization: 'General Physician',
        bio:            'General physician focused on preventive care and chronic disease management.',
        fee:            100,
        slotDuration:   20,
        qualifications: ['MBBS', 'FCPS'],
        workingHours:   { start: '08:00', end: '16:00' },
        workingDays:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        phone:          '+1000000003',
      },
      {
        name:           'Emily Davis',
        email:          'emily@healthcare.com',
        specialization: 'Dermatologist',
        bio:            'Specialist in skin conditions, acne treatment, and cosmetic dermatology.',
        fee:            150,
        slotDuration:   30,
        qualifications: ['MBBS', 'MD Dermatology'],
        workingHours:   { start: '10:00', end: '18:00' },
        workingDays:    ['Monday', 'Wednesday', 'Friday'],
        phone:          '+1000000004',
      },
      {
        name:           'James Wilson',
        email:          'james@healthcare.com',
        specialization: 'Orthopedic',
        bio:            'Specialist in bone, joint, and muscle conditions with focus on sports injuries.',
        fee:            180,
        slotDuration:   30,
        qualifications: ['MBBS', 'MS Orthopedics'],
        workingHours:   { start: '09:00', end: '17:00' },
        workingDays:    ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        phone:          '+1000000005',
      },
      {
        name:           'Priya Patel',
        email:          'priya@healthcare.com',
        specialization: 'Pediatrician',
        bio:            'Dedicated pediatrician providing comprehensive care for children.',
        fee:            120,
        slotDuration:   20,
        qualifications: ['MBBS', 'MD Pediatrics', 'DCH'],
        workingHours:   { start: '09:00', end: '15:00' },
        workingDays:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        phone:          '+1000000006',
      },
      {
        name:           'Robert Brown',
        email:          'robert@healthcare.com',
        specialization: 'Neurologist',
        bio:            'Expert in brain and nervous system disorders including migraines and epilepsy.',
        fee:            250,
        slotDuration:   45,
        qualifications: ['MBBS', 'DM Neurology'],
        workingHours:   { start: '10:00', end: '16:00' },
        workingDays:    ['Tuesday', 'Wednesday', 'Thursday'],
        phone:          '+1000000007',
      },
    ];

    for (const doc of doctors) {
      await User.create({
        ...doc,
        password: doctorPassword,
        role:     'doctor',
        isActive: true,
        leaveDays: [],
      });
      console.log(`✅ Doctor:  ${doc.email.padEnd(30)} / doctor123  (${doc.specialization})`);
    }

    // ── 3. Patients ────────────────────────────────────────────────
    const patientPassword = await hash('patient123');

    const patients = [
      {
        name:  'John Patient',
        email: 'patient@healthcare.com',
        phone: '+1234567890',
      },
      {
        name:  'Jane Smith',
        email: 'jane@healthcare.com',
        phone: '+1234567891',
      },
    ];

    for (const pat of patients) {
      await User.create({
        ...pat,
        password: patientPassword,
        role:     'patient',
        isActive: true,
      });
      console.log(`✅ Patient: ${pat.email.padEnd(30)} / patient123`);
    }

    // ── Final summary ──────────────────────────────────────────────
    const counts = await Promise.all([
      User.countDocuments({ role: 'admin'   }),
      User.countDocuments({ role: 'doctor'  }),
      User.countDocuments({ role: 'patient' }),
    ]);

    console.log('\n🎉 Database seeded successfully!');
    console.log('════════════════════════════════════════════════════');
    console.log(`   Admins:   ${counts[0]}`);
    console.log(`   Doctors:  ${counts[1]}`);
    console.log(`   Patients: ${counts[2]}`);
    console.log('════════════════════════════════════════════════════');
    console.log('\n📋 ALL Demo Credentials:');
    console.log('────────────────────────────────────────────────────');
    console.log('ROLE     EMAIL                          PASSWORD');
    console.log('────────────────────────────────────────────────────');
    console.log('Admin    admin@healthcare.com           admin123');
    console.log('Doctor   doctor@healthcare.com          doctor123  ← main demo');
    console.log('Doctor   sarah@healthcare.com           doctor123');
    console.log('Doctor   michael@healthcare.com         doctor123');
    console.log('Doctor   emily@healthcare.com           doctor123');
    console.log('Doctor   james@healthcare.com           doctor123');
    console.log('Doctor   priya@healthcare.com           doctor123');
    console.log('Doctor   robert@healthcare.com          doctor123');
    console.log('Patient  patient@healthcare.com         patient123 ← main demo');
    console.log('Patient  jane@healthcare.com            patient123');
    console.log('────────────────────────────────────────────────────');

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.code === 11000) {
      console.error('   Duplicate key error — run again, it will clear existing data');
    }
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seed();