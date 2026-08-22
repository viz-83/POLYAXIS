import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';

export default function TrialResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    performanceResult: '', manufacturingResult: '', regulatoryResult: '',
    overallResult: '', failureReason: '',
    measuredOtr: '', measuredWvtr: '', measuredSealStrength: '', notes: '',
    trialDate: new Date().toISOString().slice(0, 10),
  });

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

  const primary = recommendation?.ranked?.find((t) => t.id === (location.state?.trialId || recommendation.primaryRecommendationId));

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (['performanceResult', 'manufacturingResult', 'regulatoryResult'].includes(field)) {
        const anyFail = [next.performanceResult, next.manufacturingResult, next.regulatoryResult].includes('Fail');
        const allSet = next.performanceResult && next.manufacturingResult && next.regulatoryResult;
        if (allSet) next.overallResult = anyFail ? 'Unsuccessful' : 'Successful';
      }
      return next;
    });
  }

  function validate() {
    const errs = {};
    if (!form.performanceResult) errs.performanceResult = 'Required.';
    if (!form.manufacturingResult) errs.manufacturingResult = 'Required.';
    if (!form.regulatoryResult) errs.regulatoryResult = 'Required.';
    const anyFail = [form.performanceResult, form.manufacturingResult, form.regulatoryResult].includes('Fail');
    if (anyFail && !form.failureReason.trim()) errs.failureReason = 'Failure reason is required when any dimension fails.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        trialId: primary?.id,
        performanceResult: form.performanceResult,
        manufacturingResult: form.manufacturingResult,
        regulatoryResult: form.regulatoryResult,
        overallResult: form.overallResult,
        failureReason: form.failureReason,
        measuredOtr: form.measuredOtr === '' ? null : Number(form.measuredOtr),
        measuredWvtr: form.measuredWvtr === '' ? null : Number(form.measuredWvtr),
        measuredSealStrength: form.measuredSealStrength === '' ? null : Number(form.measuredSealStrength),
        notes: form.notes,
        trialDate: form.trialDate,
      };
      await api.post(`/projects/${id}/trial-result`, payload);
      toast.success('Trial result recorded. Recommendation re-optimised.');
      navigate(`/projects/${id}/updated-recommendation`);
    } catch (err) {
      const details = apiErrorDetails(err);
      if (details) setErrors((prev) => ({ ...prev, ...details }));
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading trial context…" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink-900">Simulated Trial Result</h1>
      <p className="mt-1 text-sm text-ink-500">Record the outcome of the physical trial to update the evidence base.</p>

      {primary && (
        <div className="card mt-6 !bg-ink-900 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Trial context</p>
          <h2 className="mt-1 text-lg font-bold">{primary.trialName}</h2>
          <p className="mt-1 text-sm text-ink-200">Estimated cost: £{primary.estimatedCostGbp.toLocaleString('en-GB')} · Composite score: {primary.compositeScore}/100</p>
        </div>
      )}

      <form className="card mt-6 space-y-5" onSubmit={handleSubmit}>
        <ResultRadio label="Performance result" value={form.performanceResult} onChange={(v) => update('performanceResult', v)} error={errors.performanceResult} />
        <ResultRadio label="Manufacturing result" value={form.manufacturingResult} onChange={(v) => update('manufacturingResult', v)} error={errors.manufacturingResult} />
        <ResultRadio label="Regulatory result" value={form.regulatoryResult} onChange={(v) => update('regulatoryResult', v)} error={errors.regulatoryResult} />

        <div>
          <span className="field-label">Overall result</span>
          <div className="flex gap-4">
            {['Successful', 'Unsuccessful'].map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="radio" name="overall" checked={form.overallResult === v} onChange={() => update('overallResult', v)} />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="failureReason">Failure reason {['Fail'].some((f) => [form.performanceResult, form.manufacturingResult, form.regulatoryResult].includes(f)) && <span className="text-red-600">*</span>}</label>
          <textarea id="failureReason" rows={2} className="field-input" value={form.failureReason} onChange={(e) => update('failureReason', e.target.value)} />
          {errors.failureReason && <p className="field-error">{errors.failureReason}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Measured OTR</label>
            <input type="number" step="0.1" className="field-input" value={form.measuredOtr} onChange={(e) => update('measuredOtr', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Measured WVTR</label>
            <input type="number" step="0.1" className="field-input" value={form.measuredWvtr} onChange={(e) => update('measuredWvtr', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Measured seal strength</label>
            <input type="number" step="0.1" className="field-input" value={form.measuredSealStrength} onChange={(e) => update('measuredSealStrength', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Notes</label>
            <textarea rows={2} className="field-input" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Date of trial</label>
            <input type="date" className="field-input" value={form.trialDate} onChange={(e) => update('trialDate', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/projects/${id}/recommendation`)}>← Back to Recommendation</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Result & Re-optimise →'}</button>
        </div>
      </form>
    </div>
  );
}

function ResultRadio({ label, value, onChange, error }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex gap-4">
        {['Pass', 'Fail'].map((v) => (
          <label key={v} className="flex items-center gap-2 text-sm text-ink-700">
            <input type="radio" checked={value === v} onChange={() => onChange(v)} />
            {v}
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
