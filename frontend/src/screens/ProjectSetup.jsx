import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import Icon from '../components/Icon';
import ActionBar from '../components/ActionBar';
import { clearDraft, readDraft, useDraft } from '../hooks/useDraft';
import { LayerStack, ScoreRing, parseLayers } from '../components/charts';
import { STAGES } from '../utils/stages';

const PRODUCT_TYPES = ['Fresh Food', 'Ambient Food', 'Frozen Food', 'Consumer Goods', 'Industrial', 'Other'];
const RECYCLABILITY_STATUS = ['Recyclable', 'Non-Recyclable', 'Unknown'];
const RECYCLING_STREAMS = ['UK EPR Household', 'UK EPR Industrial', 'EU PPWR', 'Other'];
const PRIORITIES = [
  { v: 'Recyclability', d: 'Hit the recycling target above all' },
  { v: 'Cost', d: 'Keep trial and unit cost down' },
  { v: 'Performance', d: 'Protect barrier and seal quality' },
  { v: 'Regulatory', d: 'Be safe against the strictest rule' },
];
const PANELS = [
  { label: 'Project', hint: 'Name & objective', icon: 'doc' },
  { label: 'Today', hint: 'Existing laminate', icon: 'layers' },
  { label: 'Target', hint: 'Mono-material goal', icon: 'target' },
];

