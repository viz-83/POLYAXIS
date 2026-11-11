import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import StatusBadge from '../components/StatusBadge';
import Section from '../components/Section';
import Tabs from '../components/Tabs';
import ActionBar from '../components/ActionBar';
import RequirementsSummary from '../components/RequirementsSummary';
import Icon from '../components/Icon';
import { ScatterPlot, WindowStrip, materialStatus } from '../components/charts';
import { STAGES, gbp } from '../utils/stages';

const LEGEND = [['#279a83', 'Ready'], ['#f5b83d', 'Conditional'], ['#f87171', 'Blocked']];

const reg = (status) => (status === 'pass' ? 'compliant' : status === 'conditional' ? 'conditional' : 'non-compliant');

/** S-04: green when the material meets the target, amber when within 15% above it, red when further off. */
function targetTone(actual, target) {
  if (target == null) return 'none';
  if (actual <= target) return 'ok';
  return actual <= target * 1.15 ? 'near' : 'miss';
}
const TONE_BG = { ok: 'bg-brand-50 text-brand-800', near: 'bg-accent-50 text-accent-800', miss: 'bg-red-50 text-red-700', none: 'bg-ink-50 text-ink-700' };

export default function CandidateAlternatives() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const stage = STAGES[2];

  const [requirements, setRequirements] = useState(null);
  const [manufacturing, setManufacturing] = useState(null);
  const [overview, setOverview] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [view, setView] = useState('map');
  const [windowKind, setWindowKind] = useState('temp');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: r }, { data: m }, { data: o }] = await Promise.all([
          api.get(`/projects/${id}/requirements`), api.get(`/projects/${id}/manufacturing`), api.get(`/projects/${id}/materials-overview`),
        ]);
        setRequirements(r.requirements);
        setManufacturing(m.manufacturing);
        setOverview(o.overview);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (mid) => setSelected((p) => (p.includes(mid) ? p.filter((x) => x !== mid) : [...p, mid]));
  function toggleCompare(mid) {
    setCompareIds((p) => {
      if (p.includes(mid)) return p.filter((x) => x !== mid);
      if (p.length >= 3) { toast.info('You can compare up to 3 materials at a time.'); return p; }
      return [...p, mid];
    });
  }

  const byId = useMemo(() => Object.fromEntries(overview.map((o) => [o.material.id, o])), [overview]);
  const readyIds = useMemo(() => overview.filter((o) => materialStatus(o) === 'ok').map((o) => o.material.id), [overview]);

  const windowRows = useMemo(() => overview.map((o) => (
    windowKind === 'temp'
      ? { id: o.material.id, label: o.material.name, from: o.material.processingTempMinC, to: o.material.processingTempMaxC, status: o.manufacturingCheck.dimensions.temperature.status }
      : { id: o.material.id, label: o.material.name, from: o.material.minLineSpeedMpm, to: o.material.maxLineSpeedMpm, status: o.manufacturingCheck.dimensions.lineSpeed.status }
  )), [overview, windowKind]);

  async function generate() {
    if (selected.length === 0) return;
    setStarting(true);
    try {
      await api.post(`/projects/${id}/run-optimisation`, { materialIds: selected });
      toast.success('Candidate trials generated and ranked.');
      navigate(`/projects/${id}/recommendation`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading the material library…" />;

  const info = hovered ? byId[hovered] : null;
  const compareItems = overview.filter((o) => compareIds.includes(o.material.id));
  const isTemp = windowKind === 'temp';
  const lineMin = isTemp ? manufacturing?.temperatureMinC : manufacturing?.lineSpeedMinMpm;
  const lineMax = isTemp ? manufacturing?.temperatureMaxC : manufacturing?.lineSpeedMaxMpm;
  const wVals = [...windowRows.flatMap((r) => [r.from, r.to]), lineMin, lineMax].filter((v) => v != null);
  const wMin = Math.floor((Math.min(...wVals) - 10) / 10) * 10;
  const wMax = Math.ceil((Math.max(...wVals) + 10) / 10) * 10;

  return (
    <div className="space-y-5">
      <StepHeader
        stage={stage} step={3} title="Map the material options"
        blurb="Closer to the bottom-left means a better barrier. Shortlist the candidates you want trial recommendations for."
        actions={<Tabs label="View" value={view} onChange={setView} tabs={[{ key: 'map', label: 'Barrier map', icon: 'target' }, { key: 'sheets', label: 'Spec sheets', icon: 'doc', count: overview.length }]} />}
      />

      <RequirementsSummary projectId={id} />

      {view === 'map' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Section
            title="Barrier map" hint="Click a bubble to shortlist it · size = trial cost" icon="target"
            actions={(
              <>
                <button type="button" className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100" onClick={() => setSelected(readyIds)} disabled={readyIds.length === 0}>Select all ready ({readyIds.length})</button>
                {selected.length > 0 && <button type="button" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800" onClick={() => setSelected([])}>Clear</button>}
              </>
            )}
          >
            <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              {LEGEND.map(([c, l]) => <li key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</li>)}
            </ul>
            <ScatterPlot items={overview} otrTarget={requirements?.otrTarget} wvtrTarget={requirements?.wvtrTarget} selected={selected} hovered={hovered} onToggle={toggleSelect} onHover={setHovered} />
            <div className="mt-1 min-h-[4.5rem] rounded-xl bg-brand-50/60 p-3.5 ring-1 ring-brand-100" aria-live="polite">
              {info ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-bold">{info.material.name}</p>
                    <p className="font-mono text-xs text-ink-500">OTR {info.material.otr} · WVTR {info.material.wvtr} · {info.material.ukEprRecyclabilityPercent}% recyclable · {gbp(info.material.baseTrialCostGbp)}</p>
                    {materialStatus(info) !== 'ok' && <p className="mt-1 text-xs text-accent-800">{info.manufacturingCheck.status !== 'pass' ? info.manufacturingCheck.reason : info.regulatoryCheck.reason}</p>}
                  </div>
                  <div className="flex gap-1.5"><StatusBadge status={info.manufacturingCheck.status} label="Line" /><StatusBadge status={reg(info.regulatoryCheck.status)} label="Rules" /></div>
                </div>
              ) : <p className="text-sm text-ink-500">Hover or focus a bubble to see its profile.</p>}
            </div>
          </Section>

          <Section
            title="Process windows" hint="Dashed band = your line" icon="factory"
            actions={(
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-100/80 p-0.5" role="tablist" aria-label="Window type">
                {[['temp', 'Temp'], ['speed', 'Speed']].map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={windowKind === k} onClick={() => setWindowKind(k)} className={`rounded-md px-3 py-1 text-xs font-bold ${windowKind === k ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500'}`}>{l}</button>
                ))}
              </div>
            )}
          >
            <div className="overflow-x-auto"><div className="min-w-[340px]">
              <WindowStrip compact scaleMin={wMin} scaleMax={wMax} unit={isTemp ? '°C' : 'm/min'} rows={windowRows} line={lineMin != null && lineMax != null ? { min: lineMin, max: lineMax, label: `${lineMin}–${lineMax}` } : null} />
            </div></div>
            <p className="mt-3 text-xs text-ink-500">A bar that leaves the band cannot run on your line.</p>
          </Section>
        </div>
      )}

      {view === 'sheets' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.map(({ material: m, manufacturingCheck: mc, regulatoryCheck: rc }) => {
            const isSel = selected.includes(m.id);
            const blocked = mc.status === 'fail' || rc.status === 'fail';
            return (
              <article key={m.id} className={`flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 transition-all ${isSel ? 'ring-2 ring-brand-500' : 'ring-brand-900/10'} ${blocked ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] font-semibold text-brand-600">{m.id}</p>
                    <h3 className="text-sm font-bold leading-snug">{m.name}</h3>
                  </div>
                  <button type="button" onClick={() => toggleSelect(m.id)} aria-pressed={isSel} aria-label={`${isSel ? 'Remove' : 'Add'} ${m.name} ${isSel ? 'from' : 'to'} shortlist`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isSel ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 hover:bg-brand-100 hover:text-brand-700'}`}>
                    <Icon name={isSel ? 'check' : 'plus'} className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </div>
                <p className="text-xs leading-snug text-ink-500">{m.layerStructure}</p>
                <dl className="grid grid-cols-2 gap-1.5">
                  {[['OTR', `${m.otr}`, 'cc/m²/day', targetTone(m.otr, requirements?.otrTarget)], ['WVTR', `${m.wvtr}`, 'g/m²/day', targetTone(m.wvtr, requirements?.wvtrTarget)]].map(([l, v, u, tone]) => (
                    <div key={l} className={`rounded-lg px-2.5 py-1.5 ${TONE_BG[tone]}`}>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{l}</dt>
                      <dd className="font-mono text-sm font-semibold">{v} <span className="text-[10px] font-medium opacity-70">{u}</span></dd>
                    </div>
                  ))}
                  <div className="rounded-lg bg-ink-50 px-2.5 py-1.5"><dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Seal window</dt><dd className="font-mono text-sm font-semibold">{m.sealTempMinC}–{m.sealTempMaxC}°C</dd></div>
                  <div className="rounded-lg bg-ink-50 px-2.5 py-1.5"><dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Recyclability</dt><dd className="font-mono text-sm font-semibold">{m.ukEprRecyclabilityPercent}% <span className="text-[10px] font-medium text-ink-500">UK EPR</span> · {m.euPpwrRecyclabilityPercent}% <span className="text-[10px] font-medium text-ink-500">EU</span></dd></div>
                </dl>
                <p className="text-[11px] text-ink-500"><span className="font-semibold text-ink-600">Shelf-life:</span> {m.typicalShelfLifeSuitability}</p>
                <div className="flex flex-wrap gap-1.5"><StatusBadge status={mc.status} label="Line" /><StatusBadge status={reg(rc.status)} label="Rules" /></div>
                {(mc.status !== 'pass' || rc.status !== 'pass') && <p className="rounded-lg bg-accent-50 p-2 text-[11px] leading-snug text-accent-800">{mc.status !== 'pass' ? mc.reason : rc.reason}</p>}
                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
                  <span className="font-mono font-semibold text-ink-700">{gbp(m.baseTrialCostGbp)}</span>
                  <button type="button" onClick={() => toggleCompare(m.id)} className={`font-semibold ${compareIds.includes(m.id) ? 'text-brand-700' : 'text-ink-500 hover:text-brand-700'}`}>{compareIds.includes(m.id) ? '✓ Comparing' : 'Compare'}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Compare drawer */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/50" onClick={() => setCompareOpen(false)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-float" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Side-by-side comparison">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Side by side</h2><button type="button" aria-label="Close" onClick={() => setCompareOpen(false)}><Icon name="x" /></button></div>
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-ink-100"><th className="py-2 pr-2 font-semibold text-ink-500">Attribute</th>{compareItems.map((c) => <th key={c.material.id} className="px-2 py-2 font-semibold">{c.material.name}</th>)}</tr></thead>
              <tbody>
                {[
                  ['Structure', (c) => c.material.layerStructure],
                  ['OTR (cc/m²/day)', (c) => c.material.otr, 'min'], ['WVTR (g/m²/day)', (c) => c.material.wvtr, 'min'],
                  ['Seal window (°C)', (c) => `${c.material.sealTempMinC}–${c.material.sealTempMaxC}`], ['UK EPR recyclability', (c) => `${c.material.ukEprRecyclabilityPercent}%`],
                  ['EU PPWR recyclability', (c) => `${c.material.euPpwrRecyclabilityPercent}%`], ['Shelf-life suitability', (c) => c.material.typicalShelfLifeSuitability],
                  ['Trial cost', (c) => c.material.baseTrialCostGbp, 'min', '£'], ['Line fit', (c) => c.manufacturingCheck.status], ['Rules', (c) => c.regulatoryCheck.status],
                ].map(([label, get, best, prefix = '']) => {
                  const vals = compareItems.map(get);
                  const bestV = best && vals.every((v) => typeof v === 'number') ? Math.min(...vals) : null;
                  return (
                    <tr key={label} className="border-b border-ink-50">
                      <td className="py-2 pr-2 text-ink-500">{label}</td>
                      {vals.map((v, i) => <td key={i} className={`px-2 py-2 ${bestV !== null && v === bestV ? 'font-bold text-brand-700' : ''}`}>{prefix}{v}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </aside>
        </div>
      )}

      <ActionBar
        status={selected.length === 0
          ? <span>Click bubbles (or use <strong className="text-white">Select all ready</strong>) to build your shortlist.</span>
          : (
            <span className="flex flex-wrap items-center gap-1.5">
              <strong className="text-white">{selected.length} of {overview.length} shortlisted</strong>
              {selected.slice(0, 5).map((s) => <span key={s} className="rounded-full bg-brand-500/30 px-2 py-0.5 font-mono text-[11px] text-brand-100">{s}</span>)}
              {selected.length > 5 && <span className="text-xs text-white/50">+{selected.length - 5}</span>}
            </span>
          )}
      >
        {compareIds.length > 1 && <button type="button" onClick={() => setCompareOpen(true)} className="btn-ghost-dark">Compare {compareIds.length}</button>}
        <button type="button" className="btn-cta" disabled={selected.length === 0 || starting} onClick={generate}>
          {starting ? 'Ranking…' : 'Generate & rank trials'} <Icon name="arrow" className="h-4 w-4" />
        </button>
      </ActionBar>
    </div>
  );
}
