// Leonida Ledger — an offline GTA 6 trophy guide and tracker.
// Loads app/data/trophies.json (a file under app/, fetched from the same server),
// saves progress in localStorage, and renders the checklist, the roadmap and the
// missable flags. It makes no network request at run time.

const STORE_KEY = 'leonida-ledger-v1';
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABELS = {
  story: 'Story', side: 'Side quests', collectibles: 'Collectibles', activities: 'Activities',
  crime: 'Crime', money: 'Money', moments: 'Moments', completion: 'Completion',
};
const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story', note: 'Chapters 1 to 5 and the named story missions. Every chapter and mission trophy pops as you play; none of them can be missed.' },
  { stage: 2, title: 'Side characters and strangers', note: 'Finish the mission strands for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 stranger strands across Leonida.' },
  { stage: 3, title: 'Activities and skills', note: 'Shooting Range golds, races, drone races, fishing, arcade games, bowling, stunts and challenges. One try each is enough for Master of None.' },
  { stage: 4, title: 'Explore and collect', note: 'Meditation spots (do the Chapter 1 spot the first time it is offered), card sets, WAiNK It locations, vehicles and all 52 areas.' },
  { stage: 5, title: 'Crime and the crew', note: 'Vaults, armored trucks, shops, jewelry stores, gang operations, Combat Focus and the melee drive-by. Bring a getaway car.' },
  { stage: 6, title: 'Odd moments and cleanup', note: 'The cryptic trophies whose descriptions are riddles, and the three watch-list moments. Try each the first time you can.' },
  { stage: 7, title: 'Money, property and 100%', note: 'Launder $250,000 of Marked Bills, spend $100,000, buy all 8 garages, register 10 vehicles — then 100% completion and the platinum.' },
];

const state = {
  trophies: [],
  earned: new Set(),
  counts: {},
  spoilerFree: false,
  kind: 'all',
  grade: 'all',
  query: '',
  view: 'checklist',
  selectedId: null,
  demo: false,
};

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPane');

function loadStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    state.earned = new Set(Array.isArray(raw.earned) ? raw.earned : []);
    state.counts = raw.counts && typeof raw.counts === 'object' ? raw.counts : {};
    state.spoilerFree = raw.spoilerFree === true;
  } catch {
    state.earned = new Set();
    state.counts = {};
    state.spoilerFree = false;
  }
}

function saveStored() {
  if (state.demo) return; // Screenshot demo state is in-memory only; it never overwrites real progress.
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned],
    counts: state.counts,
    spoilerFree: state.spoilerFree,
  }));
}

function isHiddenFromSpoilers(trophy) {
  return state.spoilerFree && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function visibleName(trophy) {
  return isHiddenFromSpoilers(trophy) ? 'Hidden story trophy' : trophy.name;
}

function visibleDescription(trophy) {
  return isHiddenFromSpoilers(trophy) ? 'Complete the story to reveal this trophy.' : trophy.description;
}

function trophyMatches(trophy) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false; // No online trophies: the whole list is single-player.
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function gradeCounts() {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of state.trophies) if (state.earned.has(t.id)) out[t.grade] += 1;
  return out;
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('earnedPct').textContent = total ? `${Math.round((earned / total) * 100)}%` : '0%';
  document.getElementById('progressFill').style.width = total ? `${(earned / total) * 100}%` : '0%';
  const counts = gradeCounts();
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of state.trophies) totals[t.grade] += 1;
  document.getElementById('gradeCounts').textContent =
    `Platinum ${counts.platinum}/${totals.platinum} · Gold ${counts.gold}/${totals.gold} · Silver ${counts.silver}/${totals.silver} · Bronze ${counts.bronze}/${totals.bronze}`;
}

