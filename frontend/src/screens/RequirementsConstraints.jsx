import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorDetails, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingBlock } from '../components/Loading';
import StepHeader from '../components/StepHeader';
import Section from '../components/Section';
import ActionBar from '../components/ActionBar';
import Icon from '../components/Icon';
import { WindowStrip } from '../components/charts';
import { STAGES } from '../utils/stages';
import { clearDraft, readDraft, useDraft } from '../hooks/useDraft';

const EQUIPMENT_TYPES = ['Blown Film Line', 'Cast Film Line', 'Extrusion Coating Line', 'Flexographic Printing Line', 'Lamination Line', 'Rotogravure Line'];
const SENSITIVITIES = [
  { v: 'Standard', d: 'Typical shelf-stable product', icon: 'layers' },
  { v: 'Moisture-Sensitive', d: 'Must stay dry — WVTR matters most', icon: 'wind' },
  { v: 'Oxygen-Sensitive', d: 'Fresh produce, fats — OTR matters most', icon: 'flask' },
  { v: 'Both', d: 'Needs a tight barrier on both', icon: 'shield' },
];
const PRIORITIES = ['UK EPR', 'EU PPWR', 'Most Restrictive'];
const ZONES = [
  { key: 'perf', label: 'Performance', desc: 'What the film must do', icon: 'gauge' },
  { key: 'line', label: 'Production line', desc: 'What your line can run', icon: 'factory' },
  { key: 'reg', label: 'Regulation', desc: 'Which rules apply', icon: 'shield' },
];

/**
 * Mirrors ConstraintChecker so the chart previews feasibility live. Temperature also needs the overlap
 * to cover half of the material's window (`needsCoverage`); line speed passes on any overlap.
 */
function windowStatus(mFrom, mTo, rFrom, rTo, tolerance, needsCoverage) {
  if (rFrom === '' || rTo === '' || rFrom == null || rTo == null) return 'pass';
  const overlap = Math.min(rTo, mTo) - Math.max(rFrom, mFrom);
  if (overlap >= 0) return !needsCoverage || overlap / (mTo - mFrom || 1) >= 0.5 ? 'pass' : 'conditional';
  return Math.abs(overlap) <= tolerance ? 'conditional' : 'fail';
}

function LibraryDots({ values, target, label }) {
  const t = target === '' ? null : Number(target);
  const sorted = [...values].sort((a, b) => a - b);
  const meeting = t == null ? 0 : sorted.filter((v) => v <= t).length;
  return (
    <div className="mt-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {sorted.map((v, i) => <span key={i} title={`${v}`} className={`h-3 flex-1 rounded-full transition-colors ${t != null && v <= t ? 'bg-brand-500' : 'bg-ink-200'}`} />)}
      </div>
      <p className="mt-1.5 text-xs text-ink-500">{t == null ? `Enter a ${label} target to see how the library compares.` : <><strong className="text-brand-700">{meeting} of {sorted.length}</strong> library materials meet this target.</>}</p>
    </div>
  );
}

