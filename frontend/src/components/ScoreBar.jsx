const LABELS = {
  informationGain: 'Information Gain',
  feasibility: 'Manufacturing Feasibility',
  uncertaintyReduction: 'Uncertainty Reduction',
  regulatory: 'Regulatory Compliance',
  cost: 'Cost (inverse)',
};

export default function ScoreBar({ dimensionScores }) {
  return (
    <div className="space-y-2.5">
      {Object.entries(dimensionScores).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-ink-600">
            <span>{LABELS[key] || key}</span>
            <span>{Math.round(value * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.round(value * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
