// Palette discipline: every workflow step uses the brand teal (steps are told apart by their layout and
// icon, not by colour). `ink` is for the overview screen. Amber (`accent`) is reserved for highlights,
// and red only ever signals failure. Class strings are written out in full so Tailwind keeps them.
const TEAL = {
  text: 'text-brand-700', soft: 'bg-brand-50', solid: 'bg-brand-600', solidText: 'text-white',
  ring: 'ring-brand-300', border: 'border-brand-200', grad: 'from-brand-500 to-brand-800',
  hex: '#1a7c6a', light: '#d5f3ea', glow: 'shadow-[0_0_0_6px_rgba(39,154,131,0.2)]',
};
const INK = {
  text: 'text-ink-800', soft: 'bg-ink-100', solid: 'bg-ink-900', solidText: 'text-white',
  ring: 'ring-ink-300', border: 'border-ink-200', grad: 'from-ink-700 to-ink-950',
  hex: '#1c2530', light: '#eaedf0', glow: 'shadow-[0_0_0_6px_rgba(28,37,48,0.12)]',
};

export const THEMES = { teal: TEAL, ink: INK };

export const STAGES = [
  { key: 'setup', stage: 'Specification', label: 'Setup', blurb: 'Today → target', theme: TEAL, icon: 'layers', path: (id) => `/projects/${id}/setup`, match: ['/setup'] },
  { key: 'requirements', stage: 'Requirements', label: 'Requirements', blurb: 'Targets & limits', theme: TEAL, icon: 'sliders', path: (id) => `/projects/${id}/requirements`, match: ['/requirements'] },
  { key: 'materials', stage: 'Materials', label: 'Materials', blurb: 'Map the options', theme: TEAL, icon: 'flask', path: (id) => `/projects/${id}/materials`, match: ['/materials'] },
  { key: 'optimise', stage: 'Optimisation', label: 'Optimise', blurb: 'Rank the trials', theme: TEAL, icon: 'target', path: (id) => `/projects/${id}/recommendation`, match: ['/recommendation'] },
  { key: 'results', stage: 'Results', label: 'Results', blurb: 'Learn & re-rank', theme: TEAL, icon: 'loop', path: (id) => `/projects/${id}/trial-result`, match: ['/trial-result', '/updated-recommendation'] },
];

export const DASHBOARD_STAGE = { key: 'dashboard', label: 'Overview', theme: INK, icon: 'grid', path: (id) => `/projects/${id}/dashboard`, match: ['/dashboard'] };

export function stageIndexForPath(pathname) {
  return STAGES.findIndex((s) => s.match.some((m) => pathname.endsWith(m)));
}

export function stageByName(name) {
  return STAGES.find((s) => s.stage === name) || STAGES[0];
}

// The five scoring dimensions, in engine order. Series colours stay inside the brand palette:
// two teals, the logo amber, and two slates — always paired with a text label in the legend.
export const DIMS = [
  { key: 'informationGain', label: 'Information gain', short: 'Info gain', color: '#186356' },
  { key: 'feasibility', label: 'Manufacturing feasibility', short: 'Feasibility', color: '#46b59d' },
  { key: 'uncertaintyReduction', label: 'Uncertainty reduction', short: 'Uncertainty', color: '#f5b83d' },
  { key: 'regulatory', label: 'Regulatory compliance', short: 'Regulatory', color: '#5c7285' },
  { key: 'cost', label: 'Cost (inverse)', short: 'Cost', color: '#a9b8c2' },
];

export const DEFAULT_WEIGHTS = { informationGain: 0.3, feasibility: 0.25, uncertaintyReduction: 0.2, regulatory: 0.15, cost: 0.1 };

/** "Mono-PE 80µm + EVOH — Standard process-window profile" → { material, profile } */
export function splitTrialName(trialName = '') {
  const [material, profile] = trialName.split(' — ');
  return { material, profile: (profile || '').replace(/ profile$/i, '') };
}

export function gbp(n) {
  return `£${Number(n).toLocaleString('en-GB')}`;
}
