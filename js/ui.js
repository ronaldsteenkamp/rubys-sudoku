// De interface: startscherm, bord, bediening, dialogen en het feestje.

import { Game } from './game.js';
import { LEVELS, levelById, dateKey, dailyLevelFor, HEART_MASK, HEART_OUTLINE } from './generator.js';
import { getHint, stageCells } from './hints.js';
import { PEERS, rowOf, colOf, bit } from './solver.js';
import * as store from './storage.js';
import * as M from './messages.js';
import { THEMES, AUTO_CHOICES, themeById, resolveTheme } from './themes.js';
import { feedback, configure as configureFeedback, hasHaptics } from './feedback.js';

const $ = (sel) => document.querySelector(sel);

// ---------- Datum (met ?vandaag=JJJJ-MM-DD om speciale dagen te testen) ----------

const params = new URLSearchParams(location.search);
function today() {
  const o = params.get('vandaag');
  const now = new Date();
  if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) {
    const [y, m, d] = o.split('-').map(Number);
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes());
  }
  return now;
}

// ---------- Status ----------

let settings = store.loadSettings();
let stats = store.loadStats();
let unlocked = store.loadUnlocked();
let game = Game.fromJSON(store.loadGame());
let selected = null;
let focusDigit = null;
let notesMode = false;
let hint = null;
let hintStage = 0;
let checkMarks = new Set();
let popCell = null;
let paused = false;

// ---------- Icoontjes ----------

const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICONS = {
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  menu: svg('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>'),
  redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>'),
  erase: svg('<path d="M8 20h12"/><path d="M5.6 13.6l7.5-7.5a2 2 0 012.8 0l2.9 2.9a2 2 0 010 2.8L12 18.6H8.6l-3-3a1.4 1.4 0 010-2z"/>'),
  pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  bulb: svg('<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 00-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0012 3z"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  stats: svg('<path d="M4 20h16"/><path d="M6.5 16v-5M12 16V5M17.5 16v-8"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7.5l8 6 8-6"/>'),
  settings: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  check: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.2 9.5"/>'),
  fillNotes: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/>'),
  reset: svg('<path d="M4.5 12a7.5 7.5 0 107.5-7.5A7.7 7.7 0 006.3 7.2L4.5 9"/><path d="M4.5 4.5V9H9"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 014.9.7c0 1.7-2.5 2.1-2.5 3.8"/><path d="M12 17.3v.1"/>'),
  install: svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7.5v6.5M9.5 11.5L12 14l2.5-2.5"/><path d="M10.5 18.5h3"/>'),
  backupSave: svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>'),
  backupRestore: svg('<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M5 19.5h14"/>'),
};

// Vult alle <span data-icon="..."> in de pagina met het bijbehorende lijnicoon.
function fillIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) el.innerHTML = ICONS[el.dataset.icon] || '';
}

// ---------- Hulpjes ----------

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer = null;
function toast(text, ms = 2600) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

const announce = (text) => { $('#sr-status').textContent = text; };

function saveGame() {
  if (game && !game.solved) store.saveGame(game.toJSON());
}

// ---------- Thema ----------

// Een mini-voorproefje in de kleuren van het thema (achtergrond, accent en een cijfer).
function themePreview(id) {
  const { bg, surface, accent, digit } = themeById(id).swatch;
  return `<span class="tp" style="--tp-bg:${bg};--tp-surface:${surface};--tp-accent:${accent};--tp-digit:${digit}"><b>7</b><em></em></span>`;
}
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const t = resolveTheme(settings.theme, darkQuery.matches);
  document.documentElement.dataset.theme = t;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]').setAttribute('content', bg || '#fff8e7');
}
darkQuery.addEventListener?.('change', applyTheme);

// ---------- Puzzels ophalen (Web Worker, met vangnet op de hoofdthread) ----------

let worker;
let reqId = 0;
const pending = new Map();

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      clearTimeout(p.timer);
      if (data.error) p.reject(new Error(data.error)); else p.resolve(data.puzzle);
    };
    worker.onerror = () => {
      worker = null;
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('worker')); }
      pending.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function generateHere(kind, args) {
  const g = await import('./generator.js');
  if (kind === 'daily') return g.generateDaily(new Date(args.date));
  if (kind === 'heart') return g.generateHeart(args.seed);
  return g.generate(args);
}

function requestPuzzle(kind, args) {
  const w = getWorker();
  if (!w) return generateHere(kind, args);
  return new Promise((resolve, reject) => {
    const id = ++reqId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, 8000);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, kind, args });
  }).catch(() => generateHere(kind, args));
}

// Per niveau ligt er alvast een puzzel klaar, zodat starten meteen gaat.
let stashBusy = false;
async function fillStash() {
  if (stashBusy) return;
  stashBusy = true;
  try {
    for (const l of LEVELS) {
      if (store.loadStash()[l.id]) continue;
      const p = await requestPuzzle('level', { levelId: l.id, timeBudget: 400 });
      const s = store.loadStash();
      s[l.id] = p;
      store.saveStash(s);
    }
  } catch { /* volgende keer beter */ }
  stashBusy = false;
}

async function takePuzzle(levelId) {
  const s = store.loadStash();
  const p = s[levelId];
  if (p?.givens?.length === 81) {
    delete s[levelId];
    store.saveStash(s);
    setTimeout(fillStash, 800);
    return p;
  }
  return requestPuzzle('level', { levelId, timeBudget: 400 });
}

// ---------- Dialogen ----------

function openDialog(id) {
  const d = document.getElementById(id);
  if (!d.open) d.showModal();
  return d;
}

