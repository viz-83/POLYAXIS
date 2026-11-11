import Icon from './Icon';

/** Segmented tabs that keep long pages short. `tabs`: [{ key, label, count?, icon? }]. */
export default function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-ink-100/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${on ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500 hover:text-ink-800'}`}
          >
            {t.icon && <Icon name={t.icon} className="h-4 w-4" />}
            {t.label}
            {t.count != null && <span className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] ${on ? 'bg-brand-100 text-brand-700' : 'bg-ink-200/70 text-ink-600'}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
