import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import Section from '../components/Section';
import ActionBar from '../components/ActionBar';
import Icon from '../components/Icon';
import { STAGES, gbp, splitTrialName } from '../utils/stages';
import { clearDraft, readDraft, useDraft } from '../hooks/useDraft';

const CHECKS = [
  { key: 'performanceResult', label: 'Performance', ask: 'Did it hit the barrier and seal targets?', icon: 'gauge' },
  { key: 'manufacturingResult', label: 'Manufacturing', ask: 'Did it run cleanly on the line?', icon: 'factory' },
  { key: 'regulatoryResult', label: 'Regulatory', ask: 'Does it still classify as compliant?', icon: 'scale' },
];
const QUICK_REASONS = ['Seal integrity inconsistent', 'Barrier below target', 'Line speed not achievable', 'Temperature window too narrow', 'Recyclability threshold missed'];

function Stamp({ verdict }) {
  const size = 'h-28 w-28 sm:h-36 sm:w-36';
  if (!verdict) {
    return (
      <div className={`flex ${size} flex-col items-center justify-center rounded-full border-4 border-dashed border-ink-200 text-center text-ink-400`}>
        <Icon name="clock" className="h-7 w-7" /><span className="mt-1 text-[11px] font-bold uppercase tracking-wider">Awaiting<br />results</span>
      </div>
    );
  }
  const ok = verdict === 'Successful';
  return (
    <div key={verdict} className={`flex ${size} animate-stamp flex-col items-center justify-center rounded-full border-[5px] text-center font-display ${ok ? 'border-brand-500 text-brand-600' : 'border-red-500 text-red-600'}`}>
      <Icon name={ok ? 'check' : 'x'} className="h-9 w-9" strokeWidth={3} />
      <span className="mt-1 text-xs font-extrabold uppercase tracking-wider">{verdict}</span>
    </div>
  );
}

