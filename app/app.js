// Leonida Ledger: an offline guide and tracker for the 55 official GTA 6 trophies.
// Data comes only from ./data/trophies.json. Progress lives in localStorage via store.js,
// except in demo mode (?shot=cover|roadmap|tracker|guide), which renders a fixed state
// for screenshots and never reads or writes localStorage.

import { demoProgress, emptyProgress, exportProgress, loadProgress, parseImport, saveProgress } from './store.js';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  moments: 'Moments',
  completion: 'Completion',
  online: 'Online',
};
const KIND_FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'online'];

const STAGES = [
  { n: 1, title: 'Play the story', blurb: 'Chapters 1 to 5 and the named story missions. Every chapter and mission trophy pops as you play; none of them can be missed.' },
  { n: 2, title: 'Side characters and strangers', blurb: 'Finish the mission strands for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 stranger strands across Leonida.' },
  { n: 3, title: 'Activities and skills', blurb: "Shooting Range golds, races, drone races, fishing, arcade games, bowling, stunts and challenges. One try each is enough for Master of None." },
  { n: 4, title: 'Explore and collect', blurb: 'Meditation spots (do the Chapter 1 spot the first time it is offered), card sets, WAiNK It locations, vehicles and all 52 areas.' },
  { n: 5, title: 'Crime and the crew', blurb: 'Vaults, armored trucks, shops, jewelry stores, gang operations, Combat Focus and the melee drive-by. Bring a getaway car.' },
  { n: 6, title: 'Odd moments and cleanup', blurb: 'The cryptic trophies whose descriptions are riddles, and the watch-list moments. Try each the first time you can.' },
  { n: 7, title: 'Money, property and 100%', blurb: 'Launder $250,000 of Marked Bills, spend $100,000, buy all 8 garages, register 10 vehicles — then 100% completion and the platinum.' },
];

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const DEMO = ['cover', 'roadmap', 'tracker', 'guide'].includes(shot);

const els = {
  earnedBig: document.getElementById('earned-big'),
  earnedLine: document.getElementById('earned-line'),
  gradeLine: document.getElementById('grade-line'),
  barFill: document.getElementById('bar-fill'),
  search: document.getElementById('search'),
  grade: document.getElementById('grade-filter'),
  spoiler: document.getElementById('spoiler-toggle'),
  showing: document.getElementById('showing'),
  list: document.getElementById('trophy-list'),
  detail: document.getElementById('detail'),
  roadmap: document.getElementById('roadmap-view'),
  missables: document.getElementById('missables-view'),
  onlineNote: document.getElementById('online-note'),
  importFile: document.getElementById('import-file'),
};

let trophies = [];
let state = DEMO ? demoProgress() : loadProgress();
let view = 'checklist';
let kindFilter = 'all';
let selectedName = null;

function isEarned(t) {
  return Boolean(state.earned[t.name]);
}

function countOf(t) {
  return Number(state.counts[t.name] || 0);
}

function persist() {
  if (!DEMO) saveProgress(state);
}

function totals() {
  const byGrade = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  let earned = 0;
  for (const t of trophies) {
    byGrade[t.grade][1] += 1;
    if (isEarned(t)) {
      earned += 1;
      byGrade[t.grade][0] += 1;
    }
  }
  return { earned, byGrade, pct: trophies.length ? Math.round((earned / trophies.length) * 100) : 0 };
}

function spoilerHides(t) {
  return els.spoiler.checked && !isEarned(t) && (t.hidden || t.kind === 'story');
}

function displayName(t) {
  return spoilerHides(t) ? 'Hidden trophy' : t.name;
}

function displayDesc(t) {
  return spoilerHides(t) ? 'Details stay hidden until this trophy is earned.' : t.description;
}

function matchesKind(t) {
  if (kindFilter === 'all') return true;
  if (kindFilter === 'missable') return Boolean(t.missable);
  return t.kind === kindFilter;
}

function visibleTrophies() {
  const q = els.search.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (els.grade.value !== 'all' && t.grade !== els.grade.value) return false;
    if (view === 'missables' && !t.missable) return false;
    if (q && !spoilerHides(t)) {
      const hay = (t.name + ' ' + t.description + ' ' + t.kind).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (q && spoilerHides(t)) return false;
    return true;
  });
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function badge(text, cls) {
  return el('span', 'badge ' + (cls || ''), text);
}

function renderHeader() {
  const { earned, byGrade, pct } = totals();
  els.earnedBig.textContent = String(earned);
  els.earnedLine.textContent = 'trophies earned · ' + pct + '% to the platinum';
  els.barFill.style.width = pct + '%';
  els.gradeLine.textContent =
    'Platinum ' + byGrade.platinum[0] + '/' + byGrade.platinum[1] +
    ' · Gold ' + byGrade.gold[0] + '/' + byGrade.gold[1] +
    ' · Silver ' + byGrade.silver[0] + '/' + byGrade.silver[1] +
    ' · Bronze ' + byGrade.bronze[0] + '/' + byGrade.bronze[1];
}

