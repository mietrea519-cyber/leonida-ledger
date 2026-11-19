// Leonida Ledger — offline GTA VI trophy guide and tracker.
// Loads its data from ./data/trophies.json (a file inside app/), renders the checklist,
// roadmap and missables views, and saves progress through store.js. It fetches nothing
// from the network. The ?shot= scenes render a fixed demo state for screenshots and
// never read or write localStorage.

import { loadProgress, saveProgress, parseProgress, exportProgress, emptyProgress } from './store.js';

const STAGES = [
  { n: 1, title: 'Play the story', desc: 'Chapters 1 to 5 and the named story missions. Every chapter and mission trophy pops as you play; none of them can be missed.' },
  { n: 2, title: 'Side content and strangers', desc: 'The stranger strands and the named characters’ final missions. Start each strand when it appears; finishing strands also fills the Strangers & Freaks counter.' },
  { n: 3, title: 'Activities and skills', desc: 'Shooting Range golds, races, drone races, fishing, arcade, stunts, challenges and Combat Focus. Sample every activity once for Master of None along the way.' },
  { n: 4, title: 'Explore and collect', desc: 'Meditation spots, card sets, WAiNK locations, vehicle discoveries and all 52 areas of Leonida. Positive Mental Attitude lives here — and its first spot belongs to Chapter 1, so do not wait for this stage to start it.' },
  { n: 5, title: 'Crime and crew', desc: 'Robberies with your partner, bank vaults, an armored truck, gang operations, a stealth jewelry job, a tank and one unscheduled airport departure.' },
  { n: 6, title: 'Odd moments and cleanup', desc: 'The one-off moments the descriptions only hint at: a cocktail view, a showroom exit, bowling, a second chance, something strange, and the long choices counter.' },
  { n: 7, title: 'Money, property and 100%', desc: 'Launder the marked bills, spend across the shops, buy every garage, register your vehicles, and close out 100% completion. The platinum follows the other 54.' },
];

const DEMO_EARNED = [2, 3, 8, 16, 17, 20, 21, 28, 30, 33, 36, 44, 46];
const DEMO_COUNTERS = { 15: 120, 17: 42, 25: 3, 31: 37, 32: 12, 35: 45, 42: 20, 48: 140 };

const state = {
  trophies: [],
  progress: emptyProgress(),
  demo: false,
  view: 'checklist',
  kind: 'all',
  grade: 'all',
  search: '',
  selectedId: null,
};

const els = {};
for (const id of ['earned-count', 'percent-to-platinum', 'progress-bar', 'progress-fill', 'grade-counts',
  'search-input', 'kind-filters', 'grade-filter', 'spoiler-toggle', 'export-button', 'import-button',
  'import-file', 'reset-button', 'import-note', 'showing-line', 'online-note', 'trophy-list',
  'guide-pane', 'roadmap-list', 'missables-list']) {
  els[id] = document.getElementById(id);
}

function isEarned(id) { return state.progress.earned.includes(id); }

function counterOf(trophy) { return state.progress.counters[trophy.id] ?? 0; }

function persist() { if (!state.demo) saveProgress(state.progress); }

function spoilerHidden(trophy) {
  return state.progress.spoiler && trophy.kind === 'story' && !isEarned(trophy.id);
}

function displayName(trophy) {
  return spoilerHidden(trophy) ? 'Story trophy — spoiler hidden' : trophy.name;
}

function displayDesc(trophy) {
  return spoilerHidden(trophy) ? 'Spoiler-free mode is on: this story trophy reveals itself once you earn it.' : trophy.description;
}

function matchesFilters(trophy) {
  if (state.kind === 'online') return false;
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.search) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(state.search.toLowerCase())) return false;
  }
  return true;
}

function gradeTotals() {
  const totals = { platinum: [0, 1], gold: [0, 2], silver: [0, 6], bronze: [0, 46] };
  for (const t of state.trophies) if (isEarned(t.id)) totals[t.grade][0] += 1;
  return totals;
}

function renderProgress() {
  const earned = state.progress.earned.length;
  const pct = Math.round((earned / 55) * 100);
  els['earned-count'].textContent = String(earned);
  els['percent-to-platinum'].textContent = `${pct}% to the platinum`;
  els['progress-fill'].style.width = `${pct}%`;
  els['progress-bar'].setAttribute('aria-valuenow', String(pct));
  const g = gradeTotals();
  els['grade-counts'].textContent =
    `Platinum ${g.platinum[0]}/${g.platinum[1]} · Gold ${g.gold[0]}/${g.gold[1]} · Silver ${g.silver[0]}/${g.silver[1]} · Bronze ${g.bronze[0]}/${g.bronze[1]}`;
}