function Measure({ label, unit, value, onChange, target, mode }) {
  const v = value === '' ? null : Number(value);
  const ok = v != null && target != null ? (mode === 'max' ? v <= target : v >= target) : null;
  const pct = v != null && target ? Math.min(100, (v / (target * 1.6)) * 100) : 0;
  return (
    <div className="rounded-xl bg-ink-50 p-3.5">
      <label className="field-label">{label}</label>
      <div className="relative">
        <input type="number" step="0.1" className="field-input pr-16" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-ink-400">{unit}</span>
      </div>
      {target != null && (
        <div className="mt-3">
          <div className="relative h-2 rounded-full bg-ink-200">
            <div className={`h-full rounded-full transition-all ${ok == null ? 'bg-ink-300' : ok ? 'bg-brand-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            <span className="absolute -top-1 h-4 w-0.5 bg-ink-800" style={{ left: `${100 / 1.6}%` }} title={`Target ${target}`} />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-500">{mode === 'max' ? 'Target ≤' : 'Target ≥'} <span className="font-mono">{target}</span>{ok != null && <strong className={ok ? ' text-brand-600' : ' text-red-600'}> · {ok ? 'meets target' : 'misses target'}</strong>}</p>
        </div>
      )}
    </div>
  );
}

export default function TrialResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const stage = STAGES[4];

  const [recommendation, setRecommendation] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [override, setOverride] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [initialForm] = useState(() => ({
    performanceResult: '', manufacturingResult: '', regulatoryResult: '', overallResult: '', failureReason: '',
    measuredOtr: '', measuredWvtr: '', measuredSealStrength: '', notes: '', trialDate: new Date().toISOString().slice(0, 10),
  }));
  const draftKey = `result:${id}`;
  const [form, setForm] = useState(() => readDraft(draftKey) || initialForm);
  useDraft(draftKey, form, initialForm, true); // §8.2: keep a half-entered result if the user wanders off

  useEffect(() => {
    (async () => {
      try {
        const [{ data: r }, { data: q }] = await Promise.all([api.get(`/projects/${id}/recommendation`), api.get(`/projects/${id}/requirements`)]);
        setRecommendation(r.recommendation);
        setRequirements(q.requirements);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const trial = recommendation?.ranked?.find((t) => t.id === (location.state?.trialId || recommendation.primaryRecommendationId));
  const answered = CHECKS.filter((c) => form[c.key]).length;
  const allSet = answered === CHECKS.length;
  const anyFail = CHECKS.some((c) => form[c.key] === 'Fail');
  const autoVerdict = allSet ? (anyFail ? 'Unsuccessful' : 'Successful') : '';
  const verdict = override ? form.overallResult : autoVerdict;

  const setCheck = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const upd = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  function validate() {
    const errs = {};
    CHECKS.forEach((c) => { if (!form[c.key]) errs[c.key] = 'Choose Pass or Fail.'; });
    if (anyFail && !form.failureReason.trim()) errs.failureReason = 'A failure reason is required when anything fails.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) { toast.error('Please complete the highlighted fields.'); return; }
    setSubmitting(true);
    try {
      const num = (v) => (v === '' ? null : Number(v));
      await api.post(`/projects/${id}/trial-result`, {
        trialId: trial?.id, performanceResult: form.performanceResult, manufacturingResult: form.manufacturingResult, regulatoryResult: form.regulatoryResult,
        overallResult: verdict, failureReason: form.failureReason,
        measuredOtr: num(form.measuredOtr), measuredWvtr: num(form.measuredWvtr), measuredSealStrength: num(form.measuredSealStrength),
        notes: form.notes, trialDate: form.trialDate,
      });
      clearDraft(draftKey);
      toast.success('Result recorded — ranking updated.');
      navigate(`/projects/${id}/updated-recommendation`);
    } catch (err) {
      const details = apiErrorDetails(err);
      if (details) setErrors((p) => ({ ...p, ...details }));
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading trial…" />;

  const { material, profile } = splitTrialName(trial?.trialName);

  return (
    <div className="space-y-5">
      <StepHeader stage={stage} step={5} title="What happened in the trial?" blurb="Record the outcome of the physical trial. It is added to the evidence base and everything left is re-ranked." />

      {!trial ? (
        <div className="tile py-14 text-center text-ink-500">Run the optimisation first so there is a trial to record against.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <section className="rounded-2xl bg-ink-950 p-4 text-white sm:p-5">
                <p className="eyebrow !text-brand-300">Trial under test</p>
                <h2 className="mt-1 font-display text-lg font-bold">{material}</h2>
                <p className="text-sm text-white/60">{profile} · est. cost {gbp(trial.estimatedCostGbp)} · {trial.processParameters.temperatureC}°C · {trial.processParameters.lineSpeedMpm} m/min</p>
                {/* S-06: performance-targets reminder */}
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-white/70">
                  <span className="font-semibold text-white/90">Targets to beat:</span>
                  <span>OTR ≤ <b className="font-mono text-white">{requirements?.otrTarget ?? '—'}</b> cc/m²/day</span>
                  <span>WVTR ≤ <b className="font-mono text-white">{requirements?.wvtrTarget ?? '—'}</b> g/m²/day</span>
                  <span>Seal ≥ <b className="font-mono text-white">{requirements?.sealStrengthMinimum ?? '—'}</b> N/15mm</span>
                </p>
              </section>

              <Section title="Three verdicts" hint="Answer each question" icon="check" bodyClass="space-y-2.5 p-3 sm:p-4">
                {CHECKS.map((c) => (
                  <div key={c.key} className="grid items-center gap-3 rounded-xl bg-ink-50 p-3 sm:grid-cols-[1fr_auto]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-ink-600 shadow-card"><Icon name={c.icon} className="h-5 w-5" /></span>
                      <div><p className="text-sm font-bold">{c.label}</p><p className="text-xs text-ink-500">{c.ask}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`${c.label} result`}>
                      {['Pass', 'Fail'].map((v) => {
                        const on = form[c.key] === v;
                        return (
                          <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setCheck(c.key, v)}
                            className={`flex min-w-[6rem] items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold ring-1 ring-inset transition-all ${on ? (v === 'Pass' ? 'bg-brand-600 text-white ring-brand-600 shadow-raised' : 'bg-red-500 text-white ring-red-500 shadow-raised') : 'bg-white text-ink-500 ring-ink-200 hover:ring-ink-300'}`}>
                            <Icon name={v === 'Pass' ? 'check' : 'x'} className="h-4 w-4" strokeWidth={3} />{v}
                          </button>
                        );
                      })}
                    </div>
                    {errors[c.key] && <p className="field-error sm:col-span-2">{errors[c.key]}</p>}
                  </div>
                ))}
              </Section>

              {anyFail && (
                <section className="animate-fade-up rounded-2xl border-2 border-red-200 bg-red-50/60 p-4 sm:p-5">
                  <label className="field-label" htmlFor="why">What went wrong? <span className="text-red-600">*</span></label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_REASONS.map((r) => <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, failureReason: p.failureReason ? `${p.failureReason}; ${r}` : r }))} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100">+ {r}</button>)}
                  </div>
                  <textarea id="why" rows={2} className="field-input" value={form.failureReason} onChange={(e) => upd('failureReason')(e.target.value)} placeholder="Describe the failure so the next ranking can learn from it…" />
                  {errors.failureReason && <p className="field-error">{errors.failureReason}</p>}
                </section>
              )}

              <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-900/10">
                <button type="button" onClick={() => setShowMore(!showMore)} aria-expanded={showMore} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5">
                  <span><span className="block font-display text-sm font-bold">Measurements & notes</span><span className="block text-xs text-ink-500">Optional — measured OTR, WVTR, seal strength, notes, date</span></span>
                  <Icon name={showMore ? 'up' : 'down'} className="h-4 w-4 text-ink-400" />
                </button>
                {showMore && (
                  <div className="space-y-4 border-t border-ink-100 p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Measure label="Measured OTR" unit="cc/m²/d" value={form.measuredOtr} onChange={upd('measuredOtr')} target={requirements?.otrTarget} mode="max" />
                      <Measure label="Measured WVTR" unit="g/m²/d" value={form.measuredWvtr} onChange={upd('measuredWvtr')} target={requirements?.wvtrTarget} mode="max" />
                      <Measure label="Seal strength" unit="N/15mm" value={form.measuredSealStrength} onChange={upd('measuredSealStrength')} target={requirements?.sealStrengthMinimum} mode="min" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                      <div><label className="field-label">Notes</label><textarea rows={2} className="field-input" value={form.notes} onChange={(e) => upd('notes')(e.target.value)} /></div>
                      <div><label className="field-label">Trial date</label><input type="date" className="field-input" value={form.trialDate} onChange={(e) => upd('trialDate')(e.target.value)} /></div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-36 lg:self-start">
              <Section title="Overall verdict" icon="target" bodyClass="flex flex-col items-center gap-4 p-5 text-center">
                <Stamp verdict={verdict} />
                <p className="max-w-[16rem] text-sm text-ink-500">
                  {!verdict ? 'Answer all three questions and the verdict is stamped automatically.' : verdict === 'Successful' ? 'Clean pass — this structure stays in contention.' : 'Unsuccessful — this material will be struck from the next ranking.'}
                </p>
                {allSet && (
                  <button type="button" onClick={() => { setOverride((o) => !o); setForm((p) => ({ ...p, overallResult: autoVerdict })); }} className="text-xs font-semibold text-ink-500 underline">{override ? 'Use the automatic verdict' : 'Override the verdict'}</button>
                )}
                {override && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    {['Successful', 'Unsuccessful'].map((v) => <button key={v} type="button" onClick={() => upd('overallResult')(v)} className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset ${form.overallResult === v ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-600 ring-ink-200'}`}>{v}</button>)}
                  </div>
                )}
              </Section>
            </aside>
          </div>

          <ActionBar
            status={allSet
              ? <span>Verdict: <strong className={verdict === 'Successful' ? 'text-brand-300' : 'text-red-300'}>{verdict}</strong>{anyFail && !form.failureReason.trim() && <span className="text-white/60"> · add a failure reason</span>}</span>
              : <span><strong className="text-white">{answered} of 3</strong> verdicts answered</span>}
          >
            <button type="button" className="btn-ghost-dark" onClick={() => navigate(`/projects/${id}/recommendation`)}>← Ranking</button>
            <button type="button" className="btn-cta" disabled={submitting} onClick={submit}>{submitting ? 'Re-ranking…' : 'Submit & re-rank'} <Icon name="arrow" className="h-4 w-4" /></button>
          </ActionBar>
        </>
      )}
    </div>
  );
}