function closeDialog(id) {
  const d = document.getElementById(id);
  if (d.open) d.close();
}

function confirmDialog(title, text, yes = 'Ja', no = 'Nee') {
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  $('#confirm-yes').textContent = yes;
  $('#confirm-no').textContent = no;
  const d = openDialog('confirm-dialog');
  return new Promise((resolve) => {
    const done = (v) => { cleanup(); d.close(); resolve(v); };
    const onYes = () => done(true), onNo = () => done(false), onCancel = () => { cleanup(); resolve(false); };
    const cleanup = () => {
      $('#confirm-yes').removeEventListener('click', onYes);
      $('#confirm-no').removeEventListener('click', onNo);
      d.removeEventListener('close', onCancel);
    };
    $('#confirm-yes').addEventListener('click', onYes);
    $('#confirm-no').addEventListener('click', onNo);
    d.addEventListener('close', onCancel, { once: true });
  });
}

function showMessage({ icon = '💛', title = '', text = '', ok = 'Oké' }) {
  $('#message-icon').textContent = icon;
  // Staat hetzelfde emoji al groot bovenaan, dan niet nog eens achter de titel.
  if (icon && title.endsWith(icon)) title = title.slice(0, -icon.length).trimEnd();
  $('#message-title').textContent = title;
  $('#message-text').textContent = text;
  $('#message-ok').textContent = ok;
  const d = openDialog('message-dialog');
  return new Promise((resolve) => {
    const onOk = () => d.close();
    $('#message-ok').addEventListener('click', onOk, { once: true });
    d.addEventListener('close', () => { $('#message-ok').removeEventListener('click', onOk); resolve(); }, { once: true });
  });
}

// ---------- Startscherm ----------

