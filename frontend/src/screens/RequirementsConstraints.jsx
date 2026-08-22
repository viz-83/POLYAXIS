import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';

const EQUIPMENT_TYPES = ['Blown Film Line', 'Cast Film Line', 'Extrusion Coating Line', 'Flexographic Printing Line', 'Lamination Line', 'Rotogravure Line'];
const SENSITIVITIES = ['Standard', 'Moisture-Sensitive', 'Oxygen-Sensitive', 'Both'];
const PRIORITIES = ['UK EPR', 'EU PPWR', 'Most Restrictive'];
const TABS = ['Performance Requirements', 'Manufacturing Constraints', 'Regulatory Frameworks'];

export default function RequirementsConstraints() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);

  const [reqs, setReqs] = useState({
    otrTarget: '', wvtrTarget: '', sealStrengthMinimum: '', shelfLifeRequirementMonths: '',
    productSensitivity: 'Standard', recyclabilityTargetPercent: '', additionalParameters: '',
  });
  const [mfg, setMfg] = useState({
    equipmentTypes: [], temperatureMinC: '', temperatureMaxC: '', lineSpeedMinMpm: '', lineSpeedMaxMpm: '',
    materialCompatibilityNote: '', constraintFlexibility: 'Hard',
  });
  const [reg, setReg] = useState({
    ukEprEnabled: true, ukEprMandatory: true, euPpwrEnabled: false, euPpwrMandatory: false,
    classificationPriority: 'UK EPR', notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: p }, { data: r }, { data: m }, { data: g }] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/requirements`),
          api.get(`/projects/${id}/manufacturing`),
          api.get(`/projects/${id}/regulatory`),
        ]);
        setProject(p.project);
        if (r.requirements) setReqs({ ...r.requirements, otrTarget: r.requirements.otrTarget ?? '', wvtrTarget: r.requirements.wvtrTarget ?? '', sealStrengthMinimum: r.requirements.sealStrengthMinimum ?? '', shelfLifeRequirementMonths: r.requirements.shelfLifeRequirementMonths ?? '', recyclabilityTargetPercent: r.requirements.recyclabilityTargetPercent ?? '' });
        if (m.manufacturing) setMfg({ ...m.manufacturing, temperatureMinC: m.manufacturing.temperatureMinC ?? '', temperatureMaxC: m.manufacturing.temperatureMaxC ?? '', lineSpeedMinMpm: m.manufacturing.lineSpeedMinMpm ?? '', lineSpeedMaxMpm: m.manufacturing.lineSpeedMaxMpm ?? '' });
        if (g.regulatory) setReg(g.regulatory);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleEquipment(type) {
    setMfg((prev) => ({
      ...prev,
      equipmentTypes: prev.equipmentTypes.includes(type)
        ? prev.equipmentTypes.filter((t) => t !== type)
        : [...prev.equipmentTypes, type],
    }));
  }

  async function saveAll(continueNext) {
    setSaving(true);
    try {
      await api.post(`/projects/${id}/requirements`, {
        ...reqs,
        otrTarget: reqs.otrTarget === '' ? null : Number(reqs.otrTarget),
        wvtrTarget: reqs.wvtrTarget === '' ? null : Number(reqs.wvtrTarget),
        sealStrengthMinimum: reqs.sealStrengthMinimum === '' ? null : Number(reqs.sealStrengthMinimum),
        shelfLifeRequirementMonths: reqs.shelfLifeRequirementMonths === '' ? null : Number(reqs.shelfLifeRequirementMonths),
        recyclabilityTargetPercent: reqs.recyclabilityTargetPercent === '' ? null : Number(reqs.recyclabilityTargetPercent),
      });
      await api.post(`/projects/${id}/manufacturing`, {
        ...mfg,
        temperatureMinC: mfg.temperatureMinC === '' ? null : Number(mfg.temperatureMinC),
        temperatureMaxC: mfg.temperatureMaxC === '' ? null : Number(mfg.temperatureMaxC),
        lineSpeedMinMpm: mfg.lineSpeedMinMpm === '' ? null : Number(mfg.lineSpeedMinMpm),
        lineSpeedMaxMpm: mfg.lineSpeedMaxMpm === '' ? null : Number(mfg.lineSpeedMaxMpm),
      });
      await api.post(`/projects/${id}/regulatory`, reg);
      toast.success('Requirements and constraints saved.');
      if (continueNext) navigate(`/projects/${id}/materials`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading requirements…" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {project && (
        <div className="mb-6">
          <ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} />
        </div>
      )}
      <h1 className="text-2xl font-bold text-ink-900">Requirements & Constraints</h1>
      <p className="mt-1 text-sm text-ink-500">Define performance targets, manufacturing constraints, and applicable regulatory frameworks.</p>

      <div className="mt-6 flex gap-1 rounded-lg bg-ink-100 p-1">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              tab === i ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card mt-4 space-y-4">
        {tab === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="OTR target (cc/m²/day)" type="number" value={reqs.otrTarget} onChange={(v) => setReqs({ ...reqs, otrTarget: v })} />
            <Field label="WVTR target (g/m²/day)" type="number" value={reqs.wvtrTarget} onChange={(v) => setReqs({ ...reqs, wvtrTarget: v })} />
            <Field label="Seal strength minimum (N/15mm)" type="number" value={reqs.sealStrengthMinimum} onChange={(v) => setReqs({ ...reqs, sealStrengthMinimum: v })} />
            <Field label="Shelf-life requirement (months)" type="number" value={reqs.shelfLifeRequirementMonths} onChange={(v) => setReqs({ ...reqs, shelfLifeRequirementMonths: v })} />
            <div>
              <label className="field-label">Product sensitivity</label>
              <select className="field-input" value={reqs.productSensitivity} onChange={(e) => setReqs({ ...reqs, productSensitivity: e.target.value })}>
                {SENSITIVITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Recyclability target (%)" type="number" value={reqs.recyclabilityTargetPercent} onChange={(v) => setReqs({ ...reqs, recyclabilityTargetPercent: v })} />
            <div className="sm:col-span-2">
              <label className="field-label">Additional parameters</label>
              <textarea rows={2} className="field-input" value={reqs.additionalParameters} onChange={(e) => setReqs({ ...reqs, additionalParameters: e.target.value })} />
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-4">
            <div>
              <label className="field-label">Equipment type</label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleEquipment(type)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                      mfg.equipmentTypes.includes(type)
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Operating temperature — Min (°C)" type="number" value={mfg.temperatureMinC} onChange={(v) => setMfg({ ...mfg, temperatureMinC: v })} />
              <Field label="Operating temperature — Max (°C)" type="number" value={mfg.temperatureMaxC} onChange={(v) => setMfg({ ...mfg, temperatureMaxC: v })} />
              <Field label="Line speed — Min (m/min)" type="number" value={mfg.lineSpeedMinMpm} onChange={(v) => setMfg({ ...mfg, lineSpeedMinMpm: v })} />
              <Field label="Line speed — Max (m/min)" type="number" value={mfg.lineSpeedMaxMpm} onChange={(v) => setMfg({ ...mfg, lineSpeedMaxMpm: v })} />
            </div>
            <Field label="Material compatibility note" value={mfg.materialCompatibilityNote} onChange={(v) => setMfg({ ...mfg, materialCompatibilityNote: v })} placeholder="e.g. PE-compatible sealing unit only" />
            <div>
              <span className="field-label">Processing window flexibility</span>
              <div className="flex gap-4">
                {['Hard', 'Soft'].map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-ink-700">
                    <input type="radio" name="flexibility" checked={mfg.constraintFlexibility === v} onChange={() => setMfg({ ...mfg, constraintFlexibility: v })} />
                    {v === 'Hard' ? 'Hard constraint' : 'Soft preference'}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-4">
            <ToggleRow label="UK EPR" enabled={reg.ukEprEnabled} onToggle={() => setReg({ ...reg, ukEprEnabled: !reg.ukEprEnabled })}>
              {reg.ukEprEnabled && (
                <label className="flex items-center gap-2 text-xs text-ink-600">
                  <input type="checkbox" checked={reg.ukEprMandatory} onChange={(e) => setReg({ ...reg, ukEprMandatory: e.target.checked })} />
                  Mandatory (excludes non-compliant candidates)
                </label>
              )}
            </ToggleRow>
            <ToggleRow label="EU PPWR" enabled={reg.euPpwrEnabled} onToggle={() => setReg({ ...reg, euPpwrEnabled: !reg.euPpwrEnabled })}>
              {reg.euPpwrEnabled && (
                <label className="flex items-center gap-2 text-xs text-ink-600">
                  <input type="checkbox" checked={reg.euPpwrMandatory} onChange={(e) => setReg({ ...reg, euPpwrMandatory: e.target.checked })} />
                  Mandatory (excludes non-compliant candidates)
                </label>
              )}
            </ToggleRow>
            <div>
              <label className="field-label">Recyclability classification priority</label>
              <select className="field-input" value={reg.classificationPriority} onChange={(e) => setReg({ ...reg, classificationPriority: e.target.value })}>
                {PRIORITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Regulatory notes</label>
              <textarea rows={2} className="field-input" value={reg.notes} onChange={(e) => setReg({ ...reg, notes: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button type="button" className="btn-secondary" onClick={() => navigate(`/projects/${id}/setup`)}>← Back to Project Setup</button>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" disabled={saving} onClick={() => saveAll(false)}>Save</button>
          <button type="button" className="btn-primary" disabled={saving} onClick={() => saveAll(true)}>
            {saving ? 'Saving…' : 'Save & Continue to Candidate Alternatives →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} className="field-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle, children }) {
  return (
    <div className="rounded-lg border border-ink-100 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-800">{label}</span>
        <button
          type="button"
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-ink-200'}`}
          aria-pressed={enabled}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