function renderList() {
  const list = view === 'roadmap' ? [] : visibleTrophies();
  els.showing.textContent = view === 'roadmap'
    ? 'Roadmap: all ' + trophies.length + ' trophies in 7 stages'
    : 'Showing ' + list.length + ' of ' + trophies.length + ' trophies';
  els.onlineNote.hidden = kindFilter !== 'online';
  els.list.replaceChildren();
  for (const t of list) {
    const card = el('article', 'card' + (isEarned(t) ? ' earned' : '') + (t.missable ? ' missable-card' : ''));
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = isEarned(t);
    check.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    check.addEventListener('change', () => {
      if (check.checked) state.earned[t.name] = true;
      else delete state.earned[t.name];
      persist();
      render();
    });
    card.append(check);
    const body = el('div', 'card-body');
    const title = el('button', 'card-title', displayName(t));
    title.type = 'button';
    title.addEventListener('click', () => {
      selectedName = t.name;
      renderDetail();
      els.detail.scrollIntoView({ block: 'start' });
    });
    body.append(title);
    body.append(el('p', 'card-desc', displayDesc(t)));
    const badges = el('div', 'badges');
    badges.append(badge(t.grade.toUpperCase(), 'grade-' + t.grade));
    if (t.hidden) badges.append(badge('HIDDEN', 'hidden-badge'));
    if (t.missable) badges.append(badge('POSSIBLY MISSABLE', 'missable-badge'));
    badges.append(badge((KIND_LABEL[t.kind] || t.kind).toUpperCase(), 'kind-badge'));
    body.append(badges);
    if (t.target) {
      const row = el('div', 'counter-row');
      row.append(el('span', null, 'Progress'));
      const minus = el('button', 'stepper', '−');
      minus.type = 'button';
      minus.addEventListener('click', () => setCount(t, countOf(t) - 1));
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(t.target);
      input.value = String(countOf(t));
      input.setAttribute('aria-label', 'Progress for ' + t.name);
      input.addEventListener('change', () => setCount(t, Number(input.value)));
      const plus = el('button', 'stepper', '+');
      plus.type = 'button';
      plus.addEventListener('click', () => setCount(t, countOf(t) + 1));
      row.append(minus, input, plus, el('span', null, '/ ' + t.target.toLocaleString('en-US') + (t.unit ? ' ' + t.unit : '')));
      body.append(row);
    }
    card.append(body);
    const side = el('div', 'card-side');
    side.append(el('div', 'side-grade', GRADE_LABEL[t.grade]));
    side.append(el('div', 'side-id', '#' + t.id));
    card.append(side);
    els.list.append(card);
  }
}

function setCount(t, value) {
  const clamped = Math.max(0, Math.min(t.target || 0, Math.floor(Number(value) || 0)));
  if (clamped > 0) state.counts[t.name] = clamped;
  else delete state.counts[t.name];
  if (t.target && clamped >= t.target) state.earned[t.name] = true;
  persist();
  render();
}

function sourceAnchors(t) {
  const wrap = el('div', 'sources');
  wrap.append(el('strong', null, 'Sources: '));
  const labels = Array.isArray(t.sources) && t.sources.length ? t.sources : ['PSNProfiles trophy page', 'Exophase trophy page'];
  labels.forEach((label, i) => {
    // Every citation is a reader-followed anchor into the footer, where the two source
    // listings are linked; the app itself never fetches a citation.
    const a = document.createElement('a');
    a.href = label.includes('PSNProfiles') ? '#source-psnprofiles' : label.includes('Exophase') ? '#source-exophase' : '#sources-note';
    a.textContent = label;
    wrap.append(a);
    if (i < labels.length - 1) wrap.append(document.createTextNode(' · '));
  });
  return wrap;
}

function renderDetail() {
  const t = trophies.find((x) => x.name === selectedName) || null;
  els.detail.replaceChildren();
  if (!t) {
    els.detail.append(el('p', 'detail-hint', 'Pick any trophy in the checklist to read its full guide here, with its sources.'));
    return;
  }
  const panel = el('section', 'detail-panel');
  panel.append(el('h2', null, displayName(t)));
  const meta = '"' + displayDesc(t) + '" — ' + GRADE_LABEL[t.grade] + (t.target ? ' · PSN tracks ' + t.target.toLocaleString('en-US') : '') + ' · Stage ' + t.stage;
  panel.append(el('p', 'detail-meta', meta));
  if (t.missable) {
    panel.append(el('p', 'missable-banner', 'Possibly missable — see the guide below and the Missables view before you play past Chapter 1. This flag is an inference reported by other guides, not a confirmed fact.'));
  }
  if (!spoilerHides(t)) {
    panel.append(el('p', 'guide-text', t.guide));
    panel.append(sourceAnchors(t));
  } else {
    panel.append(el('p', 'guide-text', 'Spoiler-free mode is on, so this guide stays hidden until the trophy is earned.'));
  }
  const toggle = el('button', 'earn-toggle' + (isEarned(t) ? ' is-earned' : ''), isEarned(t) ? 'Earned ✓ — tap to unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    if (isEarned(t)) delete state.earned[t.name];
    else state.earned[t.name] = true;
    persist();
    render();
  });
  panel.append(toggle);
  els.detail.append(panel);
}