function renderHome() {
  const now = today();
  $('#greeting').textContent = M.greeting(now);
  $('#subtitle').textContent = M.SUBTITLES[Math.floor(Math.random() * M.SUBTITLES.length)];
  const days = M.daysTogether(now);
  $('#together').textContent = days > 0 ? `Al ${days} ${days === 1 ? 'dag' : 'dagen'} samen 💛` : '';

  // Speciale dag
  const special = M.specialDay(now);
  const specialSlot = $('#special-slot');
  specialSlot.innerHTML = '';
  if (special) {
    const done = stats.specialDone.includes(special.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card special';
    btn.innerHTML = `<span class="card-kicker">Speciaal voor vandaag</span>
      <span class="card-title">${escapeHtml(special.title)}</span>
      <span class="card-meta">${done ? 'Opgelost 💛 Tik om je berichtje nog eens te lezen' : 'Een puzzel met een verrassing'}</span>`;
    btn.addEventListener('click', async () => {
      if (done) { showMessage({ icon: '💌', title: special.title, text: M.specialById(special.id)?.solvedText || special.solvedText }); return; }
      await showMessage({ icon: special.kind === 'verjaardag' ? '🎂' : '💛', title: special.title, text: special.text, ok: 'Laat maar zien!' });
      startGame({ kind: 'heart', special });
    });
    specialSlot.append(btn);
  }

  // Verder spelen
  const cont = $('#continue-slot');
  cont.innerHTML = '';
  // De dagpuzzel zelf heeft al een "Verder"-knop in z'n eigen kaart.
  if (game && !game.solved && game.daily !== dateKey(now)) {
    const lvl = levelById(game.levelId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card continue';
    const what = game.special ? 'Speciale puzzel' : game.daily ? 'Dagpuzzel' : `${lvl.emoji} ${lvl.name}`;
    btn.innerHTML = `<span class="card-kicker">Verder puzzelen</span>
      <span class="card-title">${escapeHtml(what)}</span>
      <span class="card-meta">${settings.showTimer ? formatTime(game.elapsed) + ' · ' : ''}${game.values.filter(Boolean).length} van 81 vakjes</span>`;
    btn.addEventListener('click', () => enterPlay());
    cont.append(btn);
  }

  renderInstall();
  renderUpdate();

  // Dagpuzzel
  const key = dateKey(now);
  const dl = levelById(dailyLevelFor(now));
  const doneToday = stats.dailyDone.includes(key);
  const doneTime = stats.dailyTimes[key];
  const busy = game && !game.solved && game.daily === key;
  const streak = store.currentStreak(stats, key);
  $('#daily-title').textContent = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#daily-meta').textContent = `${dl.emoji} ${dl.name}`;
  const streakEl = $('#daily-streak');
  streakEl.hidden = !streak;
  streakEl.textContent = streak ? `🔥 ${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij` : '';
  const action = $('#daily-action');
  action.textContent = doneToday ? `Opgelost ✓${doneTime != null ? ` ${formatTime(doneTime)}` : ''}` : busy ? 'Verder' : 'Speel';
  action.classList.toggle('done', doneToday);

  // Hoe ver is het volgende geheime berichtje? (ringetje + badge op de knop Berichtjes)
  const next = M.nextMilestone({ ...stats, streak }, unlocked);
  const badge = $('#notes-badge');
  badge.hidden = !next;
  badge.textContent = next ? `nog ${next.remaining} 🔐` : '';
  $('#notes-nav .ring').style.setProperty('--p', next ? next.current / next.target : 1);
  $('#notes-nav').setAttribute('aria-label', next ? `Berichtjes. ${M.milestoneLine(next).replace(' 🔐', '')}` : 'Berichtjes');

  // Niveaus
  const levels = $('#levels');
  levels.innerHTML = '';
  for (const l of LEVELS) {
    const best = stats.levels[l.id]?.best;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level';
    btn.dataset.level = l.id;
    btn.innerHTML = `<span class="level-emoji" aria-hidden="true">${l.emoji}</span>
      <span class="level-name">${escapeHtml(l.name)}</span>
      <span class="level-tag">${escapeHtml(l.tagline)}</span>
      <span class="level-best">${best ? `Record ${formatTime(best)}` : 'Nog geen record'}</span>`;
    btn.addEventListener('click', () => startGame({ kind: 'level', levelId: l.id }));
    levels.append(btn);
  }
}

function showScreen(name) {
  $('#home').hidden = name !== 'home';
  $('#play').hidden = name !== 'play';
  window.scrollTo(0, 0);
}

function goHome() {
  closeHint();
  stopTimer();
  saveGame();
  renderHome();
  showScreen('home');
}

// ---------- Spel starten ----------

let starting = false;
async function startGame({ kind, levelId, special }) {
  if (starting) return;
  if (game && !game.solved && game.history.length) {
    const ok = await confirmDialog('Nieuwe puzzel?', 'Je bent nog bezig met een puzzel. Die wordt dan vervangen.', 'Ja, nieuwe', 'Nee, terug');
    if (!ok) return;
  }
  starting = true;
  const slow = setTimeout(() => toast(M.LOADING_LINES[Math.floor(Math.random() * M.LOADING_LINES.length)], 4000), 150);
  try {
    let p;
    if (kind === 'daily') p = await requestPuzzle('daily', { date: today().getTime() });
    else if (kind === 'heart') p = await requestPuzzle('heart', { seed: special.seed });
    else p = await takePuzzle(levelId);
    game = new Game({
      givens: p.givens, solution: p.solution, levelId: p.levelId,
      daily: p.daily || null, special: special?.id || null, shape: p.shape || null,
    });
    store.recordStart(stats, game.levelId);
    store.saveStats(stats);
    saveGame();
    selected = null;
    focusDigit = null;
    checkMarks = new Set();
    enterPlay();
  } catch (err) {
    console.error(err);
    toast('Oeps, dat lukte even niet. Probeer je het nog eens?');
  } finally {
    clearTimeout(slow);
    $('#toast').hidden = true;
    starting = false;
  }
}

function enterPlay() {
  if (!game) return;
  const lvl = levelById(game.levelId);
  $('#play-title').textContent = game.special ? 'Speciaal voor jou ❤️' : game.daily ? `Dagpuzzel · ${lvl.name}` : `${lvl.emoji} ${lvl.name}`;
  notesMode = false;
  hint = null;
  paused = false;
  $('#board').classList.remove('reveal', 'heartbeat');
  $('#play').classList.remove('paused');
  showScreen('play');
  render();
  renderTimer();
  startTimer();
  $('#board').focus({ preventScroll: true });
}

// ---------- Bord & bediening opbouwen ----------

function buildBoard() {
  const board = $('#board');
  board.setAttribute('role', 'group');
  for (let i = 0; i < 81; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.dataset.i = i;
    b.tabIndex = -1;
    b.style.setProperty('--rd', 8 - rowOf(i)); // voor de hart-onthulling
    board.append(b);
  }
  board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || paused) return;
    selected = Number(cell.dataset.i);
    focusDigit = null;
    render();
  });

  const tools = [
    ['undo', 'Terug', ICONS.undo, () => doUndo()],
    ['redo', 'Opnieuw', ICONS.redo, () => doRedo()],
    ['erase', 'Gum', ICONS.erase, () => doErase()],
    ['notes', 'Notities', ICONS.pencil, () => toggleNotes()],
    ['hint', 'Hint', ICONS.bulb, () => showHint()],
  ];
  const toolsEl = $('#tools');
  for (const [id, label, icon, fn] of tools) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.id = `tool-${id}`;
    b.innerHTML = `${icon}<span>${label}${id === 'notes' ? ' <span class="tool-state">uit</span>' : ''}</span>`;
    b.addEventListener('click', fn);
    toolsEl.append(b);
  }
  $('#tool-notes').setAttribute('aria-pressed', 'false');

  const pad = $('#numpad');
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'num';
    b.dataset.d = d;
    b.innerHTML = `${d}<small></small>`;
    b.addEventListener('click', () => inputDigit(d));
    pad.append(b);
  }
  addLongPress(pad);

  fillIcons();
  $('#back-btn').innerHTML = ICONS.back;
  $('#pause-btn').innerHTML = ICONS.pause;
  $('#menu-btn').innerHTML = ICONS.menu;
}

// Lang drukken (~400 ms) op een cijfer zet het als notitie, ook zonder notitiemodus.
const LONG_PRESS_MS = 400;
function addLongPress(pad) {
  let timer = null;
  let startX = 0, startY = 0;
  let firedOn = null; // knop waarop de lange druk al is afgegaan
  const cancel = () => { clearTimeout(timer); timer = null; };

  pad.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.num');
    if (!b || b.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    cancel();
    firedOn = null;
    startX = e.clientX; startY = e.clientY;
    timer = setTimeout(() => {
      timer = null;
      firedOn = b;
      feedback('hold');
      inputDigit(Number(b.dataset.d), { note: true });
    }, LONG_PRESS_MS);
  });
  pad.addEventListener('pointermove', (e) => {
    if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) cancel();
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) pad.addEventListener(t, cancel);
  // De gewone klik na een lange druk niet ook nog laten afgaan.
  pad.addEventListener('click', (e) => {
    if (firedOn && e.target.closest('.num') === firedOn) { e.stopImmediatePropagation(); e.preventDefault(); }
    firedOn = null;
  }, true);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ---------- Tekenen ----------

const cellCache = new Array(81).fill('');

