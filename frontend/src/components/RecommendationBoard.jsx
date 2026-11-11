import { useMemo, useState } from 'react';
import Icon from './Icon';
import StatusBadge from './StatusBadge';
import Section from './Section';
import Tabs from './Tabs';
import { RadarChart, ScoreRing } from './charts';
import { DEFAULT_WEIGHTS, DIMS, gbp, splitTrialName } from '../utils/stages';

const CONFIDENCE = {
  High: 'bg-brand-400/20 text-brand-200 ring-brand-300/40',
  Medium: 'bg-accent-400/20 text-accent-200 ring-accent-300/40',
  Low: 'bg-red-400/20 text-red-200 ring-red-300/40',
};
const EXCLUSION_ICON = { manufacturing: 'factory', regulatory: 'scale', evidence: 'ban' };
const EXCLUSION_LABEL = { manufacturing: 'Line constraint', regulatory: 'Regulation', evidence: 'Failed trial' };

export const trialKey = (t) => `${t.materialId}|${t.profileId}`;
const regBadge = (s) => (s === 'pass' ? 'compliant' : s === 'conditional' ? 'conditional' : 'non-compliant');

/** Break the engine's rationale paragraph into sentences: a lead sentence plus supporting points. */
export function rationalePoints(text = '') {
  const parts = String(text).split(/(?<=[.!?])\s+(?=[A-Z£])/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [''];
}

/** REC-02: expected information gain as a High / Medium / Low indicator. */
export const gainLevel = (score) => (score >= 0.66 ? 'High' : score >= 0.4 ? 'Medium' : 'Low');

/** REC-04: Manufacturing ✅/❌, Regulatory ✅/❌, Performance ✅/⚠️ — performance never shows ❌, only at-risk. */
function ConstraintStatus({ trial, compact = false }) {
  const perf = trial.performanceCheck?.status;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Constraint status">
      <StatusBadge status={trial.manufacturingCheck.status} label={compact ? 'Mfg' : 'Manufacturing'} />
      <StatusBadge status={regBadge(trial.regulatoryCheck.status)} label={compact ? 'Reg' : 'Regulatory'} />
      {perf && <StatusBadge status={perf === 'pass' ? 'pass' : 'conditional'} label={compact ? 'Perf' : perf === 'pass' ? 'Performance' : 'Performance at risk'} />}
    </div>
  );
}

