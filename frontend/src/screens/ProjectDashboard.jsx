import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';

const RESULT_ICON = { Pass: '✅', Fail: '❌' };

export default function ProjectDashboard() {
  const { id } = useParams();
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${id}/dashboard`);
      setDashboard(data.dashboard);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // DASH-09: refresh whenever the screen regains focus, without a manual reload.
  useEffect(() => {
    load();
    function onFocus() { load(); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !dashboard) return <LoadingBlock label="Loading dashboard…" />;

  const { project, packagingSummary, candidatesOverview, currentRecommendation, keyConstraints, trialHistory } = dashboard;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">{project.name}</h1>
        <p className="mt-1 text-sm text-ink-500">{project.productType} · {project.transitionObjective}</p>
        <div className="mt-4"><ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Packaging Summary */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-bold text-ink-900">Packaging Summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Existing</p>
              <p className="mt-1 font-medium text-ink-800">{packagingSummary.existing?.material || '—'}</p>
              <p className="text-xs text-ink-500">OTR {packagingSummary.existing?.otr ?? '—'} · WVTR {packagingSummary.existing?.wvtr ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Target</p>
              <p className="mt-1 font-medium text-ink-800">{packagingSummary.target?.materialType || '—'}</p>
              <p className="text-xs text-ink-500">{packagingSummary.target?.recyclabilityPercent ?? '—'}% · {packagingSummary.target?.recyclingStream || '—'}</p>
            </div>
          </div>
        </div>

        {/* Candidates Overview */}
        <div className="card">
          <h2 className="text-sm font-bold text-ink-900">Candidates Overview</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Total evaluated" value={candidatesOverview.totalEvaluated} />
            <Row label="Compatible" value={candidatesOverview.compatibleCount} valueClass="text-brand-700" />
            <Row label="Excluded" value={candidatesOverview.excludedCount} valueClass="text-red-600" />
          </div>
          {candidatesOverview.totalEvaluated > 0 && (
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="bg-brand-500" style={{ width: `${(candidatesOverview.compatibleCount / candidatesOverview.totalEvaluated) * 100}%` }} />
              <div className="bg-red-400" style={{ width: `${(candidatesOverview.excludedCount / candidatesOverview.totalEvaluated) * 100}%` }} />
            </div>
          )}
        </div>

        {/* Current Recommendation */}
        <div className="card">
          <h2 className="text-sm font-bold text-ink-900">Current Recommendation</h2>
          {currentRecommendation ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold text-ink-800">{currentRecommendation.trialName}</p>
              <p className="text-ink-500">Score {currentRecommendation.compositeScore}/100 · £{currentRecommendation.estimatedCostGbp.toLocaleString('en-GB')}</p>
              <p className="text-xs text-ink-500">{currentRecommendation.rationaleExcerpt}</p>
              <Link to={`/projects/${id}/recommendation`} className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline">View Full Recommendation →</Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No recommendation generated yet.</p>
          )}
        </div>

        {/* Key Constraints */}
        <div className="card">
          <h2 className="text-sm font-bold text-ink-900">Key Constraints</h2>
          <div className="mt-3 space-y-2 text-xs text-ink-600">
            {keyConstraints.manufacturing ? (
              <p>
                <span className="font-semibold text-ink-800">Manufacturing:</span> {keyConstraints.manufacturing.equipmentTypes?.join(', ') || '—'} · {keyConstraints.manufacturing.temperatureRange[0]}–{keyConstraints.manufacturing.temperatureRange[1]}°C · {keyConstraints.manufacturing.lineSpeedRange[0]}–{keyConstraints.manufacturing.lineSpeedRange[1]} m/min ({keyConstraints.manufacturing.flexibility})
              </p>
            ) : <p>No manufacturing constraints defined.</p>}
            {keyConstraints.regulatory ? (
              <div className="flex flex-wrap gap-1.5">
                {keyConstraints.regulatory.ukEpr && <span className="badge-green">UK EPR</span>}
                {keyConstraints.regulatory.euPpwr && <span className="badge-green">EU PPWR</span>}
              </div>
            ) : <p>No regulatory frameworks selected.</p>}
          </div>
        </div>

        {/* Trial History */}
        <div className="card lg:col-span-3">
          <h2 className="text-sm font-bold text-ink-900">Trial History</h2>
          {trialHistory.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">No trials recorded yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs font-semibold uppercase text-ink-400">
                    <th className="py-2 pr-4">Trial name</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Performance</th>
                    <th className="py-2 pr-4">Manufacturing</th>
                    <th className="py-2 pr-4">Regulatory</th>
                    <th className="py-2 pr-4">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {trialHistory.map((h) => (
                    <tr key={h.id} className="border-b border-ink-50">
                      <td className="py-2 pr-4 font-medium text-ink-800">{h.trialName}</td>
                      <td className="py-2 pr-4 text-ink-500">{h.date}</td>
                      <td className="py-2 pr-4">{RESULT_ICON[h.performanceResult]} {h.performanceResult}</td>
                      <td className="py-2 pr-4">{RESULT_ICON[h.manufacturingResult]} {h.manufacturingResult}</td>
                      <td className="py-2 pr-4">{RESULT_ICON[h.regulatoryResult]} {h.regulatoryResult}</td>
                      <td className="py-2 pr-4 font-semibold">{h.overallResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-4 flex flex-wrap gap-3">
        <Link to={`/projects/${id}/requirements`} className="btn-secondary">Resume Requirements</Link>
        <Link to={`/projects/${id}/materials`} className="btn-secondary">Candidate Alternatives</Link>
        <Link to={`/projects/${id}/recommendation`} className="btn-secondary">View Recommendation</Link>
        <Link to={`/projects/${id}/trial-result`} className="btn-primary">Record Trial Result</Link>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-ink-800' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}