function render() {
  if (!game) return;
  const stage = hint ? hint.stages[hintStage] : null;
  const selVal = selected != null ? game.values[selected] : 0;
  const hlDigit = stage ? stage.digit ?? null : (settings.highlightSame ? (selVal || focusDigit) : null);
  const peerSet = selected != null && !stage ? new Set(PEERS[selected]) : null;
  const region = stage ? new Set(stageCells(stage)) : null;
  const focus = stage ? new Set(stage.cells || []) : null;
  const strike = new Map();
  if (stage?.strike) for (const { cell, digit } of stage.strike) strike.set(cell, (strike.get(cell) || 0) | bit(digit));
  const showWrong = settings.errors === 'direct';

  const cells = $('#board').children;
  for (let i = 0; i < 81; i++) {
    const v = game.values[i];
    const given = game.isGiven(i);
    const wrong = !given && v && (showWrong ? game.isWrong(i) : checkMarks.has(i));
    const cls = ['cell'];
    if (v) cls.push(given ? 'given' : 'user');
    if (game.shape === 'heart' && HEART_MASK[i]) cls.push('in-heart', ...(HEART_OUTLINE[i] ? ['heart-edge'] : []), ...(given ? ['shape-heart'] : []));
    if (peerSet?.has(i)) cls.push('peer');
    if (hlDigit && v === hlDigit) cls.push('same');
    if (i === selected && !stage) cls.push('selected');
    if (wrong) cls.push('wrong');
    if (region?.has(i)) cls.push('hint-region');
    if (focus?.has(i)) cls.push('hint-focus');
    if (i === popCell) cls.push('pop');

    let html = '';
    if (v) html = `<span class="v">${v}</span>`;
    else if (game.notes[i]) {
      html = '<span class="notes">';
      for (let d = 1; d <= 9; d++) {
        const has = game.notes[i] & bit(d);
        const c = has ? ((strike.get(i) || 0) & bit(d) ? 'strike' : hlDigit === d ? 'hl' : '') : '';
        html += `<span class="${c}">${has ? d : ''}</span>`;
      }
      html += '</span>';
    }
    const className = cls.join(' ');
    const key = className + '|' + html;
    if (cellCache[i] !== key) {
      const el = cells[i];
      el.className = className;
      el.innerHTML = html;
      const notes = game.noteDigits(i);
      el.setAttribute('aria-label', `Rij ${rowOf(i) + 1}, kolom ${colOf(i) + 1}: ${
        v ? `${v}${given ? ', gegeven' : ''}${wrong ? ', klopt niet' : ''}` : notes.length ? `notities ${notes.join(' ')}` : 'leeg'}`);
      cellCache[i] = key;
    }
    cells[i].tabIndex = i === (selected ?? 0) ? 0 : -1;
  }
  popCell = null;

  const counts = game.counts();
  for (const b of $('#numpad').children) {
    const d = Number(b.dataset.d);
    const left = 9 - counts[d];
    b.disabled = left <= 0 || paused || game.solved;
    b.classList.toggle('active', hlDigit === d && !stage);
    const small = b.querySelector('small');
    const full = left <= 0;
    if (b.classList.contains('full') !== full || !small.firstChild) {
      small.innerHTML = full ? '✓' : '<i></i>'.repeat(9);
      b.classList.toggle('full', full);
    }
    if (!full) [...small.children].forEach((dot, k) => dot.classList.toggle('on', k < counts[d]));
    b.setAttribute('aria-label', left > 0 ? `${d}${notesMode ? ' als notitie' : ''}, nog ${left} over` : `${d}, staat er al 9 keer`);
  }
  $('#numpad').classList.toggle('notes-mode', notesMode);
  $('#tool-undo').disabled = !game.history.length || game.solved;
  $('#tool-redo').disabled = !game.future.length || game.solved;
  $('#tool-erase').disabled = game.solved;
  $('#tool-hint').disabled = game.solved;
  const nb = $('#tool-notes');
  nb.setAttribute('aria-pressed', String(notesMode));
  nb.querySelector('.tool-state').textContent = notesMode ? 'aan' : 'uit';
  $('#check-btn').hidden = settings.errors !== 'verzoek';
}

// ---------- Invoer ----------

function afterChange() {
  saveGame();
  render();
}

function inputDigit(d, { note = false } = {}) {
  if (!game || paused || game.solved) return;
  closeHint(false);
  if (selected == null || game.isGiven(selected) || (game.values[selected] && (notesMode || note))) {
    // Geen bewerkbaar vakje: dan markeren we gewoon dit cijfer op het bord.
    focusDigit = focusDigit === d ? null : d;
    if (selected != null && game.isGiven(selected)) selected = null;
    render();
    return;
  }
  if (notesMode || note) {
    if (game.toggleNote(selected, d).changed) feedback('note');
    checkMarks.delete(selected);
    afterChange();
    return;
  }
  const r = game.setDigit(selected, d, { autoNotes: settings.autoNotes });
  if (!r.changed) return;
  checkMarks.delete(selected);
  if (r.removed) feedback('erase');
  else {
    popCell = selected;
    if (r.wrong && settings.errors === 'direct') { feedback('wrong'); announce('Dit cijfer klopt niet'); }
    else if (game.counts()[d] === 9 && !r.solved) feedback('done');
    else feedback('place');
  }
  afterChange();
  if (r.solved) onSolved();
}

function doErase() {
  if (!game || paused || selected == null) return;
  closeHint(false);
  if (game.erase(selected).changed) { feedback('erase'); checkMarks.delete(selected); }
  afterChange();
}

function doUndo() {
  if (!game || paused) return;
  closeHint(false);
  const ch = game.undo();
  if (ch) { selected = ch[0].cell; feedback('erase'); }
  afterChange();
}

