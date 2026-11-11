import { useEffect } from 'react';

// §8.2 "Form state preservation": in-progress form data must survive navigating to another screen within the
// session. A draft is kept in sessionStorage ONLY while the form differs from what the server last returned, so
// a stale draft can never shadow fresher server data (e.g. after an Admin reset).
const PREFIX = 'polyaxis_draft:';

export function readDraft(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try { sessionStorage.removeItem(PREFIX + key); } catch { /* storage unavailable */ }
}

/** Mirrors `value` into a draft while it differs from `baseline`; clears the draft when they match. */
export function useDraft(key, value, baseline, ready) {
  useEffect(() => {
    if (!ready || baseline == null) return;
    try {
      if (JSON.stringify(value) === JSON.stringify(baseline)) sessionStorage.removeItem(PREFIX + key);
      else sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { /* storage unavailable — the form simply won't be restored */ }
  }, [key, value, baseline, ready]);
}
