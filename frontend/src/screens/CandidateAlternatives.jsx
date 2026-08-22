import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';
import StatusBadge from '../components/StatusBadge';

export default function CandidateAlternatives() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [overview, setOverview] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [comparePanelOpen, setComparePanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: p }, { data: r }, { data: o }] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/requirements`),
          api.get(`/projects/${id}/materials-overview`),
        ]);
        setProject(p.project);
        setRequirements(r.requirements);
        setOverview(o.overview);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSelect(materialId) {
    setSelected((prev) => (prev.includes(materialId) ? prev.filter((m) => m !== materialId) : [...prev, materialId]));
  }

  function toggleCompare(materialId) {
    setCompareIds((prev) => {
      if (prev.includes(materialId)) return prev.filter((m) => m !== materialId);
      if (prev.length >= 3) {
        toast.info('You can compare up to 3 materials at a time.');
        return prev;
      }
      return [...prev, materialId];
    });
  }

  function toleranceBadge(actual, target, lowerIsBetter = true) {
    if (target == null || target === '') return null;
    const meets = lowerIsBetter ? actual <= target : actual >= target;
    const marginal = lowerIsBetter ? actual <= target * 1.15 : actual >= target * 0.85;
    if (meets) return <StatusBadge status="pass" label="Meets target" />;
    if (marginal) return <StatusBadge status="conditional" label="Near target" />;
    return <StatusBadge status="fail" label="Below target" />;
  }

  async function handleGenerateTrials() {
    if (selected.length === 0) return;
    setStarting(true);
    try {
      await api.post(`/projects/${id}/run-optimisation`, { materialIds: selected });
      toast.success('Candidate trials generated and scored.');
      navigate(`/projects/${id}/recommendation`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading candidate materials…" />;

  const compareItems = overview.filter((o) => compareIds.includes(o.material.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {project && (
        <div className="mb-6">
          <ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Candidate Alternatives</h1>
          <p className="mt-1 text-sm text-ink-500">Review mono-material alternatives against your requirements and constraints.</p>
        </div>
        {requirements && (
          <div className="card !p-3 text-xs text-ink-600">
            <p className="font-semibold text-ink-800">Requirements summary</p>
            <p>OTR ≤ {requirements.otrTarget ?? '—'} · WVTR ≤ {requirements.wvtrTarget ?? '—'} · Recyclability ≥ {requirements.recyclabilityTargetPercent ?? '—'}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overview.map(({ material, manufacturingCheck, regulatoryCheck }) => {
          const isSelected = selected.includes(material.id);
          const isComparing = compareIds.includes(material.id);
          const dimmed = manufacturingCheck.status === 'fail' || regulatoryCheck.status === 'fail';

          return (
            <div
              key={material.id}
              className={`card flex flex-col gap-3 transition-shadow ${isSelected ? 'ring-2 ring-brand-500' : ''} ${dimmed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink-900">{material.name}</h3>
                  <p className="text-xs text-ink-500">{material.layerStructure}</p>
                </div>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  checked={isSelected}
                  onChange={() => toggleSelect(material.id)}
                  aria-label={`Select ${material.name} for trial generation`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-400">OTR</p>
                  <p className="font-semibold text-ink-800">{material.otr} cc/m²/day</p>
                  {toleranceBadge(material.otr, requirements?.otrTarget)}
                </div>
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-400">WVTR</p>
                  <p className="font-semibold text-ink-800">{material.wvtr} g/m²/day</p>
                  {toleranceBadge(material.wvtr, requirements?.wvtrTarget)}
                </div>
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-400">Seal temp</p>
                  <p className="font-semibold text-ink-800">{material.sealTempMinC}–{material.sealTempMaxC}°C</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-400">Trial cost</p>
                  <p className="font-semibold text-ink-800">£{material.baseTrialCostGbp.toLocaleString('en-GB')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={manufacturingCheck.status} label={`Manufacturing: ${manufacturingCheck.status === 'pass' ? 'Compatible' : manufacturingCheck.status === 'conditional' ? 'Conditional' : 'Incompatible'}`} />
                <StatusBadge status={regulatoryCheck.status === 'pass' ? 'compliant' : regulatoryCheck.status === 'conditional' ? 'conditional' : 'non-compliant'} label={`Regulatory: ${regulatoryCheck.status === 'pass' ? 'Compliant' : regulatoryCheck.status === 'conditional' ? 'Conditional' : 'Non-Compliant'}`} />
              </div>
              <p className="text-xs text-ink-500">{material.ukEprRecyclabilityPercent}% UK EPR recyclability</p>
              {(manufacturingCheck.status !== 'pass' || regulatoryCheck.status !== 'pass') && (
                <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                  {manufacturingCheck.status !== 'pass' ? manufacturingCheck.reason : regulatoryCheck.reason}
                </p>
              )}

              <button
                type="button"
                onClick={() => toggleCompare(material.id)}
                className={`btn-secondary mt-auto text-xs ${isComparing ? '!bg-brand-50 !text-brand-700 !ring-brand-300' : ''}`}
              >
                {isComparing ? '✓ In comparison' : 'Add to Comparison'}
              </button>
            </div>
          );
        })}
      </div>

      {compareIds.length > 0 && (
        <button
          type="button"
          onClick={() => setComparePanelOpen(true)}
          className="fixed bottom-24 right-6 z-30 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-raised hover:bg-ink-800"
        >
          Compare {compareIds.length} materials →
        </button>
      )}

      {comparePanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/40" onClick={() => setComparePanelOpen(false)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-raised" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">Side-by-side comparison</h2>
              <button type="button" onClick={() => setComparePanelOpen(false)} className="text-ink-400 hover:text-ink-700">✕</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-2 font-semibold text-ink-500">Attribute</th>
                  {compareItems.map((c) => (
                    <th key={c.material.id} className="py-2 px-2 font-semibold text-ink-800">{c.material.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="OTR (cc/m²/day)" items={compareItems} get={(c) => c.material.otr} best="min" />
                <CompareRow label="WVTR (g/m²/day)" items={compareItems} get={(c) => c.material.wvtr} best="min" />
                <CompareRow label="Seal temp (°C)" items={compareItems} get={(c) => `${c.material.sealTempMinC}–${c.material.sealTempMaxC}`} />
                <CompareRow label="UK EPR recyclability" items={compareItems} get={(c) => `${c.material.ukEprRecyclabilityPercent}%`} />
                <CompareRow label="Trial cost (£)" items={compareItems} get={(c) => c.material.baseTrialCostGbp} best="min" prefix="£" />
                <CompareRow label="Manufacturing" items={compareItems} get={(c) => c.manufacturingCheck.status} />
                <CompareRow label="Regulatory" items={compareItems} get={(c) => c.regulatoryCheck.status} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 mt-8 flex items-center justify-between rounded-xl bg-white p-4 shadow-raised ring-1 ring-ink-100">
        <span className="text-sm font-medium text-ink-600">{selected.length} of {overview.length} candidates selected</span>
        <button type="button" className="btn-primary" disabled={selected.length === 0 || starting} onClick={handleGenerateTrials}>
          {starting ? 'Generating…' : 'Generate Trials & Optimise →'}
        </button>
      </div>
    </div>
  );
}

function CompareRow({ label, items, get, best, prefix = '' }) {
  const values = items.map(get);
  const numeric = values.every((v) => typeof v === 'number');
  const bestValue = numeric && best === 'min' ? Math.min(...values) : numeric && best === 'max' ? Math.max(...values) : null;

  return (
    <tr className="border-b border-ink-50">
      <td className="py-2 pr-2 text-ink-500">{label}</td>
      {items.map((item, i) => (
        <td key={item.material.id} className={`py-2 px-2 ${bestValue !== null && values[i] === bestValue ? 'font-bold text-brand-700' : 'text-ink-700'}`}>
          {prefix}{values[i]}
        </td>
      ))}
    </tr>
  );
}