function doRedo() {
  if (!game || paused) return;
  closeHint(false);
  const ch = game.redo();
  if (ch) { selected = ch[0].cell; feedback('place'); }
  afterChange();
  if (game.solved) onSolved();
}

function toggleNotes() {
  notesMode = !notesMode;
  announce(notesMode ? 'Notities aan' : 'Notities uit');
  render();
}

function moveSelection(dr, dc) {
  const i = selected ?? 40;
  const r = (rowOf(i) + dr + 9) % 9, c = (colOf(i) + dc + 9) % 9;
  selected = r * 9 + c;
  focusDigit = null;
  render();
  $('#board').children[selected].focus({ preventScroll: true });
}

document.addEventListener('keydown', (e) => {
  if ($('#play').hidden || document.querySelector('dialog[open]')) return;
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); (e.shiftKey ? doRedo : doUndo)(); return; }
  if (mod && k === 'y') { e.preventDefault(); doRedo(); return; }
  if (mod || e.altKey) return;
  const digit = /^(Digit|Numpad)([1-9])$/.exec(e.code)?.[2] ?? (/^[1-9]$/.test(e.key) ? e.key : null);
  if (digit) { e.preventDefault(); inputDigit(Number(digit), { note: e.shiftKey }); return; }
  const moves = { arrowup: [-1, 0], arrowdown: [1, 0], arrowleft: [0, -1], arrowright: [0, 1] };
  if (moves[k]) { e.preventDefault(); moveSelection(...moves[k]); return; }
  if (k === 'backspace' || k === 'delete' || k === '0') { e.preventDefault(); doErase(); return; }
  if (k === 'n') { toggleNotes(); return; }
  if (k === 'h') { showHint(); return; }
  if (k === 'p' || k === 'escape') { if (hint && k === 'escape') closeHint(); else pause(); }
});

// ---------- Timer & pauze ----------

let timerId = null;
let lastTick = 0;
let tickCount = 0;