const emptyForm = {
  name: '', productType: 'Fresh Food', description: '', transitionObjective: '',
  existingMaterial: '', layerStructure: '', currentShelfLifeMonths: '', currentOtr: '', currentWvtr: '',
  currentRecyclabilityStatus: 'Unknown',
  targetMaterialType: '', targetRecyclabilityPercent: '', targetRecyclingStream: 'UK EPR Household', transitionPriority: 'Recyclability',
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default function ProjectSetup() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const stage = STAGES[0];

  const draftKey = `setup:${id || 'new'}`;
  const [panel, setPanel] = useState(0);
  const [form, setForm] = useState(() => (isEdit ? emptyForm : readDraft(draftKey) || emptyForm));
  const [baseline, setBaseline] = useState(isEdit ? null : emptyForm); // what the server last returned
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useDraft(draftKey, form, baseline, !loading); // §8.2: survive navigating away mid-form

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const [{ data: p }, { data: s }] = await Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/specification`)]);
        const sp = s.specification;
        const loaded = {
          ...emptyForm,
          name: p.project.name, productType: p.project.productType,
          description: p.project.description, transitionObjective: p.project.transitionObjective,
          ...(sp ? {
            existingMaterial: sp.existingMaterial || '', layerStructure: sp.layerStructure || '',
            currentShelfLifeMonths: sp.currentShelfLifeMonths ?? '', currentOtr: sp.currentOtr ?? '', currentWvtr: sp.currentWvtr ?? '',
            currentRecyclabilityStatus: sp.currentRecyclabilityStatus || 'Unknown',
            targetMaterialType: sp.targetMaterialType || '', targetRecyclabilityPercent: sp.targetRecyclabilityPercent ?? '',
            targetRecyclingStream: sp.targetRecyclingStream || 'UK EPR Household', transitionPriority: sp.transitionPriority || 'Recyclability',
          } : {}),
        };
        setBaseline(loaded);
        setForm(readDraft(draftKey) || loaded);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function validateProject() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.transitionObjective.trim()) errs.transitionObjective = 'Transition objective is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goto(next) {
    if (panel === 0 && next > 0 && !validateProject()) { toast.error('Please complete the highlighted fields first.'); return; }
    setPanel(next);
  }

  async function save(continueToNext) {
    if (!validateProject()) { setPanel(0); toast.error('Please complete the highlighted fields first.'); return; }
    setSaving(true);
    try {
      const base = { name: form.name, productType: form.productType, description: form.description, transitionObjective: form.transitionObjective };
      let projectId = id;
      if (!isEdit) projectId = (await api.post('/projects', base)).data.project.id;
      else await api.patch(`/projects/${id}`, base);

      const num = (v) => (v === '' ? null : Number(v));
      await api.post(`/projects/${projectId}/specification`, {
        existingMaterial: form.existingMaterial, layerStructure: form.layerStructure,
        currentShelfLifeMonths: num(form.currentShelfLifeMonths), currentOtr: num(form.currentOtr), currentWvtr: num(form.currentWvtr),
        currentRecyclabilityStatus: form.currentRecyclabilityStatus,
        targetMaterialType: form.targetMaterialType, targetRecyclabilityPercent: num(form.targetRecyclabilityPercent),
        targetRecyclingStream: form.targetRecyclingStream, transitionPriority: form.transitionPriority,
      });
      clearDraft(draftKey);
      toast.success(continueToNext ? 'Saved — on to requirements.' : 'Draft saved.');
      navigate(continueToNext ? `/projects/${projectId}/requirements` : '/projects');
    } catch (err) {
      const details = apiErrorDetails(err);
      if (details) setErrors((prev) => ({ ...prev, ...details }));
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading project…" />;

  const layers = parseLayers(form.layerStructure);
  const statusClass = form.currentRecyclabilityStatus === 'Recyclable' ? 'badge-green' : form.currentRecyclabilityStatus === 'Non-Recyclable' ? 'badge-red' : 'badge-slate';

  return (
    <div className="space-y-5">
      {!isEdit && (
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700"><Icon name="folder" className="h-3.5 w-3.5" /> Projects</Link>
      )}
      <StepHeader
        stage={stage} step={1}
        title={isEdit ? 'Edit the transition' : 'Define the transition'}
        blurb="Describe what you make today and what you want to make instead. The canvas on the right builds as you type."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ------------------------------------------------- Guided form */}
        <section className="tile">
          <div role="tablist" aria-label="Setup sections" className="grid grid-cols-3 gap-2 rounded-2xl bg-ink-50 p-1.5">
            {PANELS.map((p, i) => (
              <button
                key={p.label} type="button" role="tab" aria-selected={panel === i} onClick={() => goto(i)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-xs font-bold transition-all ${panel === i ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500 hover:text-ink-800'}`}
              >
                <Icon name={p.icon} className="h-5 w-5" />
                {p.label}
                <span className="hidden font-medium text-ink-400 sm:block">{p.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {panel === 0 && (
              <>
                <Field label="Project name" error={errors.name}><input className="field-input" value={form.name} onChange={set('name')} placeholder="e.g. Fresh Food Tray Lidding — PE/PA to Mono-PE" /></Field>
                <Field label="Product type">
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_TYPES.map((t) => (
                      <button key={t} type="button" aria-pressed={form.productType === t} onClick={() => setForm({ ...form, productType: t })}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${form.productType === t ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'}`}>{t}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Description" error={errors.description}><textarea rows={2} className="field-input" value={form.description} onChange={set('description')} /></Field>
                <Field label="Transition objective" error={errors.transitionObjective}>
                  <textarea rows={3} className="field-input" value={form.transitionObjective} onChange={set('transitionObjective')} placeholder="We are transitioning from [X] to [Y] in order to [Z]" />
                </Field>
              </>
            )}

            {panel === 1 && (
              <>
                <Field label="Current material"><input className="field-input" value={form.existingMaterial} onChange={set('existingMaterial')} placeholder="e.g. 80µm PE/PA laminate" /></Field>
                <Field label="Layer structure — separate layers with “/”">
                  <input className="field-input" value={form.layerStructure} onChange={set('layerStructure')} placeholder="PE outer / tie / PA barrier / tie / PE sealant" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="OTR (cc/m²/day)"><input type="number" step="0.1" min="0" className="field-input" value={form.currentOtr} onChange={set('currentOtr')} /></Field>
                  <Field label="WVTR (g/m²/day)"><input type="number" step="0.1" min="0" className="field-input" value={form.currentWvtr} onChange={set('currentWvtr')} /></Field>
                  <Field label="Shelf-life (months)"><input type="number" step="0.1" min="0" className="field-input" value={form.currentShelfLifeMonths} onChange={set('currentShelfLifeMonths')} /></Field>
                  <Field label="Recyclability today">
                    <select className="field-input" value={form.currentRecyclabilityStatus} onChange={set('currentRecyclabilityStatus')}>{RECYCLABILITY_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
                  </Field>
                </div>
              </>
            )}

            {panel === 2 && (
              <>
                <Field label="Target material"><input className="field-input" value={form.targetMaterialType} onChange={set('targetMaterialType')} placeholder="e.g. Recyclable Mono-PE" /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Target recyclability (%)"><input type="number" min="0" max="100" className="field-input" value={form.targetRecyclabilityPercent} onChange={set('targetRecyclabilityPercent')} /></Field>
                  <Field label="Recycling stream">
                    <select className="field-input" value={form.targetRecyclingStream} onChange={set('targetRecyclingStream')}>{RECYCLING_STREAMS.map((s) => <option key={s}>{s}</option>)}</select>
                  </Field>
                </div>
                <Field label="What matters most?">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRIORITIES.map((p) => (
                      <button key={p.v} type="button" aria-pressed={form.transitionPriority === p.v} onClick={() => setForm({ ...form, transitionPriority: p.v })}
                        className={`rounded-xl p-3 text-left ring-1 ring-inset transition-all ${form.transitionPriority === p.v ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-brand-300'}`}>
                        <span className="block text-sm font-bold text-ink-900">{p.v}</span>
                        <span className="block text-xs text-ink-500">{p.d}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </div>

        </section>

        {/* ------------------------------------------------- Live transition canvas */}
        <aside className="tile bg-gradient-to-b from-white to-brand-50/40 lg:sticky lg:top-36 lg:self-start" aria-label="Transition canvas">
          <p className="eyebrow">Transition canvas</p>
          <div className="mt-4 grid items-center gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Today</h3>
                <span className={statusClass}>{form.currentRecyclabilityStatus}</span>
              </div>
              <LayerStack layers={layers} />
              <p className="mt-2 truncate text-xs font-medium text-ink-600">{form.existingMaterial || 'Existing material'}</p>
              <p className="font-mono text-[11px] text-ink-400">OTR {form.currentOtr || '—'} · WVTR {form.currentWvtr || '—'}</p>
            </div>
            <span className="mx-auto flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-brand-600 text-white shadow-raised"><Icon name="arrow" /></span>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Target</h3>
                <span className="badge-green">{form.targetRecyclingStream}</span>
              </div>
              <LayerStack mono monoLabel={form.targetMaterialType} />
              <div className="mt-3 flex items-center gap-3">
                <ScoreRing value={Number(form.targetRecyclabilityPercent) || 0} size={58} stroke={7} color="#1a7c6a" track="#d5f3ea" textClass="text-ink-900" sub="%" />
                <p className="text-xs leading-snug text-ink-500">recyclability target<br /><span className="font-semibold text-ink-700">Priority: {form.transitionPriority}</span></p>
              </div>
            </div>
          </div>
          <blockquote className="mt-6 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-600 ring-1 ring-brand-900/10">
            {form.transitionObjective || 'Your transition objective will appear here as you write it.'}
          </blockquote>
        </aside>
      </div>

      <ActionBar
        status={<span>Section <strong className="text-white">{panel + 1} of {PANELS.length}</strong> <span className="text-white/60">· {PANELS[panel].label}</span></span>}
      >
        <button type="button" className="btn-ghost-dark" disabled={saving} onClick={() => save(false)}>Save draft</button>
        {panel > 0 && <button type="button" className="btn-ghost-dark" onClick={() => goto(panel - 1)}>Back</button>}
        {panel < PANELS.length - 1 ? (
          <button type="button" className="btn-cta" onClick={() => goto(panel + 1)}>Next: {PANELS[panel + 1].label} <Icon name="arrow" className="h-4 w-4" /></button>
        ) : (
          <button type="button" className="btn-cta" disabled={saving} onClick={() => save(true)}>{saving ? 'Saving…' : 'Save & define requirements'} <Icon name="arrow" className="h-4 w-4" /></button>
        )}
      </ActionBar>
    </div>
  );
}