function trophyRow(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy' + (state.earned.has(trophy.id) ? ' earned' : '') + (state.selectedId === trophy.id ? ' selected' : '');
  li.dataset.id = String(trophy.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${visibleName(trophy)} as earned`);
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    if (box.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    saveStored();
    renderAll();
  });

  const main = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = visibleName(trophy);
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = visibleDescription(trophy);
  main.append(name, desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${trophy.grade}`;
  gradeBadge.textContent = GRADE_LABELS[trophy.grade];
  meta.append(gradeBadge);
  if (trophy.hidden) {
    const hiddenBadge = document.createElement('span');
    hiddenBadge.className = 'badge hidden';
    hiddenBadge.textContent = 'Hidden';
    meta.append(hiddenBadge);
  }
  if (trophy.missable) {
    const missBadge = document.createElement('span');
    missBadge.className = 'badge missable';
    missBadge.textContent = 'Possibly missable';
    meta.append(missBadge);
  }
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge kind';
  kindBadge.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  meta.append(kindBadge);
  main.append(meta);

  if (trophy.count != null) {
    const countBox = document.createElement('div');
    countBox.className = 'count-box';
    const label = document.createElement('span');
    label.textContent = 'Progress';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.count);
    input.value = String(state.counts[trophy.id] ?? 0);
    input.setAttribute('aria-label', `Progress toward ${visibleName(trophy)}`);
    input.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('change', () => {
      const value = Math.max(0, Math.min(trophy.count, Number(input.value) || 0));
      state.counts[trophy.id] = value;
      input.value = String(value);
      saveStored();
    });
    const target = document.createElement('span');
    target.textContent = `/ ${trophy.count.toLocaleString('en-US')}`;
    countBox.append(label, input, target);
    main.append(countBox);
  }

  const side = document.createElement('div');
  side.className = 'trophy-side';
  const gradeWord = document.createElement('span');
  gradeWord.className = 'grade-word';
  gradeWord.textContent = GRADE_LABELS[trophy.grade];
  side.append(gradeWord);
  side.append(document.createTextNode(`#${trophy.id}`));

  li.append(box, main, side);
  li.addEventListener('click', () => {
    state.selectedId = trophy.id;
    renderChecklist();
    renderDetail();
  });
  return li;
}

function renderChecklist() {
  const shown = state.trophies.filter(trophyMatches);
  listEl.replaceChildren(...shown.map(trophyRow));
  document.getElementById('shownCount').textContent =
    `Showing ${shown.length} of ${state.trophies.length} trophies`;
  const emptyNote = document.getElementById('emptyNote');
  if (state.kind === 'online') {
    emptyNote.hidden = false;
    emptyNote.textContent = 'No online trophies — all 55 are single-player, so this filter is empty by design.';
  } else if (shown.length === 0) {
    emptyNote.hidden = false;
    emptyNote.textContent = 'Nothing matches these filters.';
  } else {
    emptyNote.hidden = true;
  }
}

function renderDetail() {
  const trophy = state.trophies.find((t) => t.id === state.selectedId);
  detailEl.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Select a trophy to read its guide, its sources and when it can be missed.';
    detailEl.append(p);
    return;
  }
  const title = document.createElement('h2');
  title.textContent = visibleName(trophy);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `"${visibleDescription(trophy)}" — ${GRADE_LABELS[trophy.grade]}${trophy.hidden ? ' · Hidden on PlayStation' : ''}${trophy.count != null ? ` · PSN tracks ${trophy.count.toLocaleString('en-US')}` : ''}`;
  detailEl.append(title, official);
  if (trophy.missable) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = 'Possibly missable — see the guide below and the Missables view before you play past Chapter 1.';
    detailEl.append(note);
  }
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = isHiddenFromSpoilers(trophy)
    ? 'Spoiler-free mode is on: earn this story trophy to reveal its guide.'
    : trophy.guide;
  detailEl.append(guide);
  const sources = document.createElement('p');
  sources.className = 'sources';
  const strong = document.createElement('strong');
  strong.textContent = 'Sources: ';
  sources.append(strong, document.createTextNode(isHiddenFromSpoilers(trophy) ? 'Hidden until earned.' : trophy.sources));
  detailEl.append(sources);
  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const earnButton = document.createElement('button');
  earnButton.type = 'button';
  const earned = state.earned.has(trophy.id);
  earnButton.textContent = earned ? 'Earned ✓ — tap to unmark' : 'Mark as earned';
  if (earned) earnButton.classList.add('earned');
  earnButton.addEventListener('click', () => {
    if (state.earned.has(trophy.id)) state.earned.delete(trophy.id);
    else state.earned.add(trophy.id);
    saveStored();
    renderAll();
  });
  earnRow.append(earnButton);
  detailEl.append(earnRow);
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const li = document.createElement('li');
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = stage.note;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const trophy of state.trophies.filter((t) => t.stage === stage.stage)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-chip' + (state.earned.has(trophy.id) ? ' done' : '') + (trophy.missable ? ' flag' : '');
      chip.textContent = `${visibleName(trophy)}${trophy.missable ? ' ⚠' : ''}`;
      chip.addEventListener('click', () => {
        state.selectedId = trophy.id;
        switchView('checklist');
        renderDetail();
      });
      chips.append(chip);
    }
    li.append(title, note, chips);
    list.append(li);
  }
}

