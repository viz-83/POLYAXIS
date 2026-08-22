import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';

const PRODUCT_TYPES = ['Fresh Food', 'Ambient Food', 'Frozen Food', 'Consumer Goods', 'Industrial', 'Other'];
const RECYCLABILITY_STATUS = ['Recyclable', 'Non-Recyclable', 'Unknown'];
const RECYCLING_STREAMS = ['UK EPR Household', 'UK EPR Industrial', 'EU PPWR', 'Other'];
const PRIORITIES = ['Recyclability', 'Cost', 'Performance', 'Regulatory'];

const emptyForm = {
  name: '', productType: 'Fresh Food', description: '', transitionObjective: '',
  existingMaterial: '', layerStructure: '', currentShelfLifeMonths: '', currentOtr: '', currentWvtr: '',
  currentRecyclabilityStatus: 'Unknown',
  targetMaterialType: '', targetRecyclabilityPercent: '', targetRecyclingStream: 'UK EPR Household', transitionPriority: 'Recyclability',
};

export default function ProjectSetup() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const [{ data: p }, { data: s }] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/specification`),
        ]);
        setProject(p.project);
        setForm((prev) => ({
          ...prev,
          name: p.project.name,
          productType: p.project.productType,
          description: p.project.description,
          transitionObjective: p.project.transitionObjective,
          ...(s.specification
            ? {
                existingMaterial: s.specification.existingMaterial || '',
                layerStructure: s.specification.layerStructure || '',
                currentShelfLifeMonths: s.specification.currentShelfLifeMonths ?? '',
                currentOtr: s.specification.currentOtr ?? '',
                currentWvtr: s.specification.currentWvtr ?? '',
                currentRecyclabilityStatus: s.specification.currentRecyclabilityStatus || 'Unknown',
                targetMaterialType: s.specification.targetMaterialType || '',
                targetRecyclabilityPercent: s.specification.targetRecyclabilityPercent ?? '',
                targetRecyclingStream: s.specification.targetRecyclingStream || 'UK EPR Household',
                transitionPriority: s.specification.transitionPriority || 'Recyclability',
              }
            : {}),
        }));
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required.';
    if (!form.productType) errs.productType = 'Select a product type.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.transitionObjective.trim()) errs.transitionObjective = 'Transition objective is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e, continueToNext) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      let projectId = id;
      if (!isEdit) {
        const { data } = await api.post('/projects', {
          name: form.name, productType: form.productType, description: form.description, transitionObjective: form.transitionObjective,
        });
        projectId = data.project.id;
      } else {
        await api.patch(`/projects/${id}`, {
          name: form.name, productType: form.productType, description: form.description, transitionObjective: form.transitionObjective,
        });
      }

      await api.post(`/projects/${projectId}/specification`, {
        existingMaterial: form.existingMaterial,
        layerStructure: form.layerStructure,
        currentShelfLifeMonths: form.currentShelfLifeMonths === '' ? null : Number(form.currentShelfLifeMonths),
        currentOtr: form.currentOtr === '' ? null : Number(form.currentOtr),
        currentWvtr: form.currentWvtr === '' ? null : Number(form.currentWvtr),
        currentRecyclabilityStatus: form.currentRecyclabilityStatus,
        targetMaterialType: form.targetMaterialType,
        targetRecyclabilityPercent: form.targetRecyclabilityPercent === '' ? null : Number(form.targetRecyclabilityPercent),
        targetRecyclingStream: form.targetRecyclingStream,
        transitionPriority: form.transitionPriority,
      });

      toast.success(continueToNext ? 'Saved. Continuing to Requirements.' : 'Draft saved.');
      if (continueToNext) navigate(`/projects/${projectId}/requirements`);
      else navigate('/projects');
    } catch (err) {
      const details = apiErrorDetails(err);
      if (details) setErrors((prev) => ({ ...prev, ...details }));
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading project…" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {project && (
        <div className="mb-6">
          <ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} />
        </div>
      )}
      <h1 className="text-2xl font-bold text-ink-900">{isEdit ? 'Edit Project Setup' : 'New Packaging Transition Project'}</h1>
      <p className="mt-1 text-sm text-ink-500">Define the project, the existing packaging structure, and the target outcome.</p>

      <form className="mt-6 space-y-6" onSubmit={(e) => handleSubmit(e, true)}>
        <section className="card space-y-4">
          <h2 className="text-base font-semibold text-ink-900">Project Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="name">Project name</label>
              <input id="name" className="field-input" value={form.name} onChange={(e) => update('name', e.target.value)} />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="productType">Product type</label>
              <select id="productType" className="field-input" value={form.productType} onChange={(e) => update('productType', e.target.value)}>
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.productType && <p className="field-error">{errors.productType}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="description">Description</label>
              <textarea id="description" rows={2} className="field-input" value={form.description} onChange={(e) => update('description', e.target.value)} />
              {errors.description && <p className="field-error">{errors.description}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="objective">Transition objective</label>
              <textarea
                id="objective" rows={2} className="field-input" value={form.transitionObjective}
                onChange={(e) => update('transitionObjective', e.target.value)}
                placeholder="We are transitioning from [X] to [Y] in order to [Z]"
              />
              {errors.transitionObjective && <p className="field-error">{errors.transitionObjective}</p>}
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold text-ink-900">Existing Packaging Specification</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="existingMaterial">Current material description</label>
              <input id="existingMaterial" className="field-input" value={form.existingMaterial} onChange={(e) => update('existingMaterial', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="layerStructure">Layer structure summary</label>
              <input id="layerStructure" className="field-input" value={form.layerStructure} onChange={(e) => update('layerStructure', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="shelfLife">Current shelf-life (months)</label>
              <input id="shelfLife" type="number" step="0.1" min="0" className="field-input" value={form.currentShelfLifeMonths} onChange={(e) => update('currentShelfLifeMonths', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="recyclability">Current recyclability status</label>
              <select id="recyclability" className="field-input" value={form.currentRecyclabilityStatus} onChange={(e) => update('currentRecyclabilityStatus', e.target.value)}>
                {RECYCLABILITY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="currentOtr">Current OTR (cc/m²/day)</label>
              <input id="currentOtr" type="number" step="0.1" min="0" className="field-input" value={form.currentOtr} onChange={(e) => update('currentOtr', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="currentWvtr">Current WVTR (g/m²/day)</label>
              <input id="currentWvtr" type="number" step="0.1" min="0" className="field-input" value={form.currentWvtr} onChange={(e) => update('currentWvtr', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold text-ink-900">Target Packaging</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="targetMaterialType">Target material type</label>
              <input id="targetMaterialType" className="field-input" value={form.targetMaterialType} onChange={(e) => update('targetMaterialType', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="targetRecyclabilityPercent">Target recyclability (%)</label>
              <input id="targetRecyclabilityPercent" type="number" step="1" min="0" max="100" className="field-input" value={form.targetRecyclabilityPercent} onChange={(e) => update('targetRecyclabilityPercent', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="targetRecyclingStream">Target recycling stream</label>
              <select id="targetRecyclingStream" className="field-input" value={form.targetRecyclingStream} onChange={(e) => update('targetRecyclingStream', e.target.value)}>
                {RECYCLING_STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="transitionPriority">Transition priority</label>
              <select id="transitionPriority" className="field-input" value={form.transitionPriority} onChange={(e) => update('transitionPriority', e.target.value)}>
                {PRIORITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" disabled={saving} onClick={(e) => handleSubmit(e, false)}>
            Save Draft
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue to Requirements →'}
          </button>
        </div>
      </form>
    </div>
  );
}
