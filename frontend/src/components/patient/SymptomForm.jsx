import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

const SYMPTOM_OPTIONS = [
  'Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea',
  'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Vomiting',
  'Body Ache', 'Sore Throat', 'Runny Nose', 'Loss of Appetite',
];

export default function SymptomForm({ onSubmit, loading }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { symptoms: [], additionalNotes: '', duration: '', severity: 'Mild' },
  });

  const selectedSymptoms = watch('symptoms') || [];

  const toggleSymptom = (symptom) => {
    const current = selectedSymptoms;
    if (current.includes(symptom)) {
      setValue('symptoms', current.filter((s) => s !== symptom));
    } else {
      setValue('symptoms', [...current, symptom]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Common Symptoms */}
      <div>
        <label className="label">Select Symptoms</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                          ${selectedSymptoms.includes(s)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                          }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="label">Duration of Symptoms</label>
        <select className="input-field" {...register('duration', { required: true })}>
          <option value="">Select duration</option>
          <option>Less than a day</option>
          <option>1-3 days</option>
          <option>4-7 days</option>
          <option>1-2 weeks</option>
          <option>More than 2 weeks</option>
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="label">Severity</label>
        <div className="flex gap-3">
          {['Mild', 'Moderate', 'Severe'].map((level) => (
            <label key={level} className="flex-1">
              <input
                type="radio"
                value={level}
                className="sr-only"
                {...register('severity')}
              />
              <div className={`text-center py-2 rounded-lg border cursor-pointer transition-colors
                               ${watch('severity') === level
                                 ? 'bg-primary-600 text-white border-primary-600'
                                 : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                               }`}>
                {level}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="label">Additional Notes</label>
        <textarea
          className="input-field resize-none"
          rows={4}
          placeholder="Describe your symptoms in detail, any medications you're taking, allergies, etc."
          {...register('additionalNotes')}
        />
      </div>

      {/* Info Banner */}
      <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Your symptom information will be analyzed by AI to help the doctor prepare for your visit.
        </p>
      </div>

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Analyzing symptoms...' : 'Confirm Appointment'}
      </button>
    </form>
  );
}