function startTimer() {
  clearInterval(timerId);
  lastTick = performance.now();
  timerId = setInterval(tick, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function tick() {
  const now = performance.now();
  if (game && !paused && !game.solved && !$('#play').hidden && document.visibilityState === 'visible') {
    game.elapsed += Math.min(now - lastTick, 2000);
    if (++tickCount % 5 === 0) saveGame();
  }
  lastTick = now;
  renderTimer();
}

function renderTimer() {
  const t = $('#timer');
  if (!game) return;
  t.textContent = settings.showTimer ? formatTime(game.elapsed) : '⏱ ••:••';
  t.setAttribute('aria-label', settings.showTimer ? `Tijd ${formatTime(game.elapsed)}, tik om te verbergen` : 'Tijd verborgen, tik om te tonen');
}

function pause() {
  if (!game || game.solved) return;
  paused = true;
  $('#play').classList.add('paused');
  $('#pause-line').textContent = M.PAUSE_LINES[Math.floor(Math.random() * M.PAUSE_LINES.length)];
  $('#pause-time').textContent = settings.showTimer ? `Je tijd staat stil op ${formatTime(game.elapsed)}` : 'De tijd staat stil.';
  render();
  openDialog('pause-dialog');
}

$('#pause-dialog').addEventListener('close', () => {
  paused = false;
  lastTick = performance.now();
  $('#play').classList.remove('paused');
  render();
});

document.addEventListener('visibilitychange', () => {
  lastTick = performance.now();
  if (document.visibilityState === 'hidden') saveGame();
});
window.addEventListener('pagehide', saveGame);

// ---------- Slimme hints ----------

function showHint() {
  if (!game || game.solved || paused) return;
  if (hint) { advanceHint(); return; }
  hint = getHint(game);
  if (!hint) return;
  hintStage = 0;
  game.hints++;
  saveGame();
  feedback('hint');
  renderHint();
  render();
}

function renderHint() {
  const card = $('#hint-card');
  card.hidden = !hint;
  if (!hint) return;
  const stage = hint.stages[hintStage];
  $('#hint-tech').textContent = hintStage === 0 ? '💡 Hint' : `💡 ${hint.technique}`;
  $('#hint-step').textContent = `stap ${hintStage + 1} van 3`;
  $('#hint-text').textContent = stage.text;
  const labels = hint.kind === 'mistake' ? ['Welk vakje?', 'Haal maar weg', 'Oké!']
    : hint.kind === 'notes' ? ['Welk vakje?', 'Zet maar terug', 'Oké!']
      : ['Meer uitleg', 'Vul maar in', 'Dankjewel!'];
  $('#hint-next').textContent = labels[hintStage];
  $('#hint-close').hidden = hintStage === 2;
}

function advanceHint() {
  if (!hint) return;
  if (hintStage < 2) {
    hintStage++;
    if (hintStage === 2) applyHintAction(hint.action);
    renderHint();
    render();
  } else closeHint();
}

function applyHintAction(a) {
  selected = a.cell;
  if (a.type === 'erase') game.erase(a.cell);
  else if (a.type === 'note') game.addNote(a.cell, a.digit);
  else if (a.type === 'place') {
    if (a.eliminations?.length) game.removeNotes(a.eliminations);
    game.setDigit(a.cell, a.digit, { autoNotes: settings.autoNotes });
    popCell = a.cell;
    feedback('place');
  }
  checkMarks.delete(a.cell);
  saveGame();
}

function closeHint(rerender = true) {
  if (!hint) return;
  hint = null;
  renderHint();
  if (rerender) render();
  if (game?.solved) onSolved();
}

$('#hint-next').addEventListener('click', advanceHint);
$('#hint-close').addEventListener('click', () => closeHint());

// ---------- Opgelost! ----------

function celebrate(special) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('#confetti');
  box.innerHTML = '';
  const set = special ? ['❤️', '💛', '💗', '💕'] : themeById(document.documentElement.dataset.theme).celebrate;
  for (let k = 0; k < 28; k++) {
    const s = document.createElement('span');
    s.textContent = set[k % set.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.setProperty('--s', `${18 + Math.random() * 22}px`);
    s.style.setProperty('--d', `${3.2 + Math.random() * 2.5}s`);
    s.style.setProperty('--delay', `${Math.random() * 1.4}s`);
    s.style.setProperty('--x', `${(Math.random() - 0.5) * 120}px`);
    s.style.setProperty('--r', `${(Math.random() - 0.5) * 90}deg`);
    box.append(s);
  }
  setTimeout(() => { box.innerHTML = ''; }, 7000);
}

let solvedHandled = null;
function onSolved() {
  if (!game || solvedHandled === game.id || hint) return;
  solvedHandled = game.id;
  const g = game;
  selected = null;
  render();
  store.clearGame();
  const day = dateKey(today());
  const { newBest } = store.recordSolve(stats, { levelId: g.levelId, elapsed: g.elapsed, hints: g.hints, daily: g.daily, special: g.special }, day);
  store.saveStats(stats);
  requestPersist();
  const fresh = M.newMilestones(stats, unlocked);
  unlocked = [...unlocked, ...fresh.map((m) => m.id)];
  store.saveUnlocked(unlocked);

  feedback('solved');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const board = $('#board');
  if (g.shape === 'heart') {
    // Het hart loopt vol (~1,2 s), klopt één keer, en dan pas het opgelost-scherm.
    board.classList.add('reveal');
    if (!reduce) {
      setTimeout(() => board.classList.add('heartbeat'), 1250);
      setTimeout(() => board.classList.remove('heartbeat'), 2000);
    }
  } else {
    board.classList.add('solved-glow');
    setTimeout(() => board.classList.remove('solved-glow'), 1500);
  }
  celebrate(Boolean(g.special));

  // Op id, niet op vandaag: na middernacht is het geen speciale dag meer.
  const special = g.special ? M.specialById(g.special) : null;
  let note;
  if (special) note = special.solvedText;
  else {
    const recent = store.loadRecentNotes();
    note = M.loveNote(recent);
    store.saveRecentNotes([...recent, note]);
  }
  const lvl = levelById(g.levelId);
  $('#solved-title').textContent = g.special ? 'Het is je gelukt!' : 'Opgelost!';
  document.querySelector('.solved-emoji').textContent = g.special ? '💛' : '🎉';
  $('#solved-stats').textContent = [
    g.special ? 'Speciale puzzel' : g.daily ? `Dagpuzzel · ${lvl.name}` : lvl.name,
    formatTime(g.elapsed),
    newBest && stats.levels[g.levelId].solved > 1 ? 'nieuw record! 🏅' : null,
    g.hints ? `${g.hints} ${g.hints === 1 ? 'hint' : 'hints'}` : 'zonder hints',
    !g.mistakes && settings.errors !== 'uit' ? 'zonder fouten ✨' : null,
  ].filter(Boolean).join(' · ');
  $('#solved-note').textContent = note;
  $('#solved-again').textContent = 'Nog eentje';
  $('#solved-again').dataset.level = g.special || g.daily ? 'koffie' : g.levelId;

  setTimeout(() => {
    const d = openDialog('solved-dialog');
    d.addEventListener('close', async () => {
      for (const m of fresh) {
        await showMessage({ icon: m.icon, title: `🔓 ${m.title}`, text: m.text, ok: 'Wat lief 💛' });
      }
      if (d.returnValue === 'again') startGame({ kind: 'level', levelId: $('#solved-again').dataset.level });
      else if (d.returnValue === 'home') goHome();
    }, { once: true });
  }, reduce ? 200 : g.shape === 'heart' ? 2050 : 1900);
}

$('#solved-again').addEventListener('click', () => $('#solved-dialog').close('again'));
$('#solved-home').addEventListener('click', () => $('#solved-dialog').close('home'));

// ---------- Menu ----------

$('#back-btn').addEventListener('click', goHome);
$('#pause-btn').addEventListener('click', pause);
$('#menu-btn').addEventListener('click', () => { if (game) { render(); openDialog('menu-dialog'); } });
$('#timer').addEventListener('click', () => {
  settings.showTimer = !settings.showTimer;
  store.saveSettings(settings);
  renderTimer();
});

$('#check-btn').addEventListener('click', () => {
  closeDialog('menu-dialog');
  checkMarks = new Set();
  for (let i = 0; i < 81; i++) if (!game.isGiven(i) && game.isWrong(i)) checkMarks.add(i);
  const n = checkMarks.size;
  if (!n) {
    toast(`Alles klopt tot nu toe${M.maybeNick(Math.random, 0.7)} 💛`);
    for (const el of $('#board').children) if (el.classList.contains('user')) el.classList.add('check-ok');
    setTimeout(() => { for (const el of $('#board').children) el.classList.remove('check-ok'); }, 1700);
  } else toast(n === 1 ? 'Eén vakje klopt nog niet helemaal' : `${n} vakjes kloppen nog niet helemaal`);
  render();
});

$('#fill-notes-btn').addEventListener('click', () => {
  closeDialog('menu-dialog');
  if (game.fillNotes().changed) toast('Alle notities staan erin ✏️');
  afterChange();
});

$('#reset-btn').addEventListener('click', async () => {
  closeDialog('menu-dialog');
  if (await confirmDialog('Opnieuw beginnen?', 'Al je ingevulde cijfers en notities worden gewist. De tijd loopt gewoon door.', 'Ja, wissen', 'Nee')) {
    game.reset();
    checkMarks = new Set();
    afterChange();
  }
});

// Knoppen die een andere dialoog openen of de huidige sluiten.
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) {
    const inDialog = opener.closest('dialog');
    if (inDialog) inDialog.close();
    const id = opener.dataset.open;
    if (id === 'settings-dialog') renderSettings();
    if (id === 'stats-dialog') renderStats();
    if (id === 'notes-dialog') renderMilestones();
    openDialog(id);
  }
  const closer = e.target.closest('[data-close]');
  if (closer) closer.closest('dialog').close();
});