function badge(label, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls ?? ''}`.trim();
  span.textContent = label;
  return span;
}

function renderCounter(trophy, parent) {
  if (!trophy.count) return;
  const row = document.createElement('div');
  row.className = 'counter-row';
  const label = document.createElement('span');
  label.textContent = 'Progress';
  const step = trophy.step ?? 1;
  const minus = document.createElement('button');
  minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Decrease progress for ${trophy.name}`);
  const input = document.createElement('input');
  input.className = 'counter-input';
  input.type = 'number'; input.min = '0'; input.max = String(trophy.count); input.step = String(step);
  input.value = String(counterOf(trophy));
  input.setAttribute('aria-label', `Progress count for ${trophy.name}`);
  const of = document.createElement('span');
  of.textContent = `/ ${trophy.count.toLocaleString('en-US')}`;
  const apply = (value) => {
    const next = Math.max(0, Math.min(trophy.count, Math.floor(Number(value) || 0)));
    state.progress.counters[trophy.id] = next;
    persist();
    input.value = String(next);
  };
  minus.addEventListener('click', (e) => { e.stopPropagation(); apply(counterOf(trophy) - step); });
  const plus = document.createElement('button');
  plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Increase progress for ${trophy.name}`);
  plus.addEventListener('click', (e) => { e.stopPropagation(); apply(counterOf(trophy) + step); });
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', () => apply(input.value));
  row.append(label, minus, input, plus, of);
  parent.appendChild(row);
}

function renderList() {
  const visible = state.trophies.filter(matchesFilters);
  els['showing-line'].textContent = `Showing ${visible.length} of 55 trophies`;
  els['online-note'].hidden = state.kind !== 'online';
  els['trophy-list'].replaceChildren();
  for (const trophy of visible) {
    const card = document.createElement('article');
    card.className = 'trophy-card'
      + (isEarned(trophy.id) ? ' is-earned' : '')
      + (state.selectedId === trophy.id ? ' is-selected' : '')
      + (trophy.missable ? ' is-missable' : '');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'trophy-check';
    check.checked = isEarned(trophy.id);
    check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    check.addEventListener('click', (e) => e.stopPropagation());
    check.addEventListener('change', () => toggleEarned(trophy.id));
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('p');
    name.className = 'trophy-name';
    name.textContent = displayName(trophy);
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = displayDesc(trophy);
    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.appendChild(badge(trophy.grade, `badge-grade-${trophy.grade}`));
    if (trophy.hidden) badges.appendChild(badge('Hidden on PSN', 'badge-hidden'));
    if (trophy.missable) badges.appendChild(badge('Possibly missable', 'badge-missable'));
    badges.appendChild(badge(trophy.kind));
    main.append(name, desc, badges);
    renderCounter(trophy, main);
    const side = document.createElement('div');
    side.className = 'trophy-side';
    const gradeWord = document.createElement('div');
    gradeWord.className = 'trophy-grade-word';
    gradeWord.textContent = trophy.grade;
    const num = document.createElement('div');
    num.className = 'trophy-id';
    num.textContent = `#${trophy.id}`;
    side.append(gradeWord, num);
    card.append(check, main, side);
    card.addEventListener('click', () => selectTrophy(trophy.id));
    els['trophy-list'].appendChild(card);
  }
}

function renderGuide() {
  const pane = els['guide-pane'];
  const trophy = state.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) { pane.hidden = true; pane.replaceChildren(); return; }
  pane.hidden = false;
  pane.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = displayName(trophy);
  const official = document.createElement('p');
  official.className = 'guide-official';
  const gradeWord = trophy.grade[0].toUpperCase() + trophy.grade.slice(1);
  official.textContent = spoilerHidden(trophy)
    ? 'Spoiler-free mode is on: earn this story trophy to reveal its guide.'
    : `“${trophy.description}” — ${gradeWord}${trophy.count ? ` · PSN tracks ${trophy.count.toLocaleString('en-US')}` : ''}${trophy.hidden ? ' · Hidden on PSN' : ''}`;
  pane.append(title, official);
  if (trophy.missable) {
    const banner = document.createElement('p');
    banner.className = 'missable-banner';
    banner.textContent = 'Possibly missable — see the guide below and the Missables view before you play past Chapter 1.';
    pane.appendChild(banner);
  }
  if (!spoilerHidden(trophy)) {
    const guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = trophy.guide;
    pane.appendChild(guide);
    const sources = document.createElement('div');
    sources.className = 'sources-block';
    const line = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Sources: ';
    line.appendChild(strong);
    (trophy.sources ?? []).forEach((source, i) => {
      if (i > 0) line.appendChild(document.createTextNode('; '));
      const a = document.createElement('a');
      a.href = source.url;
      a.textContent = source.label;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      line.appendChild(a);
    });
    line.appendChild(document.createTextNode('.'));
    sources.appendChild(line);
    pane.appendChild(sources);
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'earned-button' + (isEarned(trophy.id) ? ' is-earned' : '');
  button.textContent = isEarned(trophy.id) ? 'Earned ✓ — tap to unmark' : 'Mark as earned';
  button.addEventListener('click', () => toggleEarned(trophy.id));
  pane.appendChild(button);
}

