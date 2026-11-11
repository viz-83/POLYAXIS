import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import Section from '../components/Section';
import Icon from '../components/Icon';
import { LayerStack, ScoreRing, Sparkline, parseLayers } from '../components/charts';
import { STAGES, gbp, splitTrialName } from '../utils/stages';

function Kpi({ label, value, tone = 'text-ink-900', icon, chip = 'bg-ink-100 text-ink-600' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-brand-900/10">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}><Icon name={icon} className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className={`font-mono text-2xl font-semibold leading-none ${tone}`}>{value}</p>
        <p className="mt-1 text-xs font-medium leading-tight text-ink-500">{label}</p>
      </div>
    </div>
  );
}

function EditLink({ to }) {
  return <Link to={to} className="btn-secondary !px-3 !py-1.5 !text-xs">Edit</Link>;
}

function Verdict({ v, label }) {
  const ok = v === 'Pass';
  return <span title={`${label}: ${v}`} className={`flex h-7 w-7 items-center justify-center rounded-full ${ok ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700'}`}><Icon name={ok ? 'check' : 'x'} className="h-3.5 w-3.5" strokeWidth={3} /></span>;
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const toast = useToast();
  const [dash, setDash] = useState(null);
  const [runs, setRuns] = useState([]);
  const [spec, setSpec] = useState(null);

  async function load() {
    try {
      const [{ data: d }, { data: h }, { data: s }] = await Promise.all([api.get(`/projects/${id}/dashboard`), api.get(`/projects/${id}/recommendation/history`), api.get(`/projects/${id}/specification`)]);
      setDash(d.dashboard);
      setRuns(h.runs);
      setSpec(s.specification);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  // DASH-09 / §9 "pseudo-realtime": refresh when the window regains focus AND on a 20-second interval,
  // so the dashboard stays current without a manual reload (no WebSocket needed in Phase 1).
  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 20000);
    window.addEventListener('focus', load);
    return () => { clearInterval(timer); window.removeEventListener('focus', load); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!dash) return <LoadingBlock label="Loading mission control…" />;

  const { project, candidatesOverview: co, currentRecommendation: rec, keyConstraints: kc, trialHistory } = dash;
  const progress = Math.round((project.stagesCompleted.length / STAGES.length) * 100);
  const best = runs.map((r) => r.ranked[0]?.compositeScore).filter((v) => v != null);
  const target = dash.packagingSummary.target;
  const recSplit = rec ? splitTrialName(rec.trialName) : null;
  // The one thing to do next: the first unfinished step, or another trial result once every step is done.
  const nextStage = STAGES.find((s) => !project.stagesCompleted.includes(s.stage));
  const next = nextStage
    ? { label: `Continue: ${nextStage.label}`, to: nextStage.path(id) }
    : { label: 'Record another trial result', to: `/projects/${id}/trial-result` };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Hero */}
      <section className="relative col-span-12 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-ink-900 to-brand-900 p-6 text-white shadow-raised sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="eyebrow !text-brand-300">Mission control · {project.productType}</p>
            <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{project.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">{project.transitionObjective}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to={next.to} className="btn-cta px-5 py-3 text-base">{next.label} <Icon name="arrow" /></Link>
              <span className="text-xs text-white/70">{project.stagesCompleted.length} of {STAGES.length} steps complete</span>
            </div>
          </div>
          <div className="hidden text-center md:block"><ScoreRing value={progress} size={120} stroke={11} color="#46b59d" sub="% complete" /></div>
        </div>
      </section>

      {/* KPIs */}
      <div className="col-span-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Candidates evaluated" value={co.totalEvaluated} icon="flask" chip="bg-ink-100 text-ink-600" />
        <Kpi label="Cleared filters" value={co.compatibleCount} tone="text-brand-700" icon="check" chip="bg-brand-50 text-brand-700" />
        <Kpi label="Excluded" value={co.excludedCount} tone="text-red-600" icon="ban" chip="bg-red-50 text-red-600" />
        <Kpi label="Trials recorded" value={trialHistory.length} tone="text-brand-700" icon="loop" chip="bg-brand-50 text-brand-700" />
      </div>

      {/* Transition */}
      <Section title="The transition" hint="Today's structure → the recyclable target" icon="layers" className="col-span-12 lg:col-span-7" actions={<EditLink to={`/projects/${id}/setup`} />} bodyClass="p-4 sm:p-5">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-bold">Today</p>
            <LayerStack layers={parseLayers(spec?.layerStructure)} empty="No layer structure recorded" />
            <p className="mt-2 text-xs font-medium text-ink-700">{dash.packagingSummary.existing?.material || '—'}</p>
            <p className="font-mono text-[11px] text-ink-500">OTR {dash.packagingSummary.existing?.otr ?? '—'} · WVTR {dash.packagingSummary.existing?.wvtr ?? '—'} · shelf life {dash.packagingSummary.existing?.shelfLifeMonths ?? '—'} mo</p>
          </div>
          <span className="mx-auto flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-brand-600 text-white sm:rotate-0"><Icon name="arrow" /></span>
          <div className="min-w-0">
            <p className="mb-2 text-sm font-bold">Target</p>
            <LayerStack mono monoLabel={target?.materialType} />
            <p className="mt-2 text-xs font-medium text-ink-700">{target?.materialType || '—'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-600"><span className="badge-green">{target?.recyclabilityPercent ?? '—'}% recyclable</span><span>{target?.recyclingStream}</span></div>
          </div>
        </div>
      </Section>

      {/* Recommendation */}
      <section className="relative col-span-12 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-ink-900 to-brand-900 p-5 text-white shadow-raised lg:col-span-5">
        <p className="eyebrow !text-brand-300">Current priority trial</p>
        {rec ? (
          <>
            <div className="mt-3 flex items-center gap-4">
              <ScoreRing value={rec.compositeScore} size={92} stroke={9} color="#f5b83d" />
              <div className="min-w-0"><h2 className="font-display text-lg font-bold leading-snug">{recSplit.material}</h2><p className="text-xs text-white/70">{recSplit.profile} · {gbp(rec.estimatedCostGbp)} · {rec.confidence} confidence</p></div>
            </div>
            {best.length > 1 && <div className="mt-3 rounded-xl bg-white/10 p-2"><Sparkline values={best} color="#f5b83d" height={40} /></div>}
            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/80">{rec.rationaleExcerpt}</p>
            <Link to={`/projects/${id}/recommendation`} className="btn mt-4 self-start bg-accent-400 text-ink-950 hover:bg-accent-300">Open ranking <Icon name="arrow" className="h-4 w-4" /></Link>
          </>
        ) : (
          <div className="mt-3 flex flex-1 flex-col items-start justify-center gap-1">
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-300"><Icon name="target" className="h-5 w-5" /></span>
            <p className="font-display text-lg font-bold">No ranking yet</p>
            <p className="text-sm text-white/75">Shortlist materials and the engine ranks the trials worth running.</p>
            <Link to={`/projects/${id}/materials`} className="btn mt-4 bg-accent-400 text-ink-950 hover:bg-accent-300">Map materials <Icon name="arrow" className="h-4 w-4" /></Link>
          </div>
        )}
      </section>

      {/* Trial history — chronological table (S-08 / RESULT-10 / DASH-07) */}
      <Section title="Trial history" hint="Every recorded physical trial" icon="clock" className="col-span-12 lg:col-span-7" bodyClass="p-4 sm:p-5">
        {trialHistory.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-900/10"><Icon name="flask" className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold text-ink-800">No trials recorded yet</p>
            <p className="mt-1 max-w-xs text-sm text-ink-500">Run the priority trial, then record what happened — the ranking updates from the evidence.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-3">Trial name</th><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Performance</th>
                  <th className="py-2 pr-3">Manufacturing</th><th className="py-2 pr-3">Regulatory</th><th className="py-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {trialHistory.map((h) => (
                  <tr key={h.id} className="border-b border-ink-50 align-top">
                    <td className="py-2.5 pr-3"><p className="font-semibold text-ink-800">{splitTrialName(h.trialName).material}</p><p className="text-xs text-ink-500">{splitTrialName(h.trialName).profile}</p></td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-ink-600">{h.date}</td>
                    {[['Performance', h.performanceResult], ['Manufacturing', h.manufacturingResult], ['Regulatory', h.regulatoryResult]].map(([l, v]) => (
                      <td key={l} className="py-2.5 pr-3"><span className="inline-flex items-center gap-1.5"><Verdict v={v} label={l} /><span className={`text-xs font-semibold ${v === 'Pass' ? 'text-brand-700' : 'text-red-700'}`}>{v}</span></span></td>
                    ))}
                    <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${h.overallResult === 'Successful' ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700'}`}>{h.overallResult}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="col-span-12 space-y-5 lg:col-span-5">
        {/* Candidates overview (DASH-05) */}
        <Section title="Candidates" hint="Where each shortlisted material stands" icon="flask" actions={<Link to={`/projects/${id}/materials`} className="btn-secondary !px-3 !py-1.5 !text-xs">Shortlist</Link>}>
          {co.totalEvaluated === 0 ? (
            <p className="text-sm text-ink-500">No candidates evaluated yet — pick materials on the Materials step.</p>
          ) : (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-100" role="img" aria-label={`${co.compatibleCount} ranked, ${co.excludedCount} excluded`}>
                <span className="bg-brand-500" style={{ width: `${(co.compatibleCount / co.totalEvaluated) * 100}%` }} />
                <span className="bg-red-400" style={{ width: `${(co.excludedCount / co.totalEvaluated) * 100}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {co.statuses.map((s) => (
                  <li key={s.materialId} className="flex items-center justify-between gap-3 text-xs" title={s.reason}>
                    <span className="truncate font-medium text-ink-700">{s.name}</span>
                    {s.status === 'ranked'
                      ? <span className="badge-green shrink-0">Ranked · {s.bestScore}</span>
                      : <span className="badge-red shrink-0">Excluded · {s.reasonType}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        {/* Constraints */}
        <Section title="Active constraints" hint="What the engine enforces" icon="sliders" actions={<EditLink to={`/projects/${id}/requirements`} />}>
          {kc.manufacturing ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-1.5">{(kc.manufacturing.equipmentTypes || []).map((e) => <span key={e} className="badge-slate">{e}</span>)}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 p-3"><p className="flex items-center gap-1 text-[11px] font-semibold text-brand-700"><Icon name="thermo" className="h-3.5 w-3.5" />Temperature</p><p className="mt-1 font-mono text-sm font-semibold">{kc.manufacturing.temperatureRange[0]}–{kc.manufacturing.temperatureRange[1]}°C</p></div>
                <div className="rounded-xl bg-brand-50 p-3"><p className="flex items-center gap-1 text-[11px] font-semibold text-brand-700"><Icon name="wind" className="h-3.5 w-3.5" />Line speed</p><p className="mt-1 font-mono text-sm font-semibold">{kc.manufacturing.lineSpeedRange[0]}–{kc.manufacturing.lineSpeedRange[1]} m/min</p></div>
              </div>
              <p className="text-xs text-ink-500">Limits are <strong>{kc.manufacturing.flexibility === 'Soft' ? 'soft preferences' : 'hard constraints'}</strong>.</p>
            </div>
          ) : <p className="text-sm text-ink-500">No manufacturing constraints defined yet.</p>}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            {kc.regulatory?.ukEpr && <span className="badge-green">UK EPR</span>}
            {kc.regulatory?.euPpwr && <span className="badge-green">EU PPWR</span>}
            {!kc.regulatory?.ukEpr && !kc.regulatory?.euPpwr && <span className="text-sm text-ink-500">No regulatory framework selected.</span>}
          </div>
        </Section>
      </div>

      {/* Quick actions (S-08 section 7) */}
      <section className="col-span-12 flex flex-wrap items-center gap-2" aria-label="Quick actions">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Quick actions</span>
        <Link to={`/projects/${id}/requirements`} className="btn-secondary !py-2">Resume Requirements</Link>
        <Link to={`/projects/${id}/recommendation`} className="btn-secondary !py-2">View Recommendation</Link>
        <Link to={`/projects/${id}/trial-result`} className="btn-secondary !py-2">Record Trial Result</Link>
      </section>
    </div>
  );
}
