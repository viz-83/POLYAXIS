import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import Section from '../components/Section';
import ActionBar from '../components/ActionBar';
import Icon from '../components/Icon';
import RecommendationBoard, { trialKey } from '../components/RecommendationBoard';
import { Sparkline } from '../components/charts';
import { STAGES, gbp, splitTrialName } from '../utils/stages';

function TrialCard({ trial, tone, tag, note }) {
  const { material, profile } = splitTrialName(trial.trialName);
  const styles = tone === 'old' ? 'bg-ink-100/80 text-ink-500 ring-ink-200' : 'bg-gradient-to-br from-ink-950 to-brand-900 text-white ring-accent-400/40 shadow-float';
  return (
    <div className={`relative rounded-2xl p-4 pt-5 ring-1 ${styles}`}>
      <span className={`absolute -top-3 left-4 rounded-full px-3 py-1 text-[11px] font-bold ${tone === 'old' ? 'bg-red-600 text-white' : 'bg-accent-400 text-ink-950'}`}>{tag}</span>
      <p className={`font-display text-base font-bold leading-snug ${tone === 'old' ? 'line-through decoration-red-500/70' : ''}`}>{material}</p>
      <p className="text-xs opacity-70">{profile} profile</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-mono text-2xl font-semibold">{trial.compositeScore}<span className="text-sm opacity-50">/100</span></p>
        <p className="font-mono text-sm opacity-80">{gbp(trial.estimatedCostGbp)}</p>
      </div>
      {note && <p className="mt-2 text-xs leading-snug opacity-80">{note}</p>}
    </div>
  );
}

export default function UpdatedRecommendation() {
  const { id } = useParams();
  const toast = useToast();
  const stage = STAGES[4];
  const [runs, setRuns] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: h }, { data: r }] = await Promise.all([api.get(`/projects/${id}/recommendation/history`), api.get(`/projects/${id}/trial-results`)]);
        setRuns(h.runs);
        setResults(r.results);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingBlock label="Re-ranking with the new evidence…" />;

  const latest = runs[runs.length - 1];
  const previous = runs.length > 1 ? runs[runs.length - 2] : null;
  const lastResult = results[results.length - 1];

  if (!latest) {
    return (
      <div className="space-y-5">
        <StepHeader stage={stage} step={5} title="Evidence in, ranking out" blurb="Nothing to compare yet." />
        <div className="tile py-14 text-center text-ink-500">No optimisation has been run for this project.</div>
      </div>
    );
  }

  const newTop = latest.ranked.find((t) => t.id === latest.primaryRecommendationId);
  const oldTop = previous?.ranked.find((t) => t.id === previous.primaryRecommendationId);
  const oldStillRanked = oldTop && latest.ranked.some((t) => trialKey(t) === trialKey(oldTop));
  const failedDim = lastResult && (lastResult.manufacturingResult === 'Fail' ? 'manufacturing' : lastResult.regulatoryResult === 'Fail' ? 'regulatory' : lastResult.performanceResult === 'Fail' ? 'performance' : null);
  const bestScores = runs.map((r) => r.ranked[0]?.compositeScore).filter((v) => v != null);

  return (
    <div className="space-y-5">
      <StepHeader
        stage={stage} step={5} kicker="Step 5 of 5 · Re-optimised"
        title="Evidence in, ranking out"
        blurb="Your result has been added to the evidence base. Here is exactly what it changed."
      />

      {/* S-07: evidence-update banner */}
      {lastResult && (
        <div className="rounded-2xl bg-accent-50 p-4 ring-1 ring-accent-200" role="status">
          <p className="text-sm font-bold text-accent-900">Recommendation updated following {lastResult.trialName} result</p>
          <p className="mt-1 text-sm text-accent-800">
            Performance: {lastResult.performanceResult === 'Pass' ? '✅' : '❌'} | Manufacturing: {lastResult.manufacturingResult === 'Pass' ? '✅' : '❌'} | Regulatory: {lastResult.regulatoryResult === 'Pass' ? '✅' : '❌'} | Overall: {lastResult.overallResult}
          </p>
          <p className="mt-1 text-xs text-accent-800">Previous recommendation has been deprioritised. Updated ranking below.</p>
        </div>
      )}

      {oldTop && newTop && (
        <section className="grid grid-cols-1 items-center gap-4 pt-2 lg:grid-cols-[1fr_auto_1fr]" aria-label="What changed">
          <TrialCard trial={oldTop} tone="old" tag={oldStillRanked ? 'Previous #1' : 'Removed'} note={lastResult ? `${lastResult.overallResult}${failedDim ? ` — failed on ${failedDim}` : ''}${lastResult.failureReason ? `: ${lastResult.failureReason}` : ''}` : undefined} />
          <span className="mx-auto flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-accent-500 text-ink-950 shadow-raised lg:rotate-0"><Icon name="arrow" className="h-5 w-5" strokeWidth={2.4} /></span>
          <TrialCard trial={newTop} tone="new" tag="New #1" note="Promoted after the previous priority trial dropped out." />
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {lastResult && (
          <Section title="Evidence recorded" hint={lastResult.trialName} icon="check">
            <ul className="grid grid-cols-3 gap-2">
              {[['Performance', lastResult.performanceResult], ['Manufacturing', lastResult.manufacturingResult], ['Regulatory', lastResult.regulatoryResult]].map(([l, v]) => (
                <li key={l} className={`rounded-xl p-2.5 text-center ${v === 'Pass' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                  <Icon name={v === 'Pass' ? 'check' : 'x'} className="mx-auto h-5 w-5" strokeWidth={3} />
                  <p className="mt-1 text-xs font-bold">{l}</p><p className="text-[11px]">{v}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Best score by run" hint={`${runs.length} run${runs.length === 1 ? '' : 's'} · ${results.length} result${results.length === 1 ? '' : 's'} recorded`} icon="chart">
          <Sparkline values={bestScores} color="#1a7c6a" height={52} width={260} />
        </Section>
      </div>

      <RecommendationBoard recommendation={latest} previousRun={previous} />

      <ActionBar status={newTop ? <span>New priority: <strong className="text-white">{splitTrialName(newTop.trialName).material}</strong> <span className="text-white/60">· {newTop.compositeScore}/100</span></span> : <span>No feasible trial remains.</span>}>
        <Link to={`/projects/${id}/dashboard`} className="btn-ghost-dark">Open overview</Link>
        <Link to={`/projects/${id}/trial-result`} state={newTop ? { trialId: newTop.id } : undefined} className="btn-cta">Record another result <Icon name="arrow" className="h-4 w-4" /></Link>
      </ActionBar>
    </div>
  );
}
