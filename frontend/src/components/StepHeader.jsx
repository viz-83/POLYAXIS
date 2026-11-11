import Icon from './Icon';

/** Opener for each step: a white banner with the step icon, "Step n of 5", title and one line of guidance. */
export default function StepHeader({ stage, step, title, blurb, actions, kicker }) {
  const grad = stage?.theme?.grad || 'from-brand-500 to-brand-800';
  return (
    <header className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-brand-900/10 sm:p-5">
      {/* decorative wash, purely visual */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-44 w-72 rounded-full bg-gradient-to-br from-brand-100 to-transparent opacity-80" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          {stage && (
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-raised`}>
              <Icon name={stage.icon} className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            <p className="eyebrow">{kicker || (step ? `Step ${step} of 5` : '')}</p>
            <h1 className="mt-0.5 text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
            {blurb && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{blurb}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
