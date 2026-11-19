// Leonida Ledger progress store: localStorage persistence, export and import.
// Progress is a plain object: { earned: [trophyId], counters: { trophyId: number }, spoiler: boolean }.
// Nothing in here touches the network; the demo (?shot=) scenes never call load or save.

export const STORAGE_KEY = 'leonida-ledger-progress-v1';

export function emptyProgress() {
  return { earned: [], counters: {}, spoiler: false };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return parseProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable (private mode, quotas); the tracker still works in memory.
  }
}

export function parseProgress(data) {
  const clean = emptyProgress();
  if (!data || typeof data !== 'object') return clean;
  if (Array.isArray(data.earned)) {
    clean.earned = [...new Set(data.earned.filter((id) => Number.isInteger(id)))];
  }
  if (data.counters && typeof data.counters === 'object') {
    for (const [key, value] of Object.entries(data.counters)) {
      const id = Number(key);
      if (Number.isInteger(id) && typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        clean.counters[id] = Math.floor(value);
      }
    }
  }
  clean.spoiler = data.spoiler === true;
  return clean;
}

export function exportProgress(progress) {
  const payload = {
    app: 'leonida-ledger',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...progress.earned].sort((a, b) => a - b),
    counters: progress.counters,
    spoiler: progress.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