function renderRoadmap() {
  const list = els['roadmap-list'];
  list.replaceChildren();
  for (const stage of STAGES) {
    const inStage = state.trophies.filter((t) => t.stage === stage.n);
    const done = inStage.filter((t) => isEarned(t.id)).length;
    const card = document.createElement('section');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.n} — `;
    h.append(num, document.createTextNode(stage.title));
    const desc = document.createElement('p');
    desc.className = 'stage-desc';
    desc.textContent = stage.desc;
    const prog = document.createElement('p');
    prog.className = 'stage-progress';
    prog.textContent = `${done} of ${inStage.length} earned in this stage`;
    const chips = document.createElement('div');
    chips.className = 'stage-chips';
    for (const t of inStage) {
      const chip = document.createElement('span');
      chip.className = 'stage-chip' + (isEarned(t.id) ? ' is-earned' : '');
      chip.textContent = displayName(t);
      chips.appendChild(chip);
    }
    card.append(h, desc, prog, chips);
    list.appendChild(card);
  }
}

function renderMissables() {
  const list = els['missables-list'];
  list.replaceChildren();
  for (const trophy of state.trophies.filter((t) => t.missable)) {
    const card = document.createElement('section');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = trophy.name;
    const banner = document.createElement('p');
    banner.className = 'missable-banner';
    banner.textContent = 'Possibly missable — other guides report the first meditation spot is offered in Chapter 1 and becomes unavailable after it. That is an inference from those guides, not a confirmed fact.';
    const guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = trophy.guide;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'earned-button';
    open.textContent = 'Open in the checklist';
    open.addEventListener('click', () => { setView('checklist'); selectTrophy(trophy.id); });
    card.append(h, banner, guide, open);
    list.appendChild(card);
  }
}

function render() {
  renderProgress();
  renderList();
  renderGuide();
  renderRoadmap();
  renderMissables();
  for (const section of ['checklist', 'roadmap', 'missables']) {
    document.getElementById(`view-${section}`).hidden = state.view !== section;
    document.getElementById(`tab-${section}`).classList.toggle('is-active', state.view === section);
  }
  els['spoiler-toggle'].checked = state.progress.spoiler;
  els['spoiler-toggle'].toggleAttribute('checked', state.progress.spoiler);
  for (const chip of els['kind-filters'].querySelectorAll('.kind-chip')) {
    chip.classList.toggle('is-active', chip.dataset.kind === state.kind);
  }
  els['grade-filter'].value = state.grade;
}

function setView(view) { state.view = view; render(); }

function selectTrophy(id) { state.selectedId = id; renderList(); renderGuide(); }

function toggleEarned(id) {
  const set = new Set(state.progress.earned);
  if (set.has(id)) set.delete(id); else set.add(id);
  state.progress.earned = [...set].sort((a, b) => a - b);
  persist();
  render();
}

function applyShotScene() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  state.demo = true;
  state.progress = { earned: [...DEMO_EARNED], counters: { ...DEMO_COUNTERS }, spoiler: false };
  if (shot === 'cover') {
    state.view = 'checklist';
    state.selectedId = 17;
  } else if (shot === 'roadmap') {
    state.view = 'roadmap';
  } else if (shot === 'tracker') {
    state.view = 'checklist';
    state.kind = 'missable';
    state.progress.spoiler = true;
    state.selectedId = 28;
  } else if (shot === 'guide') {
    state.view = 'checklist';
    state.selectedId = 28;
  }
}

function wireControls() {
  els['search-input'].addEventListener('input', () => { state.search = els['search-input'].value.trim(); renderList(); });
  els['kind-filters'].addEventListener('click', (e) => {
    const chip = e.target.closest('.kind-chip');
    if (!chip) return;
    state.kind = chip.dataset.kind;
    render();
  });
  els['grade-filter'].addEventListener('change', () => { state.grade = els['grade-filter'].value; renderList(); render(); });
  els['spoiler-toggle'].addEventListener('change', () => {
    state.progress.spoiler = els['spoiler-toggle'].checked;
    persist();
    render();
  });
  els['export-button'].addEventListener('click', () => exportProgress(state.progress));
  els['import-button'].addEventListener('click', () => els['import-file'].click());
  els['import-file'].addEventListener('change', async () => {
    const file = els['import-file'].files?.[0];
    if (!file) return;
    try {
      state.progress = parseProgress(JSON.parse(await file.text()));
      persist();
      els['import-note'].textContent = 'Progress imported.';
      render();
    } catch {
      els['import-note'].textContent = 'That file could not be read as Leonida Ledger progress.';
    }
    els['import-file'].value = '';
  });
  els['reset-button'].addEventListener('click', () => {
    state.progress = emptyProgress();
    state.selectedId = null;
    persist();
    els['import-note'].textContent = 'Progress reset.';
    render();
  });
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  }
}

async function boot() {
  applyShotScene();
  if (!state.demo) state.progress = loadProgress();
  const response = await fetch('./data/trophies.json');
  const data = await response.json();
  state.trophies = data.trophies;
  wireControls();
  render();
}

boot();
