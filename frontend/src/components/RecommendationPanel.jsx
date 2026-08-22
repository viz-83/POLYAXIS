import { useState } from 'react';
import { Link } from 'react-router-dom';
import ScoreBar from './ScoreBar';
import StatusBadge from './StatusBadge';

const CONFIDENCE_STYLE = {
  High: 'badge-green',
  Medium: 'badge-amber',
  Low: 'badge-red',
};

export default function RecommendationPanel({ projectId, recommendation, evidenceBanner }) {
  const [excludedOpen, setExcludedOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  if (!recommendation || !recommendation.ranked || recommendation.ranked.length === 0) {
    return (
      <div className="card">
        <h2 className="text-base font-semibold text-ink-900">No feasible candidates</h2>
        <p className="mt-2 text-sm text-ink-600">{recommendation?.rationale || 'Every selected material failed a mandatory constraint. Adjust constraints or select additional materials.'}</p>
      </div>
    );
  }

  const primary = recommendation.ranked.find((t) => t.id === recommendation.primaryRecommendationId) || recommendation.ranked[0];
  const alternatives = recommendation.ranked.filter((t) => t.id !== primary.id).slice(0, 4);

  return (
    <div className="space-y-6">
      {evidenceBanner}

      {/* Primary Recommendation Card */}
      <div className="card border-2 border-brand-200 bg-gradient-to-br from-brand-50/60 to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Primary Recommendation</p>
            <h2 className="mt-1 text-xl font-bold text-ink-900">{primary.trialName}</h2>
            <p className="mt-1 text-sm text-ink-500">{primary.expectedOutcomeDescription}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-brand-700">{primary.compositeScore}<span className="text-base font-medium text-ink-400"> / 100</span></p>
            <span className={CONFIDENCE_STYLE[recommendation.confidence] || 'badge-slate'}>{recommendation.confidence} Confidence</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Estimated cost" value={`£${primary.estimatedCostGbp.toLocaleString('en-GB')}`} />
          <Stat label="Information gain" value={levelFor(primary.dimensionScores.informationGain)} />
          <Stat label="Temperature" value={`${primary.processParameters.temperatureC}°C`} />
          <Stat label="Line speed" value={`${primary.processParameters.lineSpeedMpm} m/min`} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Dimension scores</p>
            <ScoreBar dimensionScores={primary.dimensionScores} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Constraint status</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={primary.manufacturingCheck.status} label={`Manufacturing ${primary.manufacturingCheck.status === 'pass' ? '✓' : primary.manufacturingCheck.status === 'conditional' ? '~' : '✗'}`} />
              <StatusBadge status={primary.regulatoryCheck.status === 'pass' ? 'compliant' : primary.regulatoryCheck.status === 'conditional' ? 'conditional' : 'non-compliant'} label={`Regulatory ${primary.regulatoryCheck.status === 'pass' ? '✓' : primary.regulatoryCheck.status === 'conditional' ? '~' : '✗'}`} />
            </div>
            <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-relaxed text-ink-700 ring-1 ring-ink-100">
              {recommendation.rationale}
            </p>
          </div>
        </div>

        {projectId && (
          <div className="mt-5">
            <Link to={`/projects/${projectId}/trial-result`} state={{ trialId: primary.id }} className="btn-primary">
              Record Simulated Trial Result →
            </Link>
          </div>
        )}
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-ink-900">Alternative ranked trials</h3>
          <div className="mt-3 divide-y divide-ink-100">
            {alternatives.map((trial, idx) => (
              <div key={trial.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setExpandedRow(expandedRow === trial.id ? null : trial.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">#{idx + 2}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{trial.trialName}</p>
                      <p className="text-xs text-ink-500">£{trial.estimatedCostGbp.toLocaleString('en-GB')} · {trial.processParameters.temperatureC}°C · {trial.processParameters.lineSpeedMpm} m/min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={trial.manufacturingCheck.status} label="Mfg" />
                    <StatusBadge status={trial.regulatoryCheck.status === 'pass' ? 'compliant' : trial.regulatoryCheck.status === 'conditional' ? 'conditional' : 'non-compliant'} label="Reg" />
                    <span className="text-lg font-bold text-ink-800">{trial.compositeScore}</span>
                  </div>
                </button>
                {expandedRow === trial.id && (
                  <div className="mt-3 rounded-lg bg-ink-50 p-3">
                    <ScoreBar dimensionScores={trial.dimensionScores} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excluded */}
      {recommendation.excluded && recommendation.excluded.length > 0 && (
        <div className="card">
          <button type="button" onClick={() => setExcludedOpen(!excludedOpen)} className="flex w-full items-center justify-between text-left">
            <h3 className="text-sm font-bold text-ink-900">Excluded candidates ({recommendation.excluded.length})</h3>
            <span className="text-ink-400">{excludedOpen ? '▲' : '▼'}</span>
          </button>
          {excludedOpen && (
            <ul className="mt-3 space-y-2">
              {recommendation.excluded.map((ex, i) => (
                <li key={i} className="rounded-lg bg-red-50 p-3 text-sm">
                  <p className="font-semibold text-red-800">{ex.materialName}{ex.trialName ? ` — ${ex.trialName}` : ''}</p>
                  <p className="text-xs text-red-700">{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-bold text-ink-800">{value}</p>
    </div>
  );
}

function levelFor(score) {
  if (score >= 0.66) return 'High';
  if (score >= 0.33) return 'Medium';
  return 'Low';
}