// Tik op de achtergrond sluit een dialoog (behalve bevestigingen).
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (e) => {
    if (e.target === d && !['confirm-dialog', 'solved-dialog'].includes(d.id)) d.close();
  });
}

// ---------- Instellingen ----------

function renderSettings() {
  const opts = $('#theme-options');
  const choices = [...AUTO_CHOICES, ...THEMES.map((t) => ({ ...t, previews: [t.id] }))];
  opts.innerHTML = choices.map((t) => `<label class="theme-opt">
      <input type="radio" name="theme" value="${t.id}" ${settings.theme === t.id ? 'checked' : ''}>
      <span><i class="theme-preview" aria-hidden="true">${t.previews.map(themePreview).join('')}</i>${t.name}</span></label>`).join('');
  for (const r of document.querySelectorAll('input[name="errors"]')) r.checked = r.value === settings.errors;
  for (const name of ['autoNotes', 'highlightSame', 'showTimer', 'sound', 'haptics']) {
    document.querySelector(`input[name="${name}"]`).checked = Boolean(settings[name]);
  }
  $('#haptics-row').hidden = !hasHaptics;
  $('#install-setting').hidden = !canInstall();
}

$('#settings-dialog').addEventListener('change', (e) => {
  const { name, value, checked, type } = e.target;
  if (!name) return;
  settings[name] = type === 'checkbox' ? checked : value;
  store.saveSettings(settings);
  configureFeedback(settings);
  if (name === 'theme') applyTheme();
  if (name === 'errors') checkMarks = new Set();
  if (name === 'sound' && checked) feedback('place');
  renderTimer();
  render();
});

// ---------- Voortgang beschermen ----------

// Vraag de browser om onze opslag niet zomaar op te ruimen. De uitkomst maakt niet uit.
function requestPersist() {
  try { navigator.storage?.persist?.()?.catch?.(() => {}); } catch { /* niet ondersteund */ }
}

// Alles opnieuw inlezen, bijvoorbeeld na het terugzetten van een back-up.
function reloadState() {
  closeHint(false);
  settings = store.loadSettings();
  stats = store.loadStats();
  unlocked = store.loadUnlocked();
  game = Game.fromJSON(store.loadGame());
  selected = null;
  focusDigit = null;
  checkMarks = new Set();
  applyTheme();
  configureFeedback(settings);
  goHome();
}

async function saveBackup() {
  saveGame();
  const name = `rubys-sudoku-backup-${dateKey(new Date())}.json`;
  const file = new File([JSON.stringify(store.exportBackup(), null, 2)], name, { type: 'application/json' });
  // iPhone: via het deelmenu (bewaar in Bestanden, AirDrop, mail…). Elders: gewoon downloaden.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Back-up van Ruby's Sudoku" });
      closeDialog('settings-dialog');
      toast('Back-up bewaard 💛');
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // zelf geannuleerd
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  closeDialog('settings-dialog');
  toast('Back-up gedownload 💛');
}

