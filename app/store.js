// Leonida Ledger progress store: earned flags and counters, saved in localStorage.
// Demo mode (?shot=...) never touches this store; app.js passes a fixed demo state instead.

export const STORAGE_KEY = 'leonida-ledger-progress-v1';

// The fixed demo state used by the ?shot= screenshot scenes. It mirrors the captured
// screenshots: 13 of 55 earned (2 silver, 11 bronze), every counter still at zero.
export const DEMO_EARNED = [
  'Just Like Paradise',
  'Paradise Lost',
  'Trust',
  'The Shootist',
  "Don't Touch My Deck",
  'Positive Mental Attitude',
  'Master of None',
  'Top Fun',
  'Baited My Tackle',
  'Stick Fiddler',
  'Whip It Good',
  'The Goodtime State',
  'Hot Together',
];

export function emptyProgress() {
  return { earned: {}, counts: {} };
}

export function demoProgress() {
  const state = emptyProgress();
  for (const name of DEMO_EARNED) state.earned[name] = true;
  return state;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return {
      earned: parsed && typeof parsed.earned === 'object' && parsed.earned ? parsed.earned : {},
      counts: parsed && typeof parsed.counts === 'object' && parsed.counts ? parsed.counts : {},
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quotas); the tracker keeps working in memory.
  }
}

export function exportProgress(state) {
  return JSON.stringify({ app: 'leonida-ledger', version: 1, earned: state.earned, counts: state.counts }, null, 2);
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    const state = emptyProgress();
    for (const name of parsed) if (typeof name === 'string') state.earned[name] = true;
    return state;
  }
  if (parsed && typeof parsed === 'object') {
    const state = emptyProgress();
    if (parsed.earned && typeof parsed.earned === 'object') {
      for (const [name, flag] of Object.entries(parsed.earned)) if (flag) state.earned[name] = true;
    }
    if (Array.isArray(parsed.earned)) {
      for (const name of parsed.earned) if (typeof name === 'string') state.earned[name] = true;
    }
    if (parsed.counts && typeof parsed.counts === 'object') {
      for (const [name, value] of Object.entries(parsed.counts)) {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) state.counts[name] = Math.floor(n);
      }
    }
    return state;
  }
  throw new Error('Unrecognised progress file');
}