function NumField({ label, unit, value, onChange, step = 'any', min = 0, max, error }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input type="number" step={step} min={min} max={max} aria-invalid={Boolean(error)} className={`field-input pr-14 ${error ? '!ring-2 !ring-red-400' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
        {unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-ink-400">{unit}</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function FrameworkCard({ name, blurb, enabled, mandatory, onToggle, onMandatory }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 transition-all ${enabled ? 'bg-brand-50/70 ring-2 ring-brand-500' : 'bg-white ring-ink-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold">{name}</h3>
          <p className="mt-1 text-sm text-ink-500">{blurb}</p>
        </div>
        <button type="button" onClick={onToggle} aria-pressed={enabled} aria-label={`Apply ${name}`} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-ink-200'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {enabled && (
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-brand-200" role="radiogroup" aria-label={`${name} strictness`}>
          {[[true, 'Mandatory', 'Excludes failures'], [false, 'Monitoring', 'Scores only']].map(([v, l, d]) => (
            <button key={l} type="button" role="radio" aria-checked={mandatory === v} onClick={() => onMandatory(v)} className={`rounded-lg px-3 py-2 text-left transition-colors ${mandatory === v ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'}`}>
              <span className="block text-sm font-bold">{l}</span>
              <span className={`block text-[11px] ${mandatory === v ? 'text-brand-100' : 'text-ink-400'}`}>{d}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RequirementsConstraints() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const stage = STAGES[1];
  const [zone, setZone] = useState('perf');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [library, setLibrary] = useState([]);

  const draftKey = `requirements:${id}`;
  const [reqs, setReqs] = useState({ otrTarget: '', wvtrTarget: '', sealStrengthMinimum: '', shelfLifeRequirementMonths: '', productSensitivity: 'Standard', recyclabilityTargetPercent: 70, additionalParameters: '' });
  const [mfg, setMfg] = useState({ equipmentTypes: [], temperatureMinC: '', temperatureMaxC: '', lineSpeedMinMpm: '', lineSpeedMaxMpm: '', materialCompatibilityNote: '', constraintFlexibility: 'Hard' });
  const [reg, setReg] = useState({ ukEprEnabled: true, ukEprMandatory: true, euPpwrEnabled: false, euPpwrMandatory: false, classificationPriority: 'UK EPR', notes: '' });
  const [baseline, setBaseline] = useState(null); // what the server last returned

  // §8.2: unsaved edits across all three zones survive navigating to another screen and back.
  useDraft(draftKey, { reqs, mfg, reg }, baseline, !loading);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: r }, { data: m }, { data: g }, { data: lib }] = await Promise.all([
          api.get(`/projects/${id}/requirements`), api.get(`/projects/${id}/manufacturing`), api.get(`/projects/${id}/regulatory`), api.get('/materials'),
        ]);
        setLibrary(lib.materials);
        const n = (v) => v ?? '';
        const nextReqs = r.requirements ? { ...r.requirements, otrTarget: n(r.requirements.otrTarget), wvtrTarget: n(r.requirements.wvtrTarget), sealStrengthMinimum: n(r.requirements.sealStrengthMinimum), shelfLifeRequirementMonths: n(r.requirements.shelfLifeRequirementMonths), recyclabilityTargetPercent: n(r.requirements.recyclabilityTargetPercent) } : reqs;
        const nextMfg = m.manufacturing ? { ...m.manufacturing, temperatureMinC: n(m.manufacturing.temperatureMinC), temperatureMaxC: n(m.manufacturing.temperatureMaxC), lineSpeedMinMpm: n(m.manufacturing.lineSpeedMinMpm), lineSpeedMaxMpm: n(m.manufacturing.lineSpeedMaxMpm) } : mfg;
        const nextReg = g.regulatory || reg;
        setBaseline({ reqs: nextReqs, mfg: nextMfg, reg: nextReg });
        const draft = readDraft(draftKey);
        setReqs(draft?.reqs || nextReqs);
        setMfg(draft?.mfg || nextMfg);
        setReg(draft?.reg || nextReg);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = {
    perf: reqs.otrTarget !== '' && reqs.wvtrTarget !== '',
    line: mfg.equipmentTypes.length > 0 && mfg.temperatureMinC !== '' && mfg.temperatureMaxC !== '' && mfg.lineSpeedMinMpm !== '' && mfg.lineSpeedMaxMpm !== '',
    reg: reg.ukEprEnabled || reg.euPpwrEnabled,
  };
  const doneCount = Object.values(done).filter(Boolean).length;

  const numOrNull = (v) => (v === '' || v == null ? null : Number(v));
  const tempRows = useMemo(() => library.map((m) => ({
    id: m.id, label: m.name, from: m.processingTempMinC, to: m.processingTempMaxC,
    status: windowStatus(m.processingTempMinC, m.processingTempMaxC, numOrNull(mfg.temperatureMinC), numOrNull(mfg.temperatureMaxC), 10, true),
  })), [library, mfg.temperatureMinC, mfg.temperatureMaxC]);
  const speedRows = useMemo(() => library.map((m) => ({
    id: m.id, label: m.name, from: m.minLineSpeedMpm, to: m.maxLineSpeedMpm,
    status: windowStatus(m.minLineSpeedMpm, m.maxLineSpeedMpm, numOrNull(mfg.lineSpeedMinMpm), numOrNull(mfg.lineSpeedMaxMpm), 15, false),
  })), [library, mfg.lineSpeedMinMpm, mfg.lineSpeedMaxMpm]);

  const scale = (rows, a, b) => {
    const vals = [...rows.flatMap((r) => [r.from, r.to]), numOrNull(a), numOrNull(b)].filter((v) => v != null);
    return [Math.floor((Math.min(...vals) - 10) / 10) * 10, Math.ceil((Math.max(...vals) + 10) / 10) * 10];
  };

  function toggleEquipment(type) {
    setMfg((p) => ({ ...p, equipmentTypes: p.equipmentTypes.includes(type) ? p.equipmentTypes.filter((t) => t !== type) : [...p.equipmentTypes, type] }));
  }

  async function saveAll(next) {
    setSaving(true);
    setErrors({});
    try {
      await api.post(`/projects/${id}/requirements`, { ...reqs, otrTarget: numOrNull(reqs.otrTarget), wvtrTarget: numOrNull(reqs.wvtrTarget), sealStrengthMinimum: numOrNull(reqs.sealStrengthMinimum), shelfLifeRequirementMonths: numOrNull(reqs.shelfLifeRequirementMonths), recyclabilityTargetPercent: numOrNull(reqs.recyclabilityTargetPercent) });
      await api.post(`/projects/${id}/manufacturing`, { ...mfg, temperatureMinC: numOrNull(mfg.temperatureMinC), temperatureMaxC: numOrNull(mfg.temperatureMaxC), lineSpeedMinMpm: numOrNull(mfg.lineSpeedMinMpm), lineSpeedMaxMpm: numOrNull(mfg.lineSpeedMaxMpm) });
      await api.post(`/projects/${id}/regulatory`, reg);
      clearDraft(draftKey);
      setBaseline({ reqs, mfg, reg });
      toast.success('Requirements and constraints saved.');
      if (next) navigate(`/projects/${id}/materials`);
    } catch (err) {
      // SPEC-07: show the server's field-level messages inline and jump to the zone that holds the first one.
      const details = apiErrorDetails(err);
      if (details) {
        setErrors(details);
        const first = Object.keys(details)[0];
        if (['temperatureMinC', 'temperatureMaxC', 'lineSpeedMinMpm', 'lineSpeedMaxMpm', 'equipmentTypes', 'constraintFlexibility'].includes(first)) setZone('line');
        else if (first === 'classificationPriority') setZone('reg');
        else setZone('perf');
      }
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading requirements…" />;

  const [tMin, tMax] = scale(tempRows, mfg.temperatureMinC, mfg.temperatureMaxC);
  const [sMin, sMax] = scale(speedRows, mfg.lineSpeedMinMpm, mfg.lineSpeedMaxMpm);
  const set = (k) => (v) => setReqs((p) => ({ ...p, [k]: v }));
  const setM = (k) => (v) => setMfg((p) => ({ ...p, [k]: v }));
  const zoneIdx = ZONES.findIndex((z) => z.key === zone);

  return (
    <div className="space-y-5">
      <StepHeader stage={stage} step={2} title="Set the targets and the limits" blurb="What the film must achieve, what your line can run, and which regulations apply. Charts react as you type." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Zone rail */}
        <nav className="lg:sticky lg:top-36 lg:self-start" aria-label="Requirement zones">
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            {ZONES.map((z) => (
              <li key={z.key}>
                <button type="button" onClick={() => setZone(z.key)} aria-current={zone === z.key ? 'true' : undefined}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-xl p-3 text-center ring-1 transition-all lg:flex-row lg:gap-3 lg:text-left ${zone === z.key ? 'bg-brand-600 text-white shadow-raised ring-brand-600' : 'bg-white text-ink-600 ring-brand-900/10 hover:ring-brand-300'}`}>
                  <Icon name={z.icon} className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{z.label}</span>
                    <span className={`hidden text-xs lg:block ${zone === z.key ? 'text-white' : 'text-ink-400'}`}>{z.desc}</span>
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done[z.key] ? (zone === z.key ? 'bg-white text-brand-700' : 'bg-brand-600 text-white') : zone === z.key ? 'bg-brand-500' : 'bg-ink-100'}`}>
                    {done[z.key] && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          {zone === 'perf' && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Section title="Oxygen barrier" hint="Lower OTR is better" icon="flask">
                  <NumField label="OTR target — at most" unit="cc/m²/day" value={reqs.otrTarget} onChange={set('otrTarget')} error={errors.otrTarget} />
                  <LibraryDots values={library.map((m) => m.otr)} target={reqs.otrTarget} label="OTR" />
                </Section>
                <Section title="Moisture barrier" hint="Lower WVTR is better" icon="wind">
                  <NumField label="WVTR target — at most" unit="g/m²/day" value={reqs.wvtrTarget} onChange={set('wvtrTarget')} error={errors.wvtrTarget} />
                  <LibraryDots values={library.map((m) => m.wvtr)} target={reqs.wvtrTarget} label="WVTR" />
                </Section>
              </div>
              <Section title="Product sensitivity" hint="Shifts the weight between OTR and WVTR" icon="shield">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {SENSITIVITIES.map((s) => (
                    <button key={s.v} type="button" aria-pressed={reqs.productSensitivity === s.v} onClick={() => set('productSensitivity')(s.v)}
                      className={`rounded-xl p-3.5 text-left ring-1 transition-all ${reqs.productSensitivity === s.v ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-brand-300'}`}>
                      <Icon name={s.icon} className={`h-5 w-5 ${reqs.productSensitivity === s.v ? 'text-brand-700' : 'text-ink-400'}`} />
                      <span className="mt-1.5 block text-sm font-bold">{s.v}</span>
                      <span className="block text-xs text-ink-500">{s.d}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Seal, shelf life & recyclability" icon="gauge">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <NumField label="Minimum seal strength" unit="N/15mm" value={reqs.sealStrengthMinimum} onChange={set('sealStrengthMinimum')} error={errors.sealStrengthMinimum} />
                  <NumField label="Shelf-life required" unit="months" value={reqs.shelfLifeRequirementMonths} onChange={set('shelfLifeRequirementMonths')} error={errors.shelfLifeRequirementMonths} />
                  <div>
                    <label className="field-label" htmlFor="rec">Recyclability target</label>
                    <div className="flex items-center gap-3">
                      <input id="rec" type="range" min="0" max="100" value={reqs.recyclabilityTargetPercent === '' ? 0 : reqs.recyclabilityTargetPercent} onChange={(e) => set('recyclabilityTargetPercent')(Number(e.target.value))} className="w-full accent-brand-600" />
                      <span className="w-14 text-right font-mono text-lg font-semibold text-brand-700">{reqs.recyclabilityTargetPercent || 0}%</span>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="field-label">Anything else the film must do?</label>
                    <textarea rows={2} className="field-input" value={reqs.additionalParameters} onChange={(e) => set('additionalParameters')(e.target.value)} />
                  </div>
                </div>
              </Section>
            </>
          )}

          {zone === 'line' && (
            <>
              <Section title="Equipment" hint="Select every line this film will run on" icon="factory">
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_TYPES.map((t) => (
                    <button key={t} type="button" aria-pressed={mfg.equipmentTypes.includes(t)} onClick={() => toggleEquipment(t)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-colors ${mfg.equipmentTypes.includes(t) ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-600 ring-ink-200 hover:bg-brand-50'}`}>{t}</button>
                  ))}
                </div>
              </Section>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Section title="Operating temperature" hint="Dashed band = your line" icon="thermo"
                  actions={<div className="flex gap-2"><div className="w-24"><NumField label="Min °C" value={mfg.temperatureMinC} onChange={setM('temperatureMinC')} error={errors.temperatureMinC} /></div><div className="w-24"><NumField label="Max °C" value={mfg.temperatureMaxC} onChange={setM('temperatureMaxC')} error={errors.temperatureMaxC} /></div></div>}>
                  <div className="overflow-x-auto"><div className="min-w-[340px]"><WindowStrip compact scaleMin={tMin} scaleMax={tMax} unit="°C" rows={tempRows} line={mfg.temperatureMinC !== '' && mfg.temperatureMaxC !== '' ? { min: Number(mfg.temperatureMinC), max: Number(mfg.temperatureMaxC), label: `${mfg.temperatureMinC}–${mfg.temperatureMaxC}°C` } : null} /></div></div>
                </Section>
                <Section title="Line speed" hint="Misses turn amber, then red" icon="wind"
                  actions={<div className="flex gap-2"><div className="w-24"><NumField label="Min m/min" value={mfg.lineSpeedMinMpm} onChange={setM('lineSpeedMinMpm')} error={errors.lineSpeedMinMpm} /></div><div className="w-24"><NumField label="Max m/min" value={mfg.lineSpeedMaxMpm} onChange={setM('lineSpeedMaxMpm')} error={errors.lineSpeedMaxMpm} /></div></div>}>
                  <div className="overflow-x-auto"><div className="min-w-[340px]"><WindowStrip compact scaleMin={sMin} scaleMax={sMax} unit="m/min" rows={speedRows} line={mfg.lineSpeedMinMpm !== '' && mfg.lineSpeedMaxMpm !== '' ? { min: Number(mfg.lineSpeedMinMpm), max: Number(mfg.lineSpeedMaxMpm), label: `${mfg.lineSpeedMinMpm}–${mfg.lineSpeedMaxMpm} m/min` } : null} /></div></div>
                </Section>
              </div>
              <Section title="Compatibility & strictness" icon="sliders">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="field-label">Material compatibility note</label>
                    <input className="field-input" value={mfg.materialCompatibilityNote} onChange={(e) => setM('materialCompatibilityNote')(e.target.value)} placeholder="e.g. PE-compatible sealing unit only" />
                  </div>
                  <div>
                    <span className="field-label">When a limit is missed…</span>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1" role="radiogroup" aria-label="Constraint flexibility">
                      {[['Hard', 'Exclude it', 'Non-negotiable'], ['Soft', 'Score it down', 'Adjustable']].map(([v, l, d]) => (
                        <button key={v} type="button" role="radio" aria-checked={mfg.constraintFlexibility === v} onClick={() => setM('constraintFlexibility')(v)} className={`rounded-lg px-3 py-2 text-left transition-colors ${mfg.constraintFlexibility === v ? 'bg-white shadow-card' : 'text-ink-500'}`}>
                          <span className="block text-sm font-bold">{l}</span><span className="block text-[11px] text-ink-400">{d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </>
          )}

          {zone === 'reg' && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FrameworkCard name="UK EPR" blurb="Extended Producer Responsibility — recyclability of packaging placed on the UK market." enabled={reg.ukEprEnabled} mandatory={reg.ukEprMandatory} onToggle={() => setReg({ ...reg, ukEprEnabled: !reg.ukEprEnabled })} onMandatory={(v) => setReg({ ...reg, ukEprMandatory: v })} />
                <FrameworkCard name="EU PPWR" blurb="Packaging & Packaging Waste Regulation — 2030 design-for-recycling criteria." enabled={reg.euPpwrEnabled} mandatory={reg.euPpwrMandatory} onToggle={() => setReg({ ...reg, euPpwrEnabled: !reg.euPpwrEnabled })} onMandatory={(v) => setReg({ ...reg, euPpwrMandatory: v })} />
              </div>
              <Section title="Priority & notes" icon="doc">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="field-label">If the frameworks disagree, follow…</label>
                    <select className="field-input" value={reg.classificationPriority} onChange={(e) => setReg({ ...reg, classificationPriority: e.target.value })}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
                  </div>
                  <div>
                    <label className="field-label">Regulatory notes</label>
                    <textarea rows={2} className="field-input" value={reg.notes} onChange={(e) => setReg({ ...reg, notes: e.target.value })} />
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>

      <ActionBar status={<span><strong className="text-white">{doneCount} of 3</strong> zones complete{doneCount < 3 && <span className="text-white/60"> · {ZONES.filter((z) => !done[z.key]).map((z) => z.label).join(', ')} still open</span>}</span>}>
        {zoneIdx < ZONES.length - 1 && <button type="button" className="btn-ghost-dark" onClick={() => setZone(ZONES[zoneIdx + 1].key)}>Next: {ZONES[zoneIdx + 1].label} <Icon name="arrow" className="h-4 w-4" /></button>}
        <button type="button" className="btn-ghost-dark" disabled={saving} onClick={() => saveAll(false)}>Save</button>
        <button type="button" className="btn-cta" disabled={saving} onClick={() => saveAll(true)}>{saving ? 'Saving…' : 'Save & map materials'} <Icon name="arrow" className="h-4 w-4" /></button>
      </ActionBar>
    </div>
  );
}