async function restoreBackup(file) {
  closeDialog('settings-dialog');
  let parsed = null;
  try { parsed = JSON.parse(await file.text()); } catch { /* geen JSON */ }
  const res = store.validateBackup(parsed);
  if (!res.ok) {
    toast('Hmm, dat lijkt geen goede back-up. Er is niks veranderd 💛', 4000);
    return;
  }
  const created = new Date(parsed.created);
  const when = Number.isNaN(created.getTime()) ? '' : ` van ${created.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const n = res.data.stats.totalSolved;
  const ok = await confirmDialog('Back-up terugzetten?',
    `Deze back-up${when} heeft ${n} ${n === 1 ? 'opgeloste puzzel' : 'opgeloste puzzels'}. Wat er nu op dit toestel staat, wordt daardoor vervangen.`,
    'Ja, terugzetten', 'Nee');
  if (!ok) return;
  if (!store.importBackup(parsed).ok) { toast('Dat lukte niet. Er is niks veranderd 💛', 4000); return; }
  reloadState();
  requestPersist();
  toast('Je voortgang is terug 💛');
}

$('#backup-save').addEventListener('click', () => { saveBackup().catch(() => toast('Dat lukte even niet. Probeer je het nog eens?')); });
$('#backup-restore').addEventListener('click', () => { $('#backup-file').value = ''; $('#backup-file').click(); });
$('#backup-file').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) restoreBackup(file);
});

// ---------- Statistieken & berichtjes ----------

function renderStats() {
  const key = dateKey(today());
  const rows = LEVELS.map((l) => {
    const s = stats.levels[l.id] || {};
    const avg = s.solved ? formatTime(s.totalTime / s.solved) : '–';
    return `<tr><td><span aria-hidden="true">${l.emoji}</span> ${escapeHtml(l.name)}</td><td>${s.played || 0}</td><td>${s.solved || 0}</td>
      <td>${s.best ? formatTime(s.best) : '–'}</td><td>${avg}</td></tr>`;
  }).join('');
  $('#stats-body').innerHTML = `
    <div class="stat-grid">
      <div class="stat"><b>${stats.totalSolved}</b><span>opgelost</span></div>
      <div class="stat"><b>${store.currentStreak(stats, key)}</b><span>dagen op rij 🔥</span></div>
      <div class="stat"><b>${stats.bestStreak}</b><span>langste reeks</span></div>
      <div class="stat"><b>${stats.dailySolved}</b><span>dagpuzzels</span></div>
      <div class="stat"><b>${stats.noHintSolved}</b><span>zonder hints</span></div>
      <div class="stat"><b>${unlocked.length}/${M.MILESTONES.length}</b><span>berichtjes</span></div>
    </div>
    <table class="stat-table">
      <thead><tr><th>Niveau</th><th>Gespeeld</th><th>Opgelost</th><th>Record</th><th>Gem.</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderMilestones() {
  $('#notes-list').innerHTML = M.MILESTONES.map((m) => {
    const open = unlocked.includes(m.id);
    return open
      ? `<li><span class="n-icon" aria-hidden="true">${m.icon}</span><div><div class="n-title">${escapeHtml(m.title)}</div><p>${escapeHtml(m.text)}</p></div></li>`
      : `<li class="locked"><span class="n-icon" aria-hidden="true">🔒</span><div><div class="n-title">Nog geheim</div><p>${escapeHtml(m.hint)}</p></div></li>`;
  }).join('');
}

// ---------- Op het beginscherm zetten ----------

// Chrome/Android geeft een eigen installatievenster; Safari op iPhone niet,
// daar leggen we de stappen uit.
let installPrompt = null;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);
// Niet elke Android-browser stuurt beforeinstallprompt (of pas na een tijdje), dus daar tonen we het kaartje altijd.
const canInstall = () => !isStandalone() && Boolean(installPrompt || isIOS || isAndroid);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function renderInstall() {
  const slot = $('#install-slot');
  slot.innerHTML = '';
  if (!canInstall() || store.loadInstallSnooze() > Date.now()) return;
  const card = document.createElement('div');
  card.className = 'install-banner';
  card.innerHTML = `<button type="button" class="install-main">
      <img src="icons/icon-192.png" alt="">
      <span>Zet me op je beginscherm 📲</span>
    </button>
    <button type="button" class="install-later" aria-label="Later">${ICONS.close}</button>`;
  card.querySelector('.install-main').addEventListener('click', install);
  card.querySelector('.install-later').addEventListener('click', () => {
    store.saveInstallSnooze(Date.now() + 14 * 86400000);
    renderInstall();
  });
  slot.append(card);
}

async function install() {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    installPrompt = null;
    renderInstall();
  } else {
    const platform = isIOS ? 'ios' : 'android';
    for (const el of document.querySelectorAll('#install-dialog [data-platform]')) el.hidden = el.dataset.platform !== platform;
    openDialog('install-dialog');
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  renderInstall();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  renderInstall();
  toast('Gelukt! Je vindt me nu op je beginscherm 💛');
});
$('#install-setting').addEventListener('click', () => {
  closeDialog('settings-dialog');
  install();
});

// ---------- Nieuwe versie ----------

// Een nieuwe service worker wacht tot Ruby zelf op het kaartje tikt. Het kaartje
// staat alleen op het startscherm, dus tijdens een puzzel verversen we nooit.
let waitingWorker = null;
let updateRequested = false;

function renderUpdate() {
  const slot = $('#update-slot');
  slot.innerHTML = '';
  if (!waitingWorker) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card update';
  btn.innerHTML = `<span class="card-kicker">Nieuwe versie</span>
    <span class="card-title">Er is iets nieuws voor je 💛</span>
    <span class="card-meta">Tik om te verversen</span>`;
  btn.addEventListener('click', applyUpdate);
  slot.append(btn);
}

function applyUpdate() {
  saveGame();
  updateRequested = true;
  if (waitingWorker?.state === 'installed') waitingWorker.postMessage('skipWaiting');
  else location.reload(); // al actief (bijvoorbeeld via een ander venster)
}

function setWaiting(w) {
  if (!w || !navigator.serviceWorker.controller) return; // eerste installatie: niks te verversen
  waitingWorker = w;
  if (!$('#home').hidden) renderUpdate();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    setWaiting(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') setWaiting(reg.waiting || w); });
    });
    // Een app op het beginscherm wordt zelden echt opnieuw geladen; kijk dus ook bij terugkomen.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
}

// ---------- Opstarten ----------

$('#daily-card').addEventListener('click', () => {
  const key = dateKey(today());
  if (game && !game.solved && game.daily === key) { enterPlay(); return; }
  if (stats.dailyDone.includes(key)) {
    // Al opgelost: niet opnieuw starten, anders telt hij dubbel mee.
    const t = stats.dailyTimes[key];
    showMessage({
      icon: '✅',
      title: 'Dagpuzzel opgelost',
      text: `${t != null ? `Vandaag deed je er ${formatTime(t)} over. ` : 'Deze heb je vandaag al opgelost. '}Morgen staat er weer een nieuwe voor je klaar${M.maybeNick(Math.random, 0.7)} 💛`,
      ok: 'Fijn!',
    });
    return;
  }
  startGame({ kind: 'daily' });
});

applyTheme();
configureFeedback(settings);
try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* oudere browsers */ }
buildBoard();
renderHome();
showScreen('home');
if (stats.totalSolved > 0) requestPersist();

const idle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
idle(() => fillStash());

registerServiceWorker();
