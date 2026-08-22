const STAGES = ['Specification', 'Requirements', 'Materials', 'Optimisation', 'Results'];

export default function ProgressStepper({ currentStage, stagesCompleted = [] }) {
  const currentIdx = STAGES.indexOf(currentStage);

  return (
    <ol className="flex w-full items-center" aria-label="Project workflow progress">
      {STAGES.map((stage, idx) => {
        const done = stagesCompleted.includes(stage) || idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ${
                  done
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : active
                    ? 'bg-white text-brand-700 ring-brand-500'
                    : 'bg-white text-ink-400 ring-ink-200'
                }`}
              >
                {done ? '✓' : idx + 1}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-brand-700' : done ? 'text-ink-700' : 'text-ink-400'}`}>
                {stage}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 rounded ${done ? 'bg-brand-600' : 'bg-ink-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { STAGES };
