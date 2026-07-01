import UrgencyBadge from '../common/UrgencyBadge';

export default function PreVisitSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-amber-900">AI Pre-Visit Summary</h3>
        <UrgencyBadge level={summary.urgencyLevel} />
      </div>
      <p className="text-sm text-amber-800 mb-2">
        <strong>Chief Complaint:</strong> {summary.chiefComplaint}
      </p>
      {summary.symptoms?.length > 0 && (
        <div className="mb-2">
          <p className="text-sm font-medium text-amber-800">Reported Symptoms:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {summary.symptoms.map((s) => (
              <span key={s} className="badge bg-amber-100 text-amber-700">{s}</span>
            ))}
          </div>
        </div>
      )}
      {summary.suggestedQuestions?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-amber-800 mb-1">Suggested Questions:</p>
          <ul className="list-disc list-inside space-y-1">
            {summary.suggestedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-amber-700">{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}