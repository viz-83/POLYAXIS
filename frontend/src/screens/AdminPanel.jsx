import { useEffect, useState } from 'react';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StageDots from '../components/StageDots';
import StepHeader from '../components/StepHeader';
import Section from '../components/Section';
import Tabs from '../components/Tabs';
import Icon from '../components/Icon';
import { THEMES } from '../utils/stages';

// `key` doubles as the section name used by the switch below.
const SECTIONS = [
  { key: 'All Projects', label: 'Projects', icon: 'folder' },
  { key: 'Materials Library', label: 'Materials', icon: 'flask' },
  { key: 'Regulatory Rules', label: 'Regulation', icon: 'scale' },
  { key: 'Scoring Weights', label: 'Scoring', icon: 'sliders' },
  { key: 'System Status', label: 'System', icon: 'gauge' },
  { key: 'Reset Scenarios', label: 'Reset', icon: 'loop' },
];
const ADMIN_STAGE = { theme: THEMES.ink, icon: 'shield' };

export default function AdminPanel() {
  const [section, setSection] = useState('All Projects');

  return (
    <div className="space-y-5">
      <StepHeader stage={ADMIN_STAGE} kicker="Administration" title="Admin panel" blurb="Manage demonstration scenarios, the materials library, regulatory thresholds and the engine's scoring weights." />
      <Tabs tabs={SECTIONS} value={section} onChange={setSection} label="Admin sections" />
      <main className="min-w-0">
        {section === 'All Projects' && <AllProjects />}
        {section === 'Materials Library' && <MaterialsLibrary />}
        {section === 'Regulatory Rules' && <RegulatoryRules />}
        {section === 'Scoring Weights' && <ScoringWeights />}
        {section === 'System Status' && <SystemStatus />}
        {section === 'Reset Scenarios' && <ResetScenarios />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ All projects */
function AllProjects() {
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/scenarios');
      setProjects(data.projects);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function resetOne(p) {
    if (!window.confirm(`Reset "${p.name}" to its baseline? Trial results are deleted${p.isDemo ? ' and its inputs are restored to the seeded values' : ''}.`)) return;
    try {
      await api.post('/admin/scenarios/reset', { projectId: p.id });
      toast.success('Project reset to baseline.');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function resetAll() {
    if (!window.confirm('Reset ALL demonstration projects to baseline? Their trial results are deleted and their inputs restored.')) return;
    setBusy(true);
    try {
      const { data } = await api.post('/admin/scenarios/reset', {});
      toast.success(`${data.resetCount} demonstration projects reset to baseline.`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <Section
      title="All projects" hint="Every project across all users" icon="folder" bodyClass="overflow-x-auto p-3 sm:p-4"
      actions={<button type="button" className="btn-danger !py-2 text-xs" disabled={busy} onClick={resetAll}>{busy ? 'Resetting…' : 'Reset all demo scenarios'}</button>}
    >
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            <th className="py-2 pr-4">Project</th>
            <th className="py-2 pr-4">Owner</th>
            <th className="py-2 pr-4">Product type</th>
            <th className="py-2 pr-4">Stage</th>
            <th className="py-2 pr-4">Updated</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-ink-50 align-middle">
              <td className="max-w-[16rem] py-2.5 pr-4 font-medium text-ink-800">{p.name} {p.isDemo && <span className="badge-slate ml-1">Demo</span>}</td>
              <td className="py-2.5 pr-4 text-ink-600">{p.ownerName}</td>
              <td className="py-2.5 pr-4 text-ink-600">{p.productType}</td>
              <td className="py-2.5 pr-4"><StageDots stage={p.stage} stagesCompleted={p.stagesCompleted} /></td>
              <td className="py-2.5 pr-4 text-ink-600">{new Date(p.updatedAt).toLocaleDateString('en-GB')}</td>
              <td className="py-2.5 text-right"><button type="button" className="btn-secondary !py-1.5 text-xs" onClick={() => resetOne(p)}>Reset scenario</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/* ------------------------------------------------------------------ Materials library */
const TEXT_FIELDS = [
  ['name', 'Name', 'sm:col-span-2'], ['polymerFamily', 'Polymer family', ''], ['barrierType', 'Barrier type', ''],
  ['layerStructure', 'Layer structure', 'sm:col-span-2'], ['typicalShelfLifeSuitability', 'Shelf-life suitability', 'sm:col-span-2'],
];
const NUMBER_FIELDS = [
  ['otr', 'OTR (cc/m²/day)'], ['wvtr', 'WVTR (g/m²/day)'], ['baseTrialCostGbp', 'Trial cost (£)'],
  ['sealTempMinC', 'Seal temp min (°C)'], ['sealTempMaxC', 'Seal temp max (°C)'],
  ['processingTempMinC', 'Processing temp min (°C)'], ['processingTempMaxC', 'Processing temp max (°C)'],
  ['minLineSpeedMpm', 'Line speed min (m/min)'], ['maxLineSpeedMpm', 'Line speed max (m/min)'],
  ['ukEprRecyclabilityPercent', 'UK EPR recyclability (%)'], ['euPpwrRecyclabilityPercent', 'EU PPWR recyclability (%)'],
];
const BLANK_MATERIAL = Object.fromEntries([...TEXT_FIELDS.map(([k]) => [k, '']), ...NUMBER_FIELDS.map(([k]) => [k, ''])]);

function MaterialModal({ material, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(material?.id);
  const [form, setForm] = useState(() => (isEdit ? Object.fromEntries(Object.keys(BLANK_MATERIAL).map((k) => [k, material[k] ?? ''])) : BLANK_MATERIAL));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {};
      for (const [k] of TEXT_FIELDS) payload[k] = form[k];
      for (const [k] of NUMBER_FIELDS) if (form[k] !== '') payload[k] = Number(form[k]);
      if (isEdit) await api.patch(`/admin/materials/${material.id}`, payload);
      else await api.post('/admin/materials', payload);
      toast.success(isEdit ? 'Material updated.' : 'Material added to the library.');
      onSaved();
    } catch (err) {
      const details = apiErrorDetails(err);
      if (details) setErrors(details);
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 sm:py-10" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit material' : 'Add material'}>
      <form onSubmit={save} className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-float sm:p-6" noValidate>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{isEdit ? `Edit ${material.name}` : 'Add a material'}</h2>
          <button type="button" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map(([k, label, span]) => (
            <div key={k} className={span}>
              <label className="field-label" htmlFor={`m-${k}`}>{label}</label>
              <input id={`m-${k}`} className="field-input" value={form[k]} onChange={upd(k)} aria-invalid={Boolean(errors[k])} />
              {errors[k] && <p className="field-error">{errors[k]}</p>}
            </div>
          ))}
          {NUMBER_FIELDS.map(([k, label]) => (
            <div key={k}>
              <label className="field-label" htmlFor={`m-${k}`}>{label}</label>
              <input id={`m-${k}`} type="number" step="any" className="field-input" value={form[k]} onChange={upd(k)} aria-invalid={Boolean(errors[k])} />
              {errors[k] && <p className="field-error">{errors[k]}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add material'}</button>
        </div>
      </form>
    </div>
  );
}

function MaterialsLibrary() {
  const toast = useToast();
  const [materials, setMaterials] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | material

  async function load() {
    const { data } = await api.get('/admin/materials');
    setMaterials(data.materials);
  }
  useEffect(() => { load().catch((err) => toast.error(apiErrorMessage(err))); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(m) {
    try {
      await api.patch(`/admin/materials/${m.id}/active`, { active: m.active === false });
      toast.success(`${m.name} ${m.active === false ? 'enabled' : 'disabled'}.`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (!materials) return <LoadingBlock />;

  return (
    <>
      <Section
        title="Materials library" hint={`${materials.length} materials · disabled ones are hidden from users`} icon="flask" bodyClass="overflow-x-auto p-3 sm:p-4"
        actions={<button type="button" className="btn-primary !py-2 text-xs" onClick={() => setEditing({})}><Icon name="plus" className="h-4 w-4" /> Add material</button>}
      >
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="py-2 pr-4">Material</th><th className="py-2 pr-4">OTR</th><th className="py-2 pr-4">WVTR</th>
              <th className="py-2 pr-4">UK EPR %</th><th className="py-2 pr-4">Cost</th><th className="py-2 pr-4">Status</th><th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className={`border-b border-ink-50 ${m.active === false ? 'opacity-60' : ''}`}>
                <td className="py-2.5 pr-4"><span className="font-mono text-[10px] text-brand-600">{m.id}</span><p className="font-medium text-ink-800">{m.name}</p></td>
                <td className="py-2.5 pr-4 font-mono">{m.otr}</td>
                <td className="py-2.5 pr-4 font-mono">{m.wvtr}</td>
                <td className="py-2.5 pr-4 font-mono">{m.ukEprRecyclabilityPercent}%</td>
                <td className="py-2.5 pr-4 font-mono">£{m.baseTrialCostGbp.toLocaleString('en-GB')}</td>
                <td className="py-2.5 pr-4">{m.active === false ? <span className="badge-red">Disabled</span> : <span className="badge-green">Active</span>}</td>
                <td className="whitespace-nowrap py-2.5 text-right">
                  <button type="button" className="btn-secondary !py-1.5 text-xs" onClick={() => setEditing(m)}>Edit</button>{' '}
                  <button type="button" className="btn-secondary !py-1.5 text-xs" onClick={() => toggleActive(m)}>{m.active === false ? 'Enable' : 'Disable'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {editing && <MaterialModal material={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

/* ------------------------------------------------------------------ Regulatory rules */
function RegulatoryRules() {
  const toast = useToast();
  const [regs, setRegs] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/regulations').then((r) => setRegs(r.data.regulations)).catch((err) => toast.error(apiErrorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api.patch('/admin/regulations', regs);
      setRegs(data.regulations);
      toast.success('Regulatory rules updated.');
    } catch (err) {
      setErrors(apiErrorDetails(err) || {});
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!regs) return <LoadingBlock />;

  return (
    <Section title="Regulatory rules" hint="Recyclability thresholds applied to every material" icon="shield" actions={<button type="button" className="btn-primary !py-2 text-xs" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {['ukEpr', 'euPpwr'].map((key) => (
          <div key={key} className="rounded-xl bg-ink-50 p-4">
            <h3 className="text-sm font-bold text-ink-900">{regs[key].label}</h3>
            <p className="mt-1 text-xs text-ink-500">{regs[key].description}</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[['compliantThreshold', 'Compliant ≥ (%)'], ['conditionalThreshold', 'Conditional ≥ (%)']].map(([f, label]) => (
                <div key={f}>
                  <label className="field-label">{label}</label>
                  <input type="number" className="field-input" value={regs[key][f]} aria-invalid={Boolean(errors[`${key}.${f}`])}
                    onChange={(e) => setRegs({ ...regs, [key]: { ...regs[key], [f]: e.target.value === '' ? '' : Number(e.target.value) } })} />
                  {errors[`${key}.${f}`] && <p className="field-error">{errors[`${key}.${f}`]}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Scoring weights */
const WEIGHT_LABELS = {
  informationGain: 'Information Gain', feasibility: 'Manufacturing Feasibility',
  uncertaintyReduction: 'Uncertainty Reduction', regulatory: 'Regulatory Compliance', cost: 'Cost (inverse)',
};

function ScoringWeights() {
  const toast = useToast();
  const [weights, setWeights] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/scoring').then((r) => setWeights(r.data.scoring.weights)).catch((err) => toast.error(apiErrorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!weights) return <LoadingBlock />;

  const total = Object.values(weights).reduce((s, v) => s + Number(v), 0);
  const validTotal = Math.abs(total - 1) < 0.01;

  function normalise() {
    if (total === 0) return;
    setWeights(Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Math.round((v / total) * 100) / 100])));
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch('/admin/scoring', { weights });
      toast.success('Scoring weights updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Scoring weights" hint="The five dimensions must sum to 100%" icon="sliders" bodyClass="space-y-5 p-4 sm:p-5">
      {Object.entries(weights).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-sm">
            <label htmlFor={key} className="font-medium text-ink-700">{WEIGHT_LABELS[key] || key}</label>
            <span className="font-mono font-bold text-ink-800">{Math.round(value * 100)}%</span>
          </div>
          <input id={key} type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })} className="w-full accent-brand-600" />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
        <p className={`text-sm font-semibold ${validTotal ? 'text-brand-700' : 'text-red-600'}`}>Total: {Math.round(total * 100)}% {validTotal ? '✓' : '— must equal 100%'}</p>
        <div className="flex gap-2">
          {!validTotal && <button type="button" className="btn-secondary" onClick={normalise}>Normalise to 100%</button>}
          <button type="button" className="btn-primary" disabled={!validTotal || saving} onClick={save}>{saving ? 'Saving…' : 'Save weights'}</button>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ System status */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-800">{value}</p>
    </div>
  );
}

const formatBytes = (b) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);

function SystemStatus() {
  const toast = useToast();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/admin/status').then((r) => setStatus(r.data.status)).catch((err) => toast.error(apiErrorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) return <LoadingBlock />;

  return (
    <div className="space-y-5">
      <Section title="System status" icon="gauge">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Active sessions" value={status.activeSessions} />
          <Stat label="Projects" value={status.totalProjects} />
          <Stat label="Users" value={status.totalUsers} />
          <Stat label="Uptime" value={`${Math.floor(status.uptimeSeconds / 60)} min`} />
          <Stat label="Last reset" value={status.lastResetAt ? new Date(status.lastResetAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'} />
        </div>
      </Section>
      <Section title="Data files" hint="JSON storage in backend/data" icon="doc" bodyClass="p-3 sm:p-4">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          {status.dataFiles.map((f) => (
            <li key={f.name} className="flex items-center justify-between border-b border-ink-50 py-1.5 text-sm"><span className="font-mono text-xs text-ink-700">{f.name}</span><span className="font-mono text-xs text-ink-500">{formatBytes(f.bytes)}</span></li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ Reset scenarios */
function ResetScenarios() {
  const toast = useToast();
  const [resetting, setResetting] = useState(false);

  async function resetAll() {
    if (!window.confirm('Reset ALL demonstration projects to baseline? Their trial results are deleted and their inputs restored.')) return;
    setResetting(true);
    try {
      const { data } = await api.post('/admin/scenarios/reset', {});
      toast.success(`${data.resetCount} demonstration projects reset to baseline.`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  return (
    <Section title="Batch reset" hint="Prepare for a new demonstration" icon="loop">
      <p className="text-sm text-ink-600">Returns every seeded demonstration project to its baseline: specification, requirements and constraints restored to their seeded values, and all trials and results deleted. Projects created by users are left alone — reset those individually from <strong>All Projects</strong>.</p>
      <button type="button" className="btn-danger mt-4" disabled={resetting} onClick={resetAll}>
        {resetting ? 'Resetting…' : 'Reset all demo scenarios'}
      </button>
    </Section>
  );
}
