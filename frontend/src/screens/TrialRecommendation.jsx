import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock, EmptyState } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';
import RecommendationPanel from '../components/RecommendationPanel';

export default function TrialRecommendation() {
  const { id } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reRunning, setReRunning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data: p }, { data: r }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/recommendation`),
      ]);
      setProject(p.project);
      setRecommendation(r.recommendation);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReRun() {
    setReRunning(true);
    try {
      const { data } = await api.post(`/projects/${id}/re-optimise`);
      setRecommendation(data.recommendation);
      toast.success('Recommendation refreshed.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setReRunning(false);
    }
  }

  if (loading) return <LoadingBlock label="Generating candidate trials…" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {project && (
        <div className="mb-6">
          <ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} />
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Trial Recommendation</h1>
          <p className="mt-1 text-sm text-ink-500">Ranked candidate trials from the Compliance-Constrained Trial Design Engine.</p>
        </div>
        <button type="button" className="btn-secondary" disabled={reRunning} onClick={handleReRun}>
          {reRunning ? 'Re-running…' : '↻ Re-run Optimisation'}
        </button>
      </div>

      {!recommendation ? (
        <EmptyState
          title="No optimisation run yet"
          description="Select candidate materials on the Candidate Alternatives screen and generate trials to see a ranked recommendation."
        />
      ) : (
        <RecommendationPanel projectId={id} recommendation={recommendation} />
      )}
    </div>
  );
}
