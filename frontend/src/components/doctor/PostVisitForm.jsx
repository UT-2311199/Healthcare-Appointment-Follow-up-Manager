import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

export default function PostVisitForm({ onSubmit, loading }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      diagnosis: '',
      notes: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      followUpDate: '',
      followUpInstructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Diagnosis */}
      <div>
        <label className="label">Diagnosis *</label>
        <input
          className="input-field"
          placeholder="Primary diagnosis"
          {...register('diagnosis', { required: 'Diagnosis is required' })}
        />
        {errors.diagnosis && (
          <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>
        )}
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="label">Clinical Notes *</label>
        <textarea
          className="input-field resize-none"
          rows={5}
          placeholder="Detailed clinical observations, examination findings..."
          {...register('notes', { required: 'Notes are required' })}
        />
        {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Medications</label>
          <button
            type="button"
            onClick={() => append({ name: '', dosage: '', frequency: '', duration: '' })}
            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-3">
              <div>
                <input
                  className="input-field"
                  placeholder="Medicine name"
                  {...register(`medications.${index}.name`)}
                />
              </div>
              <div>
                <input
                  className="input-field"
                  placeholder="Dosage (e.g. 500mg)"
                  {...register(`medications.${index}.dosage`)}
                />
              </div>
              <div>
                <select className="input-field" {...register(`medications.${index}.frequency`)}>
                  <option value="">Frequency</option>
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Every 6 hours</option>
                  <option>Every 8 hours</option>
                  <option>As needed</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Duration"
                  {...register(`medications.${index}.duration`)}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Follow-up Date</label>
          <input
            type="date"
            className="input-field"
            {...register('followUpDate')}
          />
        </div>
        <div>
          <label className="label">Follow-up Instructions</label>
          <input
            className="input-field"
            placeholder="Special instructions"
            {...register('followUpInstructions')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        {loading ? 'Submitting & Generating Summary...' : 'Submit Notes & Generate Summary'}
      </button>
    </form>
  );
}