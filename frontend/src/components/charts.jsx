import { useEffect, useState } from 'react';
import { DIMS } from '../utils/stages';

/* ------------------------------------------------------------------ ScoreRing */
export function ScoreRing({ value, size = 132, stroke = 12, color = '#f5b83d', track = 'rgba(255,255,255,0.14)', textClass = 'text-white', sub = '/100' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`Score ${value} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={mounted ? c * (1 - pct / 100) : c}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${textClass}`}>
        <span className="font-mono font-semibold leading-none" style={{ fontSize: Math.max(13, Math.round(size * 0.26)) }}>{value}</span>
        <span className="mt-0.5 font-medium opacity-60" style={{ fontSize: size < 80 ? 9 : 10 }}>{sub}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ RadarChart */
export function RadarChart({ scores, size = 280, dark = false, accent = '#f5b83d' }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 74;
  const n = DIMS.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const ring = (v) => DIMS.map((_, i) => pt(i, v).join(',')).join(' ');
  const poly = DIMS.map((d, i) => pt(i, Math.max(0.04, scores[d.key] ?? 0)).join(',')).join(' ');
  const grid = dark ? 'rgba(255,255,255,0.16)' : 'rgba(16,21,28,0.12)';
  const label = dark ? "#cbd5e1" : "#485c6e";
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size }} role="img" aria-label="Radar chart of the five scoring dimensions">
      {[0.25, 0.5, 0.75, 1].map((v) => <polygon key={v} points={ring(v)} fill="none" stroke={grid} strokeWidth="1" />)}
      {DIMS.map((d, i) => { const [x, y] = pt(i, 1); return <line key={d.key} x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth="1" />; })}
      <polygon points={poly} fill={accent} fillOpacity="0.28" stroke={accent} strokeWidth="2.2" strokeLinejoin="round" />
      {DIMS.map((d, i) => {
        const [x, y] = pt(i, Math.max(0.04, scores[d.key] ?? 0));
        const [lx, ly] = pt(i, 1.16);
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
        return (
          <g key={d.key}>
            <circle cx={x} cy={y} r="4.5" fill={d.color} stroke={dark ? '#10151c' : '#fff'} strokeWidth="2" />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="12" fontWeight="600" fill={label}>{d.short}</text>
            <text x={lx} y={ly + 14} textAnchor={anchor} dominantBaseline="middle" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill={dark ? "#f1f5f9" : d.color}>{Math.round((scores[d.key] ?? 0) * 100)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ Sparkline */
export function Sparkline({ values, color = '#1a7c6a', height = 44, width = 200 }) {
  if (!values || values.length === 0) return null;
  const w = width;
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const x = (i) => (values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 12) + 6);
  const y = (v) => height - 6 - ((v - min) / (max - min || 1)) * (height - 12);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width={w} height={height} className="max-w-full" role="img" aria-label="Best score per optimisation run">
      {values.length > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4.5 : 3} fill={i === values.length - 1 ? color : '#fff'} stroke={color} strokeWidth="2" />)}
    </svg>
  );
}

/* ------------------------------------------------------------------ LayerStack */
const LAYER_COLORS = ['#78d1bc', '#a9b8c2', '#f5b83d', '#46b59d', '#d1d9df', '#ade6d6', '#7a8fa0', '#fad06a'];

export function parseLayers(text = '') {
  return text
    .split(/[/,+>|;]| then /i)
    .map((t) => t.trim())
    .filter((t) => t && !/^\d+[\s-]*layer/i.test(t) && !/co-?extru/i.test(t))
    .slice(0, 8);
}

export function LayerStack({ layers, mono = false, monoLabel = '', empty = 'Describe the layers to see them stacked' }) {
  if (mono) {
    return (
      <div className="space-y-1.5">
        <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 px-3 text-center text-sm font-semibold text-white shadow-inner">
          {monoLabel || 'Single polymer'}
        </div>
        <p className="text-center text-[11px] font-medium text-brand-700">One polymer family · recyclable stream</p>
      </div>
    );
  }
  if (!layers || layers.length === 0) {
    return <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-ink-200 px-3 text-center text-xs text-ink-400">{empty}</div>;
  }
  return (
    <ol className="space-y-1" aria-label="Layer structure">
      {layers.map((l, i) => (
        <li key={`${l}-${i}`} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-900 transition-all" style={{ background: `${LAYER_COLORS[i % LAYER_COLORS.length]}cc` }}>
          <span className="font-mono text-[10px] opacity-60">{i + 1}</span>{l}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ WindowStrip */
const WINDOW_COLORS = { pass: '#279a83', conditional: '#f5b83d', fail: '#f87171' };

/** Horizontal range chart: the production line's window (shaded) against each material's window. */
export function WindowStrip({ scaleMin, scaleMax, unit, line, rows, compact = false }) {
  const rowH = compact ? 'h-6' : 'h-8';
  const labelW = compact ? 'w-28 sm:w-32' : 'w-36 sm:w-44';
  const span = scaleMax - scaleMin || 1;
  const pos = (v) => `${Math.max(0, Math.min(100, ((v - scaleMin) / span) * 100))}%`;
  const width = (a, b) => `${Math.max(1.5, ((Math.min(b, scaleMax) - Math.max(a, scaleMin)) / span) * 100)}%`;
  const ticks = 5;
  return (
    <div role="img" aria-label={`Process windows in ${unit}`}>
      <div className="flex">
        <div className={`${labelW} shrink-0`} />
        <div className="relative h-9 flex-1 text-[10px] text-ink-400">
          {Array.from({ length: ticks }).map((_, i) => {
            const v = scaleMin + (span * i) / (ticks - 1);
            return <span key={i} className="absolute top-0 -translate-x-1/2 font-mono" style={{ left: `${(i / (ticks - 1)) * 100}%` }}>{Math.round(v)}</span>;
          })}
          {line && line.min != null && line.max != null && (
            <span className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-700" style={{ left: `calc((${pos(line.min)} + ${pos(line.max)}) / 2)` }}>{line.label}</span>
          )}
        </div>
      </div>
      <div className="flex">
        <div className={`${labelW} shrink-0`}>
          {rows.map((r) => <div key={r.id} className={`flex ${rowH} items-center truncate pr-3 text-xs font-medium text-ink-700`} title={r.label}>{r.label}</div>)}
        </div>
        <div className="relative flex-1 rounded-lg bg-ink-50">
          {line && line.min != null && line.max != null && (
            <div className="absolute inset-y-0 rounded-md border-x-2 border-dashed border-brand-500 bg-brand-400/15" style={{ left: pos(line.min), width: width(line.min, line.max) }}>
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className={`relative ${rowH}`}>
              <div className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full" style={{ left: pos(r.from), width: width(r.from, r.to), background: WINDOW_COLORS[r.status] || WINDOW_COLORS.pass, opacity: r.dim ? 0.35 : 1 }} title={`${r.label}: ${r.from}–${r.to} ${unit}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ ScatterPlot */
const W = 640;
const H = 400;
const M = { l: 58, r: 26, t: 26, b: 52 };

const STATUS_FILL = { ok: '#279a83', conditional: '#f5b83d', fail: '#f87171' };

/** Overall readiness. Frameworks marked "monitoring only" never downgrade a material — only mandatory ones do. */
export function materialStatus(o) {
  const frameworks = o.regulatoryCheck.frameworks || [];
  const mandatory = frameworks.filter((f) => f.mandatory).map((f) => f.status);
  const regStatus = frameworks.length ? (mandatory.includes('fail') ? 'fail' : mandatory.includes('conditional') ? 'conditional' : 'pass') : o.regulatoryCheck.status;
  if (o.manufacturingCheck.status === 'fail' || regStatus === 'fail') return 'fail';
  if (o.manufacturingCheck.status === 'conditional' || regStatus === 'conditional') return 'conditional';
  return 'ok';
}

/** OTR (x) vs WVTR (y) — lower is better on both, so the target zone sits bottom-left. */
export function ScatterPlot({ items, otrTarget, wvtrTarget, selected, hovered, onToggle, onHover }) {
  const xMax = Math.max(...items.map((i) => i.material.otr), otrTarget || 0) * 1.15;
  const yMax = Math.max(...items.map((i) => i.material.wvtr), wvtrTarget || 0) * 1.2;
  const px = (v) => M.l + (v / xMax) * (W - M.l - M.r);
  const py = (v) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const costs = items.map((i) => i.material.baseTrialCostGbp);
  const cMin = Math.min(...costs);
  const cMax = Math.max(...costs);
  const radius = (c) => 12 + ((c - cMin) / (cMax - cMin || 1)) * 9;
  const gx = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label="Material map: oxygen versus water-vapour transmission">
      {gx.map((g) => (
        <g key={g}>
          <line x1={M.l} x2={W - M.r} y1={py(yMax * g)} y2={py(yMax * g)} stroke="#e3e7ea" />
          <line y1={M.t} y2={H - M.b} x1={px(xMax * g)} x2={px(xMax * g)} stroke="#e3e7ea" />
          <text x={M.l - 8} y={py(yMax * g)} textAnchor="end" dominantBaseline="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#7a8fa0">{(yMax * g).toFixed(1)}</text>
          <text x={px(xMax * g)} y={H - M.b + 16} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#7a8fa0">{(xMax * g).toFixed(0)}</text>
        </g>
      ))}
      {otrTarget != null && wvtrTarget != null && (
        <g>
          <rect x={M.l} y={py(wvtrTarget)} width={px(otrTarget) - M.l} height={H - M.b - py(wvtrTarget)} fill="#279a83" fillOpacity="0.1" stroke="#279a83" strokeDasharray="5 4" rx="6" />
          <text x={M.l + 10} y={py(wvtrTarget) + 16} fontSize="11" fontWeight="700" fill="#186356">Target zone</text>
        </g>
      )}
      <text x={(M.l + W - M.r) / 2} y={H - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#485c6e">Oxygen transmission, OTR (cc/m²/day) →  lower is better</text>
      <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fontWeight="600" fill="#485c6e">Water vapour, WVTR (g/m²/day) →</text>
      {items.map((o) => {
        const m = o.material;
        const s = materialStatus(o);
        const isSel = selected.includes(m.id);
        const isHover = hovered === m.id;
        const r = radius(m.baseTrialCostGbp);
        return (
          <g
            key={m.id} tabIndex={0} role="button" aria-pressed={isSel}
            aria-label={`${m.name}: OTR ${m.otr}, WVTR ${m.wvtr}. ${isSel ? 'Selected' : 'Not selected'}`}
            className="cursor-pointer outline-none"
            onClick={() => onToggle(m.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(m.id); } }}
            onMouseEnter={() => onHover(m.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(m.id)} onBlur={() => onHover(null)}
          >
            <circle cx={px(m.otr)} cy={py(m.wvtr)} r={r + (isHover ? 3 : 0)} fill={STATUS_FILL[s]} fillOpacity={s === 'fail' ? 0.55 : 0.92} stroke={isSel ? '#174f46' : '#fff'} strokeWidth={isSel ? 4 : 2.5} style={{ transition: 'all .15s' }} />
            <text x={px(m.otr)} y={py(m.wvtr)} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill="#fff" pointerEvents="none">{m.id.slice(-2)}</text>
            {isSel && <circle cx={px(m.otr) + r - 2} cy={py(m.wvtr) - r + 2} r="7" fill="#174f46" stroke="#fff" strokeWidth="2" />}
            {isSel && <path d={`M${px(m.otr) + r - 5} ${py(m.wvtr) - r + 2} l2.4 2.4 l4 -4.4`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        );
      })}
    </svg>
  );
}
