import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import ActionBar from '../components/ActionBar';
import Icon from '../components/Icon';
import RecommendationBoard from '../components/RecommendationBoard';
import RequirementsSummary from '../components/RequirementsSummary';
import { STAGES, gbp, splitTrialName } from '../utils/stages';

export default function TrialRecommendation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const stage = STAGES[3];
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reRunning, setReRunning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/projects/${id}/recommendation`);
        setRecommendation(data.recommendation);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReRun() {
    setReRunning(true);
    try {
      const { data } = await api.post(`/projects/${id}/re-optimise`);
      setRecommendation(data.recommendation);
      toast.success('Ranking refreshed.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setReRunning(false);
    }
  }

  if (loading) return <LoadingBlock label="Ranking candidate trials…" />;

  const primary = recommendation?.ranked?.find((t) => t.id === recommendation.primaryRecommendationId);
  const name = primary ? splitTrialName(primary.trialName) : null;

  return (
    <div className="space-y-5">
      <StepHeader
        stage={stage} step={4}
        title="Which trial should you run next?"
        blurb="Constraints filter first, then every surviving trial is scored on five weighted dimensions. The same inputs always give the same answer."
      />

      <RequirementsSummary projectId={id} defaultCollapsed />

      {!recommendation ? (
        <div className="tile flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon name="target" className="h-7 w-7" /></span>
          <h2 className="font-display text-lg font-bold">Nothing ranked yet</h2>
          <p className="max-w-md text-sm text-ink-500">Shortlist candidate materials on the map, then generate trials to see the ranked recommendation here.</p>
          <Link to={`/projects/${id}/materials`} className="btn-primary">Go to the material map</Link>
        </div>
      ) : (
        <>
          <RecommendationBoard recommendation={recommendation} />
          <ActionBar
            status={primary
              ? <span><strong className="text-white">{name.material}</strong> <span className="text-white/60">· {primary.compositeScore}/100 · est. {gbp(primary.estimatedCostGbp)}</span></span>
              : <span>No feasible trial — adjust your constraints or shortlist more materials.</span>}
          >
            <button type="button" className="btn-ghost-dark" disabled={reRunning} onClick={handleReRun}><Icon name="loop" className="h-4 w-4" />{reRunning ? 'Re-running…' : 'Re-run'}</button>
            {primary ? (
              <button type="button" className="btn-cta" onClick={() => navigate(`/projects/${id}/trial-result`, { state: { trialId: primary.id } })}>Record the trial result <Icon name="arrow" className="h-4 w-4" /></button>
            ) : (
              <Link to={`/projects/${id}/materials`} className="btn-cta">Back to materials</Link>
            )}
          </ActionBar>
        </>
      )}
    </div>
  );
}
