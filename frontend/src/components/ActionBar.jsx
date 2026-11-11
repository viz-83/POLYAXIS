/**
 * Persistent bottom bar for a step: live status on the left, the step's actions on the right.
 * It is `sticky`, so the primary action is always on screen however long the page is, and it settles
 * naturally at the end of short pages. Use `.btn-cta` for the primary action and `.btn-ghost-dark` for
 * secondary ones.
 */
export default function ActionBar({ status, children }) {
  return (
    <div className="sticky bottom-3 z-30 pt-2" role="region" aria-label="Step actions">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-950 p-2.5 pl-4 text-white shadow-float ring-1 ring-white/10 sm:pl-5">
        <div className="min-w-0 flex-1 basis-48 text-sm text-white/80">{status}</div>
        <div className="flex w-full min-w-0 shrink-0 items-center gap-2 sm:w-auto [&>*]:min-w-0 [&>*]:flex-1 [&>*]:!px-3 [&>*]:text-xs sm:[&>*]:flex-none sm:[&>*]:!px-4 sm:[&>*]:text-sm">{children}</div>
      </div>
    </div>
  );
}
