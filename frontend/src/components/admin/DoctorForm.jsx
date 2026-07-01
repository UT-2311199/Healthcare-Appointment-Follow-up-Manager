import { useForm } from 'react-hook-form';
import { SPECIALIZATIONS } from '../../utils/constants';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function DoctorForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Full Name *</label>
          <input
            className="input-field"
            {...register('name', { required: 'Required' })}
            placeholder="Dr. John Smith"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Email *</label>
          <input
            type="email"
            className="input-field"
            {...register('email', { required: 'Required' })}
            placeholder="doctor@clinic.com"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Password {defaultValues ? '(leave blank to keep)' : '*'}</label>
          <input
            type="password"
            className="input-field"
            {...register('password', {
              required: defaultValues ? false : 'Required',
              minLength: { value: 6, message: 'Min 6 chars' },
            })}
            placeholder="••••••••"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Phone</label>
          <input className="input-field" {...register('phone')} placeholder="+1 234 567" />
        </div>
      </div>

      <div>
        <label className="label">Specialization *</label>
        <select className="input-field" {...register('specialization', { required: 'Required' })}>
          <option value="">Select specialization</option>
          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Qualifications (comma separated)</label>
        <input
          className="input-field"
          {...register('qualificationsStr')}
          placeholder="MBBS, MD, PhD"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Working Hours Start</label>
          <input type="time" className="input-field" {...register('workingHours.start')} />
        </div>
        <div>
          <label className="label">Working Hours End</label>
          <input type="time" className="input-field" {...register('workingHours.end')} />
        </div>
      </div>

      <div>
        <label className="label">Slot Duration</label>
        <select className="input-field" {...register('slotDuration')}>
          {[15, 20, 30, 45, 60].map((d) => (
            <option key={d} value={d}>{d} minutes</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Working Days</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" value={day} {...register('workingDays')} className="rounded" />
              <span className="text-sm text-gray-600">{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Consultation Fee ($)</label>
        <input type="number" className="input-field" {...register('fee')} placeholder="100" />
      </div>

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving...' : defaultValues ? 'Update Doctor' : 'Create Doctor'}
      </button>
    </form>
  );
}