function renderMissables() {
  const missable = state.trophies.filter((t) => t.missable);
  document.getElementById('missableList').replaceChildren(...missable.map(trophyRow));
  const watch = state.trophies.filter((t) => [37, 44, 45].includes(t.id));
  document.getElementById('watchList').replaceChildren(...watch.map(trophyRow));
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function switchView(view) {
  state.view = view;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
}

function exportProgress() {
  const payload = JSON.stringify({
    app: 'Leonida Ledger',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    counts: state.counts,
    spoilerFree: state.spoilerFree,
  }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const earned = Array.isArray(data.earned) ? data.earned : [];
    state.earned = new Set(earned.filter((id) => state.trophies.some((t) => t.id === id)));
    state.counts = data.counts && typeof data.counts === 'object' ? data.counts : {};
    if (typeof data.spoilerFree === 'boolean') state.spoilerFree = data.spoilerFree;
    document.getElementById('spoilers').checked = state.spoilerFree;
    saveStored();
    renderAll();
  } catch {
    alert('That file could not be imported — it is not a Leonida Ledger progress file.');
  }
}

// Fixed screenshot scenes (?shot=...). The demo state lives in memory only and is
// never written to localStorage, so a reader's real progress is untouched.
function applyShotMode() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return;
  state.demo = true;
  const demoEarned = [2, 3, 8, 15, 17, 20, 21, 28, 33, 35, 42, 46, 53];
  if (shot === 'cover') {
    state.earned = new Set(demoEarned);
    state.counts = { 15: 87, 17: 12, 42: 31 };
    state.selectedId = 17;
  } else if (shot === 'roadmap') {
    state.earned = new Set(demoEarned);
    switchView('roadmap');
  } else if (shot === 'tracker') {
    state.earned = new Set(demoEarned);
    state.counts = { 15: 87, 17: 12, 42: 31 };
    state.spoilerFree = true;
    state.kind = 'missable';
    state.selectedId = 28;
    document.getElementById('spoilers').checked = true;
    document.querySelector('[data-kind="missable"]').classList.add('active');
    document.querySelector('[data-kind="all"]').classList.remove('active');
  } else if (shot === 'guide') {
    state.earned = new Set(demoEarned);
    state.selectedId = 28;
  }
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  state.trophies = doc.trophies;
  loadStored();

  document.getElementById('spoilers').checked = state.spoilerFree;
  document.getElementById('spoilers').addEventListener('change', (event) => {
    state.spoilerFree = event.target.checked;
    saveStored();
    renderAll();
  });
  document.getElementById('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderChecklist();
  });
  document.getElementById('grade').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderChecklist();
  });
  for (const chip of document.querySelectorAll('[data-kind]')) {
    chip.addEventListener('click', () => {
      for (const other of document.querySelectorAll('[data-kind]')) other.classList.remove('active');
      chip.classList.add('active');
      state.kind = chip.dataset.kind;
      renderChecklist();
    });
  }
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
  document.getElementById('export').addEventListener('click', exportProgress);
  document.getElementById('import').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies and progress counts in this browser?')) return;
    state.earned = new Set();
    state.counts = {};
    state.selectedId = null;
    saveStored();
    renderAll();
  });

  applyShotMode();
  renderAll();
}

boot();