function renderRoadmap() {
  els.roadmap.replaceChildren();
  const head = el('div', 'roadmap-head');
  head.append(el('h2', null, 'Roadmap to the platinum'));
  head.append(el('p', null, 'Seven stages, built from the official trophy descriptions. Story first, with the one possibly missable trophy flagged, then side content, activities, collectibles, crime, odd moments, and finally money and 100% completion. The platinum pops when the other 54 are done.'));
  els.roadmap.append(head);
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter(isEarned).length;
    const box = el('section', 'stage');
    const title = el('h3', null);
    title.append(el('span', 'stage-n', 'Stage ' + stage.n + ' — '));
    title.append(document.createTextNode(stage.title));
    box.append(title);
    box.append(el('p', 'stage-progress', done + ' / ' + members.length + ' earned in this stage'));
    box.append(el('p', null, stage.blurb));
    const chips = el('div', 'chips');
    for (const t of members) {
      const chip = el('button', 'chip' + (isEarned(t) ? ' done' : ''), displayName(t) + (t.missable ? ' ⚠' : ''));
      chip.type = 'button';
      chip.addEventListener('click', () => {
        selectedName = t.name;
        setView('checklist');
        renderDetail();
        els.detail.scrollIntoView({ block: 'start' });
      });
      chips.append(chip);
    }
    box.append(chips);
    els.roadmap.append(box);
  }
}

function renderMissables() {
  els.missables.replaceChildren();
  els.missables.append(el('h2', null, 'Missables'));
  els.missables.append(el('p', null, 'Only one trophy in the official list is flagged as possibly missable in this guide, and the flag is an inference reported by other guides, not a confirmed fact: the first meditation spot for Positive Mental Attitude is offered in Chapter 1 and is reported to become unavailable after that chapter. Every other trophy can be earned in free roam or by replaying the relevant activity, as far as the official descriptions show.'));
  for (const t of trophies.filter((x) => x.missable)) {
    const box = el('section', 'stage');
    box.append(el('h3', null, t.name));
    box.append(el('p', 'detail-meta', '"' + t.description + '" — ' + GRADE_LABEL[t.grade]));
    box.append(el('p', 'missable-banner', 'Possibly missable (inference) — meditate at the Chapter 1 spot the first time it is offered, and keep a manual save at the start of each chapter.'));
    box.append(el('p', 'guide-text', t.guide));
    box.append(sourceAnchors(t));
    els.missables.append(box);
  }
}

function render() {
  renderHeader();
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  document.querySelectorAll('.kind-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === kindFilter);
  });
  els.list.hidden = view === 'roadmap';
  els.showing.hidden = view !== 'checklist' && view !== 'missables';
  els.roadmap.hidden = view !== 'roadmap';
  els.missables.hidden = view !== 'missables';
  renderList();
  renderDetail();
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

function setView(next) {
  view = next;
  render();
}

function applyDemoScene() {
  if (!DEMO) return;
  if (shot === 'cover') {
    view = 'checklist';
    kindFilter = 'all';
    selectedName = 'The Shootist';
  } else if (shot === 'roadmap') {
    view = 'roadmap';
    kindFilter = 'all';
  } else if (shot === 'tracker') {
    view = 'checklist';
    kindFilter = 'missable';
    els.spoiler.checked = true;
    selectedName = 'Positive Mental Attitude';
  } else if (shot === 'guide') {
    view = 'checklist';
    kindFilter = 'all';
    selectedName = 'Positive Mental Attitude';
  }
}

async function boot() {
  const response = await fetch('./data/trophies.json');
  const doc = await response.json();
  trophies = Array.isArray(doc) ? doc : doc.trophies;
  applyDemoScene();
  render();
  if (DEMO && shot === 'guide') {
    requestAnimationFrame(() => els.detail.scrollIntoView({ block: 'start' }));
  }
}

document.querySelectorAll('.view-tab').forEach((tab) => {
  tab.addEventListener('click', () => setView(tab.dataset.view));
});

const kindBar = document.getElementById('kind-bar');
for (const kind of KIND_FILTERS) {
  const chip = el('button', 'kind-chip' + (kind === 'all' ? ' active' : ''), kind === 'all' ? 'All' : kind === 'missable' ? 'Missable' : KIND_LABEL[kind]);
  chip.type = 'button';
  chip.dataset.kind = kind;
  chip.addEventListener('click', () => {
    kindFilter = kind;
    if (view !== 'checklist') view = 'checklist';
    render();
  });
  kindBar.append(chip);
}

els.search.addEventListener('input', render);
els.grade.addEventListener('change', render);
els.spoiler.addEventListener('change', render);

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([exportProgress(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import-btn').addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', async () => {
  const file = els.importFile.files && els.importFile.files[0];
  if (!file) return;
  try {
    state = parseImport(await file.text());
    persist();
    render();
  } catch {
    els.showing.textContent = 'That file could not be read as Leonida Ledger progress.';
  }
  els.importFile.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  state = emptyProgress();
  persist();
  render();
});

boot();
