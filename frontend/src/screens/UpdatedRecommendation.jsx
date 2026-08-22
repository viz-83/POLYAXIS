import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock, EmptyState } from '../components/Loading';
import RecommendationPanel from '../components/RecommendationPanel';

export default function UpdatedRecommendation() {
  const { id } = useParams();
  const toast = useToast();
  const [recommendation, setRecommendation] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: r }, { data: results }] = await Promise.all([
          api.get(`/projects/${id}/recommendation`),
          api.get(`/projects/${id}/trial-results`),
        ]);
        setRecommendation(r.recommendation);
        setLastResult(results.results[results.results.length - 1] || null);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingBlock label="Re-optimising ranking…" />;

  const banner = lastResult && (
    <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="text-sm font-bold text-amber-900">Recommendation updated following {lastResult.trialName} result</p>
      <p className="mt-1 text-xs text-amber-800">
        Performance: {lastResult.performanceResult === 'Pass' ? '✅' : '❌'} | Manufacturing: {lastResult.manufacturingResult === 'Pass' ? '✅' : '❌'} | Regulatory: {lastResult.regulatoryResult === 'Pass' ? '✅' : '❌'} | Overall: {lastResult.overallResult}
      </p>
      <p className="mt-1 text-xs text-amber-700">Previous recommendation has been deprioritised. Updated ranking below.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink-900">Updated Recommendation</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Ranking re-computed after incorporating the latest trial result into the evidence base.</p>

      {!recommendation ? (
        <EmptyState title="No recommendation available" description="Run the optimisation engine first." />
      ) : (
        <>
          <RecommendationPanel projectId={id} recommendation={recommendation} evidenceBanner={banner} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/projects/${id}/trial-result`} className="btn-secondary">Record Another Trial Result →</Link>
            <Link to={`/projects/${id}/dashboard`} className="btn-primary">View Project Dashboard →</Link>
          </div>
        </>
      )}
    </div>
  );
}
