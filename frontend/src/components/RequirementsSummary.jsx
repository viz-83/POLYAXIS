import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Section from './Section';
import Icon from './Icon';

const COLLAPSE_KEY = 'polyaxis_req_summary_collapsed';

/** The user's saved choice wins; otherwise fall back to the screen's default. */
function readCollapsed(fallback) {
  try {
    const stored = sessionStorage.getItem(COLLAPSE_KEY);
    return stored === null ? fallback : stored === '1';
  } catch { return fallback; }
}
function writeCollapsed(v) {
  try { sessionStorage.setItem(COLLAPSE_KEY, v ? '1' : '0'); } catch { /* storage unavailable — fine */ }
}

/** A headline target: big mono number with its unit underneath. */
function Target({ label, value, unit }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3 ring-1 ring-brand-900/10">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xl font-bold leading-tight text-brand-700">
        <span className="text-sm font-semibold text-ink-500">≤ </span>{value}
      </p>
      <p className="truncate text-[11px] text-ink-500">{unit}</p>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-brand-900/5 py-1.5 first:border-t-0">
      <dt className="shrink-0 text-xs text-ink-500">{label}</dt>
      <dd className="min-w-0 text-right font-mono text-xs font-semibold text-ink-900">{children}</dd>
    </div>
  );
}

function Group({ icon, title, children, className = '' }) {
  return (
    <div className={`min-w-0 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-900/5 ${className}`}>
      <h4 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wide text-brand-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-900/10"><Icon name={icon} className="h-3.5 w-3.5" /></span>
        {title}
      </h4>
      {children}
    </div>
  );
}

/** SPEC-09: a compact reminder of the entered requirements, shown on the Materials and Recommendation screens. */
export default function RequirementsSummary({ projectId, defaultCollapsed = false }) {
  const [d, setD] = useState(null);
  const [collapsed, setCollapsed] = useState(() => readCollapsed(defaultCollapsed));

  useEffect(() => {
    let live = true;
    Promise.all([
      api.get(`/projects/${projectId}/requirements`),
      api.get(`/projects/${projectId}/manufacturing`),
      api.get(`/projects/${projectId}/regulatory`),
    ]).then(([r, m, g]) => {
      if (live) setD({ req: r.data.requirements, mfg: m.data.manufacturing, reg: g.data.regulatory });
    }).catch(() => {});
    return () => { live = false; };
  }, [projectId]);

  if (!d || (!d.req && !d.mfg && !d.reg)) return null;
  const { req, mfg, reg } = d;
  const fw = [];
  if (reg?.ukEprEnabled) fw.push({ name: 'UK EPR', mandatory: !!reg.ukEprMandatory });
  if (reg?.euPpwrEnabled) fw.push({ name: 'EU PPWR', mandatory: !!reg.euPpwrMandatory });

  const toggle = () => { const next = !collapsed; setCollapsed(next); writeCollapsed(next); };

  // One line of the essentials, shown when the card is collapsed.
  const brief = [
    req?.otrTarget != null && `OTR ≤ ${req.otrTarget}`,
    req?.wvtrTarget != null && `WVTR ≤ ${req.wvtrTarget}`,
    mfg?.equipmentTypes?.length > 0 && mfg.equipmentTypes.join(', '),
    fw.length > 0 && fw.map((f) => f.name).join(' + '),
  ].filter(Boolean).join('  ·  ');

  return (
    <Section
      title="Your requirements"
      hint={collapsed ? brief || 'What every candidate is checked against' : 'What every candidate is checked against'}
      icon="sliders"
      bodyClass={collapsed ? 'hidden' : 'p-3 sm:p-4'}
      actions={(
        <>
          <Link to={`/projects/${projectId}/requirements`} className="btn-secondary !px-3 !py-1.5 !text-xs">Edit</Link>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Show requirement details' : 'Hide requirement details'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Icon name={collapsed ? 'down' : 'up'} className="h-4 w-4" />
          </button>
        </>
      )}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Group icon="gauge" title="Performance">
          {(req?.otrTarget != null || req?.wvtrTarget != null) && (
            <div className="mb-2 grid grid-cols-2 gap-2">
              {req?.otrTarget != null && <Target label="OTR" value={req.otrTarget} unit="cc/m²/day" />}
              {req?.wvtrTarget != null && <Target label="WVTR" value={req.wvtrTarget} unit="g/m²/day" />}
            </div>
          )}
          <dl>
            {req?.sealStrengthMinimum != null && <Row label="Seal strength ≥">{req.sealStrengthMinimum} N/15mm</Row>}
            {req?.shelfLifeRequirementMonths != null && <Row label="Shelf life">{req.shelfLifeRequirementMonths} months</Row>}
            {req?.productSensitivity && <Row label="Sensitivity">{req.productSensitivity}</Row>}
          </dl>
        </Group>

        <Group icon="factory" title="Production line">
          <dl>
            {mfg?.equipmentTypes?.length > 0 && <Row label="Equipment">{mfg.equipmentTypes.join(', ')}</Row>}
            {mfg?.temperatureMinC != null && <Row label="Temperature">{mfg.temperatureMinC}–{mfg.temperatureMaxC} °C</Row>}
            {mfg?.lineSpeedMinMpm != null && <Row label="Line speed">{mfg.lineSpeedMinMpm}–{mfg.lineSpeedMaxMpm} m/min</Row>}
            {mfg && (
              <Row label="Limits">
                <span title={mfg.constraintFlexibility === 'Soft' ? 'Soft limits can be traded off' : 'Hard limits must be met'} className={`whitespace-nowrap ${mfg.constraintFlexibility === 'Soft' ? 'badge-slate' : 'badge-amber'}`}>
                  {mfg.constraintFlexibility === 'Soft' ? 'Soft' : 'Hard'}
                </span>
              </Row>
            )}
          </dl>
        </Group>

        <Group icon="scale" title="Regulation" className="sm:col-span-2 xl:col-span-1">
          <dl>
            {req?.recyclabilityTargetPercent != null && <Row label="Recyclability ≥">{req.recyclabilityTargetPercent}%</Row>}
          </dl>
          {fw.length > 0 ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Frameworks">
              {fw.map((f) => (
                <li key={f.name} className={f.mandatory ? 'badge-green' : 'badge-slate'}>
                  {f.name} · {f.mandatory ? 'mandatory' : 'monitoring'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-ink-500">No frameworks selected.</p>
          )}
        </Group>
      </div>
    </Section>
  );
}
