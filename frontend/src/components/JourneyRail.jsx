import { Link, useLocation } from 'react-router-dom';
import { STAGES, stageIndexForPath } from '../utils/stages';
import Icon from './Icon';

/** One-line step navigation: completed steps are ticked, the current one is filled. Always clickable. */
export default function JourneyRail({ project }) {
  const { pathname } = useLocation();
  const activeIdx = stageIndexForPath(pathname);

  return (
    <nav aria-label="Project journey" className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex min-w-max items-center gap-1">
        {STAGES.map((s, i) => {
          const done = project.stagesCompleted.includes(s.stage);
          const active = i === activeIdx;
          return (
            <li key={s.key} className="flex items-center gap-1">
              <Link
                to={s.path(project.id)}
                aria-current={active ? 'step' : undefined}
                title={`${s.label} — ${s.blurb}`}
                className={`flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-xs font-bold transition-colors ${
                  active ? 'bg-brand-600 text-white shadow-card' : done ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'bg-white text-ink-500 ring-1 ring-ink-200 hover:text-ink-800'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${active ? 'bg-brand-900/40' : done ? 'bg-brand-600 text-white' : 'bg-ink-100'}`}>
                  {done && !active ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {s.label}
              </Link>
              {i < STAGES.length - 1 && <span className={`h-px w-3 ${done ? 'bg-brand-300' : 'bg-ink-200'}`} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
