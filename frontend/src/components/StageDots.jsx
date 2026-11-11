import { STAGES } from '../utils/stages';
import Icon from './Icon';

/** Compact five-dot journey indicator, each dot in its step's own colour. */
export default function StageDots({ stage, stagesCompleted = [] }) {
  const currentIdx = STAGES.findIndex((s) => s.stage === stage);
  return (
    <ol className="flex items-center" aria-label={`Progress: currently ${stage}`}>
      {STAGES.map((s, i) => {
        const done = stagesCompleted.includes(s.stage);
        const active = i === currentIdx;
        return (
          <li key={s.key} className="flex items-center">
            <span
              title={s.stage}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                done ? `${s.theme.solid} ${s.theme.solidText}` : active ? `bg-white ${s.theme.text} ring-2 ${s.theme.ring}` : 'bg-ink-100 text-ink-500'
              }`}
            >
              {done ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            {i < STAGES.length - 1 && <span className={`h-0.5 w-3 ${done ? s.theme.solid : 'bg-ink-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