/** Rank movement versus the previous run: ▲n / ▼n / NEW. */
function Movement({ delta }) {
  if (delta === 'new') return <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">NEW</span>;
  if (!delta) return <span className="font-mono text-[11px] text-ink-300">—</span>;
  const up = delta > 0;
  return <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${up ? 'text-brand-600' : 'text-red-600'}`}><Icon name={up ? 'up' : 'down'} className="h-3 w-3" strokeWidth={3} />{Math.abs(delta)}</span>;
}

/** One-line "how we got here" strip replacing a tall funnel. */
function FunnelStrip({ steps }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2" aria-label="How the shortlist was narrowed">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1.5">
          <span className="rounded-xl bg-white px-3 py-1.5 text-sm shadow-card ring-1 ring-brand-900/10" title={s.sub}>
            <b className="font-mono text-base font-semibold text-ink-900">{s.value}</b> <span className="text-ink-500">{s.label}</span>
            {s.note && <span className="ml-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">{s.note}</span>}
          </span>
          {i < steps.length - 1 && <Icon name="arrow" className="h-4 w-4 text-ink-300" />}
        </li>
      ))}
    </ol>
  );
}

export default function RecommendationBoard({ recommendation, previousRun }) {
  const [tab, setTab] = useState('priority');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(null);

  const ranked = recommendation.ranked || [];
  const weights = recommendation.weights || DEFAULT_WEIGHTS;
  const primary = ranked.find((t) => t.id === recommendation.primaryRecommendationId) || ranked[0];

  const prevRank = useMemo(() => (previousRun ? Object.fromEntries(previousRun.ranked.map((t, i) => [trialKey(t), i])) : null), [previousRun]);

  const excludedByMaterial = useMemo(() => {
    const seen = new Set();
    return (recommendation.excluded || []).filter((e) => {
      const k = `${e.materialId}|${e.reasonType}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [recommendation.excluded]);

  if (!primary) {
    return (
      <Section title="No feasible trials" icon="ban">
        <p className="text-ink-600">{recommendation.rationale}</p>
        {excludedByMaterial.length > 0 && <ul className="mt-4 space-y-2">{excludedByMaterial.map((e, i) => <li key={i} className="rounded-xl bg-red-50 p-3 text-sm text-red-800"><strong>{e.materialName}</strong> — {e.reason}</li>)}</ul>}
      </Section>
    );
  }

  const materialsPassing = new Set(ranked.map((t) => t.materialId)).size;
  const shortlisted = recommendation.selectedMaterialIds?.length || materialsPassing + excludedByMaterial.length;
  const filteredOut = Math.max(0, shortlisted - materialsPassing);
  const visible = showAll ? ranked : ranked.slice(0, 5); // the leader plus up to 4 alternatives (REC-03)
  const maxScore = Math.max(...ranked.map((t) => t.compositeScore), 1);
  const { material: pMaterial, profile: pProfile } = splitTrialName(primary.trialName);

  const tabs = [
    { key: 'priority', label: 'Priority trial', icon: 'target' },
    { key: 'board', label: 'Leaderboard', icon: 'chart', count: ranked.length },
    ...(excludedByMaterial.length ? [{ key: 'filtered', label: 'Filtered out', icon: 'ban', count: excludedByMaterial.length }] : []),
  ];

  return (
    <div className="space-y-5">
      <FunnelStrip steps={[
        { label: 'shortlisted', value: shortlisted },
        { label: 'cleared filters', value: materialsPassing, note: filteredOut ? `${filteredOut} out` : null },
        { label: 'trials scored', value: ranked.length, sub: '5 process profiles per material' },
        { label: 'priority', value: 1 },
      ]} />

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Recommendation views" />

      {tab === 'priority' && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-950 p-5 text-white shadow-float sm:p-6" aria-label="Priority recommendation">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl" />
          <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400 px-3 py-1 text-xs font-bold text-ink-950"><Icon name="target" className="h-3.5 w-3.5" /> Run this next</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${CONFIDENCE[recommendation.confidence] || CONFIDENCE.Medium}`}>{recommendation.confidence} confidence</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <ScoreRing value={primary.compositeScore} size={104} stroke={10} color="#f5b83d" />
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">{pMaterial}</h2>
                  <p className="mt-1 text-sm text-white/60">{pProfile} profile</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[['Est. cost', gbp(primary.estimatedCostGbp)], ['Info gain', gainLevel(primary.dimensionScores.informationGain)], ['Temperature', `${primary.processParameters.temperatureC}°C`], ['Line speed', `${primary.processParameters.lineSpeedMpm} m/min`]].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10"><dd className="font-mono text-sm font-semibold">{v}</dd><dt className="text-[11px] text-white/60">{l}</dt></div>
                ))}
              </dl>
              <figure className="mt-5 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <figcaption className="eyebrow !text-brand-300">Why this trial</figcaption>
                {(() => {
                  const [lead, ...points] = rationalePoints(recommendation.rationale);
                  return (
                    <>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-white">{lead}</p>
                      {points.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5">
                          {points.map((p, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-snug text-white/80">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" aria-hidden="true" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  );
                })()}
              </figure>
              <div className="mt-3"><ConstraintStatus trial={primary} /></div>
            </div>
            <div className="mx-auto w-full max-w-[20rem]"><RadarChart scores={primary.dimensionScores} dark accent="#f5b83d" size={300} /></div>
          </div>
        </section>
      )}

      {tab === 'board' && (
        <Section
          title="How every score is built" hint="Each bar = the five weighted dimensions, summed" icon="chart" bodyClass="p-3 sm:p-4"
          actions={(
            <ul className="hidden flex-wrap justify-end gap-x-3 gap-y-1 text-[11px] text-ink-600 md:flex">
              {DIMS.map((d) => <li key={d.key} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />{d.short} <span className="font-mono text-ink-400">{Math.round((weights[d.key] ?? 0) * 100)}%</span></li>)}
            </ul>
          )}
        >
          <ol className="space-y-1">
            {visible.map((t, i) => {
              const { material, profile } = splitTrialName(t.trialName);
              const delta = prevRank ? (trialKey(t) in prevRank ? prevRank[trialKey(t)] - i : 'new') : null;
              const isOpen = open === t.id;
              return (
                <li key={t.id} className={`rounded-xl transition-colors ${i === 0 ? 'bg-accent-50/70 ring-1 ring-accent-200' : 'hover:bg-ink-50'}`}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-2.5 text-left">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${i === 0 ? 'bg-accent-500 text-ink-950' : 'bg-ink-100 text-ink-600'}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-semibold">{material}</p>
                        <span className="shrink-0 font-mono text-base font-semibold">{t.compositeScore}</span>
                      </div>
                      <p className="truncate text-xs text-ink-500">{profile} · {t.processParameters.temperatureC}°C · {t.processParameters.lineSpeedMpm} m/min</p>
                      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-ink-100" role="img" aria-label={`Score composition for ${t.trialName}`}>
                        {DIMS.map((d) => <span key={d.key} style={{ width: `${((t.dimensionScores[d.key] * (weights[d.key] ?? 0) * 100) / maxScore) * 100}%`, background: d.color }} />)}
                      </div>
                    </div>
                    <span className="hidden shrink-0 lg:block"><ConstraintStatus trial={t} compact /></span>
                    {prevRank && <span className="hidden w-10 shrink-0 text-right sm:block"><Movement delta={delta} /></span>}
                    <Icon name={isOpen ? 'up' : 'down'} className="h-4 w-4 shrink-0 text-ink-400" />
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-1.5 text-xs text-ink-600">
                        <p><strong className="text-ink-800">{gbp(t.estimatedCostGbp)}</strong> · {t.processParameters.temperatureC}°C · {t.processParameters.lineSpeedMpm} m/min · {t.processParameters.sealConditions}</p>
                        <p><span className="font-semibold text-ink-800">Line:</span> {t.manufacturingCheck.reason}</p>
                        <p><span className="font-semibold text-ink-800">Rules:</span> {t.regulatoryCheck.reason}</p>
                        {t.performanceCheck && <p><span className="font-semibold text-ink-800">Performance:</span> {t.performanceCheck.reason}</p>}
                        <div className="lg:hidden"><ConstraintStatus trial={t} compact /></div>
                      </div>
                      <dl className="grid grid-cols-5 gap-2 text-center">
                        {DIMS.map((d) => <div key={d.key}><dd className="font-mono text-sm font-semibold text-ink-800">{Math.round(t.dimensionScores[d.key] * 100)}</dd><dt className="text-[10px] text-ink-400">{d.short}</dt></div>)}
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {ranked.length > 5 && <button type="button" onClick={() => setShowAll(!showAll)} className="mt-3 px-2 text-sm font-semibold text-brand-700 hover:underline">{showAll ? 'Show fewer' : `Show all ${ranked.length} trials`}</button>}
        </Section>
      )}

      {tab === 'filtered' && (
        <Section title="Not recommended — and why" hint="Candidates removed before scoring" icon="ban">
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {excludedByMaterial.map((e, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-red-50/70 p-4 ring-1 ring-red-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-card"><Icon name={EXCLUSION_ICON[e.reasonType] || 'ban'} className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900">{e.materialName}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">{EXCLUSION_LABEL[e.reasonType] || 'Excluded'}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-600">{e.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
