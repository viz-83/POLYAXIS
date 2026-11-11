import { useId } from 'react';

/** PolyAxis mark: a polymer-ring hexagon holding a "P" whose bowl loops back (recycling),
 *  with an amber dot marking the selected trial. Mirrors public/logo-mark.svg. */
export function LogoMark({ className = 'h-9 w-9' }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="PolyAxis logo">
      <defs>
        <linearGradient id={gid} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#46b59d" />
          <stop offset="1" stopColor="#15423b" />
        </linearGradient>
      </defs>
      <path d="M32 4.5 56.3 18.5v27L32 59.5 7.7 45.5v-27Z" fill={`url(#${gid})`} stroke={`url(#${gid})`} strokeWidth="4" strokeLinejoin="round" />
      <path d="M23 46V19h10.5a8.25 8.25 0 0 1 0 16.5H27" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m31 31.4-4.2 4.1 4.2 4.1" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="43.5" cy="46.5" r="3.6" fill="#f5b83d" />
    </svg>
  );
}

export default function Logo({ tone = 'dark', size = 'h-9 w-9', textClass = 'text-xl' }) {
  const poly = tone === 'light' ? 'text-white' : 'text-ink-900';
  const axis = tone === 'light' ? 'text-brand-300' : 'text-brand-600';
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={size} />
      <span className={`font-display font-bold tracking-tight ${textClass}`}>
        <span className={poly}>Poly</span>
        <span className={axis}>Axis</span>
      </span>
    </span>
  );
}
