import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Save, Plus, X } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [leaveDate, setLeaveDate] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    api.get('/doctor/profile')
      .then(({ data }) => {
        setProfile(data.doctor);
        // Populate form
        Object.entries(data.doctor).forEach(([k, v]) => setValue(k, v));
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async (data) => {
    setSaving(true);
    try {
      await api.put('/doctor/profile', data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addLeave = async () => {
    if (!leaveDate) return;
    try {
      await api.post('/doctor/leave', { date: leaveDate });
      setProfile((p) => ({ ...p, leaveDays: [...(p.leaveDays || []), leaveDate] }));
      setLeaveDate('');
      toast.success('Leave day added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeLeave = async (date) => {
    try {
      await api.delete(`/doctor/leave/${date}`);
      setProfile((p) => ({ ...p, leaveDays: p.leaveDays.filter((d) => d !== date) }));
      toast.success('Leave removed');
    } catch {
      toast.error('Failed to remove leave');
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" {...register('name')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              {...register('bio')}
              placeholder="Brief professional bio"
            />
          </div>
        </div>

        {/* Working Hours */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Working Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                className="input-field"
                {...register('workingHours.start')}
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                className="input-field"
                {...register('workingHours.end')}
              />
            </div>
          </div>
          <div>
            <label className="label">Slot Duration (minutes)</label>
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
                <label key={day} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    value={day}
                    {...register('workingDays')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Leave Management */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Leave Days</h2>
        <div className="flex gap-2">
          <input
            type="date"
            className="input-field flex-1"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
          />
          <button onClick={addLeave} className="btn-primary">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(profile?.leaveDays || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center">No leave days marked</p>
          ) : (
            profile.leaveDays.map((date) => (
              <div key={date} className="flex items-center justify-between bg-red-50
                                         border border-red-200 rounded-lg px-3 py-2">
                <span className="text-sm text-red-800">{date}</span>
                <button onClick={() => removeLeave(date)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}