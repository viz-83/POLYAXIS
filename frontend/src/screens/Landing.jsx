import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks/useReveal';

const ICONS = {
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
  shield: 'M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3ZM9 12l2 2 4-4',
  compare: 'M4 6h16M4 12h10M4 18h6M17 14l3 3-3 3',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  loop: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  doc: 'M7 3h8l4 4v14H7V3ZM15 3v4h4M10 12h6M10 16h6',
  factory: 'M3 21V9l6 4V9l6 4V5h6v16H3Z',
  check: 'm5 13 4 4L19 7',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const NAV = [
  { href: '#platform', label: 'Platform' },
  { href: '#how', label: 'How it works' },
  { href: '#engine', label: 'The engine' },
  { href: '#compliance', label: 'Compliance' },
  { href: '#pricing', label: 'Pricing' },
];

const FEATURES = [
  { icon: 'layers', title: 'One structured workflow', body: 'Specification, performance targets, manufacturing limits and regulation in a single project — no more scattered spreadsheets.' },
  { icon: 'factory', title: 'Constraint-aware by design', body: 'Line temperature, line speed and seal-unit compatibility are checked against every candidate before it can be recommended.' },
  { icon: 'shield', title: 'UK EPR & EU PPWR built in', body: 'Recyclability thresholds are applied as structured rules, and non-compliant candidates are excluded with the rule that caused it.' },
  { icon: 'compare', title: 'Side-by-side candidates', body: 'Compare mono-PE, mono-PP and barrier structures on OTR, WVTR, seal window, recyclability and trial cost.' },
  { icon: 'doc', title: 'Explainable recommendations', body: 'Every recommendation arrives with a plain-language rationale and a five-dimension score breakdown — never a black box.' },
  { icon: 'loop', title: 'Learns from every trial', body: 'Record a result and the ranking updates immediately: failed candidates drop out and the next-best trial moves up.' },
];

const STEPS = [
  { n: '01', title: 'Create the project', body: 'Describe the existing laminate and the mono-material target.' },
  { n: '02', title: 'Define requirements', body: 'Barrier, seal, shelf-life, line limits and regulatory frameworks.' },
  { n: '03', title: 'Select alternatives', body: 'Review compatibility and compliance, then shortlist candidates.' },
  { n: '04', title: 'Optimise', body: 'The engine generates and ranks candidate physical trials.' },
  { n: '05', title: 'Record & re-optimise', body: 'Enter the result and get an updated, evidence-led ranking.' },
];

const WEIGHTS = [
  { label: 'Expected information gain', value: 30 },
  { label: 'Manufacturing feasibility', value: 25 },
  { label: 'Uncertainty reduction', value: 20 },
  { label: 'Regulatory compliance', value: 15 },
  { label: 'Trial cost (inverse)', value: 10 },
];

const RANKED = [
  { rank: 1, name: 'Mono-PE 80µm + EVOH — high-speed profile', score: 75, cost: '£2,928', primary: true },
  { rank: 2, name: 'Mono-PE 80µm + EVOH — standard profile', score: 73, cost: '£2,688' },
  { rank: 3, name: 'Mono-PE 80µm + SiOx — high-speed profile', score: 69, cost: '£3,172' },
];

const TIERS = [
  {
    name: 'Starter', price: '£349', audience: 'Smaller packaging manufacturers and technical teams',
    points: ['Core packaging transition decision-support', 'Project setup, requirements and constraints', 'Candidate comparison and ranked trial recommendation'],
  },
  {
    name: 'Professional', price: '£539', audience: 'Growing manufacturers that need more capacity', featured: true,
    points: ['Everything in Starter', 'Broader project management across product lines', 'Full optimisation and re-optimisation cycles', 'Reporting and trial history'],
  },
  {
    name: 'Enterprise', price: '£999', audience: 'Larger manufacturers with several teams',
    points: ['Everything in Professional', 'Higher usage capacity and multiple users', 'Advanced functionality', 'Greater integration potential'],
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cta = isAuthenticated
    ? { to: '/projects', label: 'Open workspace' }
    : { to: '/login', label: 'Sign in' };

  return (
    <div className="bg-white text-ink-900">
      {/* ------------------------------------------------------------ Header */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || menuOpen ? 'bg-ink-950/95 shadow-raised backdrop-blur' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" aria-label="PolyAxis home"><Logo tone="light" /></a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Landing">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-brand-50/80 transition-colors hover:text-white">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to={cta.to} className="btn bg-white text-brand-900 hover:bg-brand-50 focus-visible:ring-white">{cta.label}</Link>
            <button type="button" className="rounded-md p-2 text-white md:hidden" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={menuOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden" aria-label="Landing mobile">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium text-brand-50">{n.label}</a>
            ))}
          </nav>
        )}
      </header>

      {/* -------------------------------------------------------------- Hero */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-brand-950 to-brand-900 pt-28 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-32">
          <div className="animate-fade-up">
            <p className="eyebrow !text-brand-300">Compliance-constrained trial design</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Know which packaging trial to run <span className="text-brand-300">next.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-50/80">
              PolyAxis helps flexible-packaging manufacturers move from multi-material laminates to recyclable mono-materials — ranking each physical trial by what it will teach you, what it costs, and whether your line and regulators will allow it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={cta.to} className="btn bg-brand-400 px-6 py-3 text-base text-ink-950 hover:bg-brand-300 focus-visible:ring-brand-300">
                {isAuthenticated ? 'Open workspace' : 'Try the demo'} <Icon name="arrow" />
              </Link>
              <a href="#how" className="btn px-6 py-3 text-base text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 focus-visible:ring-white">See how it works</a>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[['5', 'scoring dimensions'], ['2', 'regulatory frameworks'], ['8', 'candidate materials']].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-mono text-3xl font-semibold text-white">{v}</dt>
                  <dd className="mt-1 text-xs leading-snug text-brand-100/70">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-3xl shadow-float ring-1 ring-white/15">
              <img src="/images/hero-film-sample.jpg" alt="A technician in blue gloves weighing a transparent packaging film sample on a laboratory balance" className="h-[30rem] w-full object-cover sm:h-[34rem]" loading="eager" />
            </div>
            <div className="absolute -left-4 bottom-10 w-64 animate-float-y rounded-2xl bg-white p-4 text-ink-900 shadow-float sm:-left-10">
              <p className="eyebrow">Priority trial · example</p>
              <p className="mt-1 text-sm font-semibold leading-snug">Mono-PE 80µm + EVOH barrier</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="font-mono text-3xl font-semibold text-brand-700">75<span className="text-sm text-ink-400">/100</span></p>
                <span className="badge-amber">Medium confidence</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full w-3/4 rounded-full bg-brand-500" /></div>
            </div>
            <div className="absolute -right-2 top-8 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink-800 shadow-float sm:-right-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Icon name="check" className="h-3.5 w-3.5" /></span>
              UK EPR · 72% recyclable
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Problem */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="reveal overflow-hidden rounded-3xl shadow-raised">
            <img src="/images/recycled-caps.jpg" alt="Hands sorting a tray of mixed-colour plastic caps for recycling" className="h-80 w-full object-cover lg:h-[28rem]" loading="lazy" />
          </div>
          <div className="reveal">
            <p className="eyebrow">The challenge</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Going mono-material shouldn't mean guessing.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Every candidate structure trades off barrier, seal integrity, shelf life, line compatibility, regulation and cost. Without a structured way to compare them, teams burn weeks of line time and material on trials that were never going to pass.
            </p>
            <ul className="mt-6 space-y-3">
              {['Fragmented technical assessment and engineering judgement', 'Regulatory review done separately from process feasibility', 'Repeated physical experiments with no memory of what failed and why'].map((t) => (
                <li key={t} className="flex gap-3 text-ink-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">!</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Features */}
      <section id="platform" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="eyebrow">Platform</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Everything between "laminate today" and "trial tomorrow".</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="reveal card group transition-all duration-300 hover:-translate-y-1 hover:shadow-raised" style={{ '--reveal-delay': `${i * 70}ms` }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"><Icon name={f.icon} className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From brief to ranked trial in five steps.</h2>
          </div>
          <ol className="relative mt-14 grid gap-8 md:grid-cols-5">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 md:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <li key={s.n} className="reveal relative" style={{ '--reveal-delay': `${i * 90}ms` }}>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white font-mono text-sm font-semibold text-brand-700 shadow-card ring-2 ring-brand-400">{s.n}</span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------- The engine */}
      <section id="engine" className="relative overflow-hidden bg-ink-950 py-20 text-white lg:py-28">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="reveal min-w-0">
            <p className="eyebrow !text-brand-300">The engine</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Five dimensions. One deterministic ranking.</h2>
            <p className="mt-5 text-lg leading-relaxed text-brand-50/75">
              Every feasible candidate trial is scored on five weighted dimensions. Identical inputs always produce an identical order, and administrators can tune the weights without touching code.
            </p>
            <div className="mt-8 space-y-4">
              {WEIGHTS.map((w) => (
                <div key={w.label}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="text-brand-50/90">{w.label}</span><span className="font-mono font-semibold text-brand-300">{w.value}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300" style={{ width: `${w.value * 3}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal min-w-0 space-y-5" style={{ '--reveal-delay': '120ms' }}>
            <div className="overflow-hidden rounded-3xl ring-1 ring-white/15">
              <img src="/images/polymer-pellets.jpg" alt="Gloved hand holding a vial of white polymer pellets over a laboratory heating block" className="h-56 w-full object-cover object-[50%_30%]" loading="lazy" />
            </div>
            <div className="rounded-2xl bg-white p-5 text-ink-900 shadow-float">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Ranked candidate trials</p>
                <span className="eyebrow !text-[10px]">Example run</span>
              </div>
              <ul className="mt-3 divide-y divide-ink-100">
                {RANKED.map((r) => (
                  <li key={r.rank} className={`flex items-center gap-3 py-3 ${r.primary ? 'rounded-lg bg-brand-50/70 px-2' : ''}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${r.primary ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>{r.rank}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="text-xs text-ink-500">{r.cost}</p></div>
                    <span className="font-mono text-lg font-semibold">{r.score}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <strong className="font-semibold">Excluded:</strong> Mono-PP 60µm + barrier — processing window 235–260°C is incompatible with the line's 180–220°C range.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Compliance */}
      <section id="compliance" className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="reveal order-2 lg:order-1">
            <p className="eyebrow">Compliance & manufacturing</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Constraints are applied before scoring, not after.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Hard limits on your line and on regulation remove unworkable candidates up front — and the reason is always shown, so the shortlist is something you can defend.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="card !p-5">
                <h3 className="text-base font-semibold">Manufacturing</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {['Operating temperature window', 'Line-speed range', 'Seal-unit material compatibility', 'Hard or soft constraint flexibility'].map((t) => (
                    <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{t}</li>
                  ))}
                </ul>
              </div>
              <div className="card !p-5">
                <h3 className="text-base font-semibold">Regulatory</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {['UK EPR recyclability classification', 'EU PPWR 2030 design criteria', 'Mandatory vs monitoring frameworks', 'Admin-editable rule thresholds'].map((t) => (
                    <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="reveal order-1 overflow-hidden rounded-3xl shadow-raised lg:order-2" style={{ '--reveal-delay': '100ms' }}>
            <img src="/images/factory-line.jpg" alt="Automated handling line with roller conveyors and an operator control screen in a modern factory" className="h-80 w-full object-cover lg:h-[30rem]" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Pricing */}
      <section id="pricing" className="bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A plan for every packaging team.</h2>
            <p className="mt-4 text-ink-600">Phase 1 is a prototype: tiers are shown for illustration and no payment is taken.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TIERS.map((t, i) => (
              <article key={t.name} className={`reveal relative flex flex-col rounded-2xl p-7 ${t.featured ? 'bg-ink-950 text-white shadow-float lg:-translate-y-3' : 'bg-white shadow-card ring-1 ring-brand-900/10'}`} style={{ '--reveal-delay': `${i * 90}ms` }}>
                {t.featured && <span className="absolute -top-3 left-7 rounded-full bg-brand-400 px-3 py-1 text-xs font-bold text-ink-950">Most popular</span>}
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className={`mt-1 text-sm ${t.featured ? 'text-brand-100/70' : 'text-ink-500'}`}>{t.audience}</p>
                <p className="mt-6 flex items-baseline gap-1"><span className="font-display text-4xl font-bold">{t.price}</span><span className={`text-sm ${t.featured ? 'text-brand-100/70' : 'text-ink-500'}`}>/month</span></p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {t.points.map((p) => (
                    <li key={p} className="flex gap-2.5"><Icon name="check" className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? 'text-brand-300' : 'text-brand-600'}`} /><span className={t.featured ? 'text-brand-50/90' : 'text-ink-700'}>{p}</span></li>
                  ))}
                </ul>
                <Link to={cta.to} className={`mt-8 ${t.featured ? 'btn bg-brand-400 text-ink-950 hover:bg-brand-300' : 'btn-secondary'}`}>Try the demo</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 py-20 text-white">
        <div className="reveal mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">See the next best trial for your own transition.</h2>
          <p className="mt-4 text-lg text-brand-50/80">Sign in with a demo account and walk the full workflow in about fifteen minutes.</p>
          <Link to={cta.to} className="btn mt-8 bg-white px-7 py-3 text-base text-brand-900 hover:bg-brand-50 focus-visible:ring-white">{cta.label} <Icon name="arrow" /></Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="bg-ink-950 py-12 text-brand-50/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:justify-between lg:px-8">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed">Decision support for recyclable packaging transitions. Phase 1 prototype using simulated data; regulatory rules are illustrative, not legal advice.</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
            {NAV.map((n) => <a key={n.href} href={n.href} className="hover:text-white">{n.label}</a>)}
            <Link to="/login" className="hover:text-white">Sign in</Link>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs text-brand-100/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} PolyAxis · Photography from <a className="underline hover:text-white" href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a> (free to use).
        </p>
      </footer>
    </div>
  );
}
