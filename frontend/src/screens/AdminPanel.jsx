import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';

const SECTIONS = ['All Projects', 'Materials Library', 'Regulatory Rules', 'Scoring Weights', 'System Status', 'Reset Scenarios'];

export default function AdminPanel() {
  const [section, setSection] = useState('All Projects');

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="w-56 shrink-0">
        <nav className="card !p-2" aria-label="Admin navigation">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                section === s ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-ink-900">Admin Panel</h1>
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

function AllProjects() {
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function resetOne(projectId) {
    try {
      await api.post('/admin/scenarios/reset', { projectId });
      toast.success('Project reset to baseline.');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <div className="card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-semibold uppercase text-ink-400">
            <th className="py-2 pr-4">Project</th>
            <th className="py-2 pr-4">Product type</th>
            <th className="py-2 pr-4">Stage</th>
            <th className="py-2 pr-4">Updated</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-ink-50">
              <td className="py-2 pr-4 font-medium text-ink-800">{p.name}</td>
              <td className="py-2 pr-4 text-ink-500">{p.productType}</td>
              <td className="py-2 pr-4"><ProgressStepper currentStage={p.stage} stagesCompleted={p.stagesCompleted} /></td>
              <td className="py-2 pr-4 text-ink-500">{new Date(p.updatedAt).toLocaleDateString('en-GB')}</td>
              <td className="py-2 pr-4">
                <button type="button" className="btn-secondary text-xs" onClick={() => resetOne(p.id)}>Reset Scenario</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaterialsLibrary() {
  const toast = useToast();
  const [materials, setMaterials] = useState(null);

  async function load() {
    const { data } = await api.get('/admin/materials');
    setMaterials(data.materials);
  }
  useEffect(() => { load().catch((err) => toast.error(apiErrorMessage(err))); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(m) {
    try {
      await api.patch(`/admin/materials/${m.id}/active`, { active: !m.active });
      toast.success(`${m.name} ${m.active ? 'disabled' : 'enabled'}.`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (!materials) return <LoadingBlock />;

  return (
    <div className="card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-semibold uppercase text-ink-400">
            <th className="py-2 pr-4">Material</th>
            <th className="py-2 pr-4">OTR</th>
            <th className="py-2 pr-4">WVTR</th>
            <th className="py-2 pr-4">UK EPR %</th>
            <th className="py-2 pr-4">Cost</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className={`border-b border-ink-50 ${m.active === false ? 'opacity-50' : ''}`}>
              <td className="py-2 pr-4 font-medium text-ink-800">{m.name}</td>
              <td className="py-2 pr-4">{m.otr}</td>
              <td className="py-2 pr-4">{m.wvtr}</td>
              <td className="py-2 pr-4">{m.ukEprRecyclabilityPercent}%</td>
              <td className="py-2 pr-4">£{m.baseTrialCostGbp.toLocaleString('en-GB')}</td>
              <td className="py-2 pr-4">{m.active === false ? <span className="badge-red">Disabled</span> : <span className="badge-green">Active</span>}</td>
              <td className="py-2 pr-4">
                <button type="button" className="btn-secondary text-xs" onClick={() => toggleActive(m)}>
                  {m.active === false ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegulatoryRules() {
  const toast = useToast();
  const [regs, setRegs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/regulations').then((r) => setRegs(r.data.regulations)).catch((err) => toast.error(apiErrorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    try {
      await api.patch('/admin/regulations', regs);
      toast.success('Regulatory rules updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!regs) return <LoadingBlock />;

  return (
    <div className="card space-y-6">
      {['ukEpr', 'euPpwr'].map((key) => (
        <div key={key}>
          <h3 className="text-sm font-bold text-ink-900">{regs[key].label}</h3>
          <p className="mt-1 text-xs text-ink-500">{regs[key].description}</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Compliant threshold (%)</label>
              <input
                type="number" className="field-input"
                value={regs[key].compliantThreshold}
                onChange={(e) => setRegs({ ...regs, [key]: { ...regs[key], compliantThreshold: Number(e.target.value) } })}
              />
            </div>
            <div>
              <label className="field-label">Conditional threshold (%)</label>
              <input
                type="number" className="field-input"
                value={regs[key].conditionalThreshold}
                onChange={(e) => setRegs({ ...regs, [key]: { ...regs[key], conditionalThreshold: Number(e.target.value) } })}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</button>
    </div>
  );
}

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
    <div className="card space-y-5">
      <p className="text-sm text-ink-500">Five dimension weights must sum to 100%.</p>
      {Object.entries(weights).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-sm">
            <label htmlFor={key} className="font-medium text-ink-700">{WEIGHT_LABELS[key] || key}</label>
            <span className="font-bold text-ink-800">{Math.round(value * 100)}%</span>
          </div>
          <input
            id={key} type="range" min="0" max="1" step="0.01" value={value}
            onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
            className="w-full accent-brand-600"
          />
        </div>
      ))}
      <p className={`text-sm font-semibold ${validTotal ? 'text-brand-700' : 'text-red-600'}`}>Total: {Math.round(total * 100)}%</p>
      <button type="button" className="btn-primary" disabled={!validTotal || saving} onClick={save}>{saving ? 'Saving…' : 'Save Weights'}</button>
    </div>
  );
}

function SystemStatus() {
  const toast = useToast();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/admin/status').then((r) => setStatus(r.data.status)).catch((err) => toast.error(apiErrorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) return <LoadingBlock />;

  return (
    <div className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Total projects" value={status.totalProjects} />
      <Stat label="Total users" value={status.totalUsers} />
      <Stat label="Last reset" value={status.lastResetAt ? new Date(status.lastResetAt).toLocaleString('en-GB') : 'Never'} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-ink-50 p-4">
      <p className="text-xs font-semibold uppercase text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-800">{value}</p>
    </div>
  );
}

function ResetScenarios() {
  const toast = useToast();
  const [resetting, setResetting] = useState(false);

  async function resetAll() {
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
    <div className="card">
      <h3 className="text-sm font-bold text-ink-900">Batch reset</h3>
      <p className="mt-1 text-sm text-ink-500">Resets every demonstration project to its baseline state (specification entered, no trials or results) — use before a new investor demonstration.</p>
      <button type="button" className="btn-danger mt-4" disabled={resetting} onClick={resetAll}>
        {resetting ? 'Resetting…' : 'Reset All Demo Scenarios'}
      </button>
    </div>
  );
}
