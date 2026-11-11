import Icon from './Icon';

/**
 * The standard card: white, softly framed, with an optional titled header (icon chip, title, hint,
 * actions) above the body. The header carries a faint green wash so cards read as part of the page.
 */
export default function Section({ title, hint, icon, actions, children, className = '', bodyClass = 'p-4 sm:p-5' }) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-900/10 ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-brand-100 bg-gradient-to-r from-brand-50 via-white to-white px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
                <Icon name={icon} className="h-[18px] w-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-display text-[15px] font-bold leading-tight text-ink-900">{title}</h3>
              {hint && <p className="mt-0.5 truncate text-xs text-ink-500">{hint}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}
