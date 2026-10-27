// De interface: startscherm, bord, bediening, dialogen en het feestje.

import { Game } from './game.js';
import { LEVELS, levelById, dateKey, dailyLevelFor, SHAPES, SHAPE_CELLS, shapeColor } from './generator.js';
import { currentMatch, MATCHES } from './matches.js';
import { sleepActive, SLEEP_VOLUME } from './sleep.js';
import { wrapped, wrappedYearOn, wrappedYears } from './wrapped.js';
import { getHint, stageCells, hintsLeft, MAX_HINTS } from './hints.js';
import { PEERS, rowOf, colOf, bit } from './solver.js';
import * as store from './storage.js';
import * as M from './messages.js';
import { THEMES, THEME_GROUPS, SEASON_AUTO, themeById, resolveTheme, themeToday, dayKey, migrateThemeSetting, recordSeasonSolve, checkThemeUnlocks, unlockTheme, unlockHint, tapCounter, stringRun, PIE_TAPS, holdProgress, HOLD_MS, pawCatcher, midnightMinute } from './themes.js';
import { feedback, configure as configureFeedback, hasHaptics } from './feedback.js';
import { BOOK, TECHNIQUE_IDS, TECHNIQUE_TEXT, lockedHint, discoverFromHint, knownCount, unseen } from './boekje.js';
import { TECHNIQUES } from './techniques.js';

const $ = (sel) => document.querySelector(sel);

// ---------- Datum (met ?vandaag=JJJJ-MM-DD of JJJJ-MM-DDTUU:MM om te testen) ----------

const params = new URLSearchParams(location.search);
// Met alleen een datum loopt de klok gewoon mee; met een tijd erbij staat de tijd stil.
function today() {
  const o = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(params.get('vandaag') || '');
  const now = new Date();
  if (!o) return now;
  const [y, m, d] = o.slice(1, 4).map(Number);
  return o[4] ? new Date(y, m - 1, d, Number(o[4]), Number(o[5])) : new Date(y, m - 1, d, now.getHours(), now.getMinutes());
}

// Met een testdatum krijgt de app een eigen opslag, zodat Ruby's echte voortgang onaangeroerd blijft.
const testDate = params.has('vandaag');
if (testDate) store.useTestStorage();

// ---------- Status ----------

// Wat het toestel wil: donker, of extra contrast (bijvoorbeeld in fel zonlicht).
const device = () => ({ dark: matchMedia('(prefers-color-scheme: dark)').matches, contrast: matchMedia('(prefers-contrast: more)').matches });

// Instellingen, met het oude 'Automatisch'-thema omgezet naar wat ze nu ziet.
function loadSettings() {
  const s = store.loadSettings();
  const { dark, contrast } = device();
  const theme = migrateThemeSetting(s.theme, dark, contrast);
  if (theme !== s.theme) { s.theme = theme; store.saveSettings(s); }
  return s;
}

let settings = loadSettings();

// ---------- Slaapstand ----------

// Is de slaapstand nu actief? (automatisch van 23:00 tot 06:00, of altijd aan/uit)
const sleeping = () => sleepActive(settings.sleep, today());

// Geluid en trillen volgens de instellingen, het thema (in Gitaar klinkt de
// gitaar, tenzij het geluid uit staat; de instelling zelf blijft zoals hij is),
// de slaapstand (half volume, geen trillen) en de herstelpuzzel (Gitaar wordt even Zacht).
function applyFeedback() {
  const sleep = sleeping();
  let sound = settings.sound;
  if (sound !== 'uit' && shownTheme.theme === 'gitaar') sound = 'gitaar';
  if (recovery && sound === 'gitaar') sound = 'zacht';
  configureFeedback({ ...settings, sound, haptics: settings.haptics && !sleep }, { volume: sleep ? SLEEP_VOLUME : 1 });
}

// Zet de slaapstand aan of uit. De overgang (een filter in style.css) duurt
// zo'n 2 seconden en komt zonder melding, ook midden in een puzzel.
function applySleep() {
  const on = sleeping();
  if (on !== (document.documentElement.dataset.sleep === '1')) {
    if (on) document.documentElement.dataset.sleep = '1';
    else delete document.documentElement.dataset.sleep;
  }
  applyFeedback();
}
setInterval(() => {
  applySleep();
  // Om middernacht kan het dagthema wisselen (ook als de app openstaat).
  const t = currentTheme();
  if (t.theme !== shownTheme.theme || t.accent !== shownTheme.accent) applyTheme();
}, 30000);
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
  next: svg('<path d="M9 5l7 7-7 7"/>'),
  heart: '<svg viewBox="0 0 24 22" aria-hidden="true"><path fill="currentColor" d="M12 21.5C5.6 16.6 1 12.6 1 7.6A5.8 5.8 0 0 1 6.8 1.8c2.1 0 3.9 1.1 5.2 2.9 1.3-1.8 3.1-2.9 5.2-2.9A5.8 5.8 0 0 1 23 7.6c0 5-4.6 9-11 13.9z"/></svg>',
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
// Tekst als HTML met elk emoji in een eigen <span class="emo">, zodat een thema alleen de emoji
// kan aanpassen (zwart-wit in Krant en Krijtbord, groen in Game Boy).
const EMOJI = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\uFE0F?/gu;
const withEmoji = (s) => escapeHtml(s).replace(EMOJI, '<span class="emo">$&</span>');

let toastTimer = null;
function toast(text, ms = 2600) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

const announce = (text) => { $('#sr-status').textContent = text; };

// Lukt opslaan niet (volle of geblokkeerde opslag), dan zeggen we dat één keer,
// in plaats van stilletjes voortgang kwijt te raken.
let warnedNotSaved = false;
function saved(ok) {
  if (!ok && !warnedNotSaved) {
    warnedNotSaved = true;
    toast('Ik kan je voortgang nu even niet bewaren. Maak voor de zekerheid een back-up 💛', 6000);
  }
  return ok;
}

function saveGame() {
  if (game && !game.solved) saved(store.saveGame(game.toJSON()));
}

// Fouten onthouden we (de laatste 20); ze gaan mee in een back-up, zodat je kunt zien wat er misging.
window.addEventListener('error', (e) => store.logError(e.message || 'fout'));
window.addEventListener('unhandledrejection', (e) => store.logError(e.reason?.stack || e.reason || 'promise'));

// ---------- Thema ----------

// Een mini-voorproefje in de kleuren van het thema (achtergrond, accent en een cijfer).
function themePreview(id) {
  const { bg, surface, accent, digit } = themeById(id).swatch;
  return `<span class="tp" style="--tp-bg:${bg};--tp-surface:${surface};--tp-accent:${accent};--tp-digit:${digit}"><b>7</b><em></em></span>`;
}
// Briefje: zijn handschrift ook in het logo, de hartjes en "Goed zo!" (hand/*.svg, zie style.css).
const handwritten = () => document.documentElement.dataset.theme === 'briefje';
// Cijfers als plaatje: in Briefje en Krijtbord staat wat Ruby zelf invult er
// met de hand (de gegeven cijfers blijven strak), in Game Boy zijn alle cijfers
// pixels en in Sporthal ledcijfers van een scorebord.
const GLYPHS = { gameboy: 'pixel', sporthal: 'led', briefje: 'hand', krijtbord: 'hand' };
const glyphs = () => GLYPHS[document.documentElement.dataset.theme] || null;
// Alle cijfers als plaatje (niet alleen wat zij invult)?
const allGlyphs = (glyph) => glyph === 'pixel' || glyph === 'led';

// Het thema van nu: op een dagthema-dag kiest de app (zie themeForDay in
// themes.js), anders haar eigen keuze. settings.theme verandert daarbij nooit.
// Met ?dagthema=uit (om te testen, bijv. voor screenshots per thema) geldt altijd haar eigen keuze.
const dayThemesOff = params.get('dagthema') === 'uit';
function currentTheme(now = today()) {
  if (dayThemesOff) return { theme: resolveTheme(settings.theme, now, stats.unlockedThemes, device()), accent: null, own: true };
  return themeToday(settings.theme, now, { unlocked: stats.unlockedThemes, unlockDates: stats.themeUnlockDates, matches: MATCHES, specials: M.specialKindsOn(now) });
}
let shownTheme = currentTheme();

function applyTheme() {
  const now = today();
  shownTheme = currentTheme(now);
  const { theme: t, accent } = shownTheme;
  const html = document.documentElement;
  html.dataset.theme = t;
  // Op een wedstrijddag die ook een andere bijzondere dag is: Volleybal met de accentkleuren van die dag.
  if (accent) html.dataset.accent = accent;
  else delete html.dataset.accent;
  delete html.dataset.themePending;
  store.saveThemeToday(dayKey(now), t, accent);
  // Licht of donker: de kleuren van de figuurpuzzels (zie .board[data-color]) volgen dat.
  document.documentElement.dataset.scheme = themeById(t).scheme;
  updateThemeColor();
  loadFx(themeById(t).fx || null);
  applyFeedback();
}

// De kleur van de balken boven en onder het scherm.
function updateThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]').setAttribute('content', bg || '#fff8e7');
}

// ---------- Thema-effecten (js/fx/*.js) ----------

// Een thema met iets bijzonders (de klok van Dagverloop, de zonnebloem, het
// latte-hartje, de kubus, het 8-bit-deuntje) heeft een eigen module, die pas
// geladen wordt als dat thema te zien is. Een module kan hebben:
//   start(ctx) / stop()   thema aan of uit
//   home(ctx)             het startscherm is (opnieuw) getekend
//   solved(ctx)           puzzel opgelost; geeft { sound: true } als hij zelf geluid maakte
//   placed(ctx, { cell, digit })  ze heeft net een cijfer gezet (alleen voor de show)
let fx = null, fxName = null;
const fxCtx = {
  now: () => today(),
  stats: () => stats,
  toast: (text, ms) => toast(text, ms),
  get board() { return $('#board'); },
  get reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; },
  // Regenachtige dag: zachte regen als ze die aan heeft gezet en het geluid niet uit staat.
  rainWanted: () => settings.rainSound && settings.sound !== 'uit',
  // Een geheim thema is gevonden (de bal in Volleybal, de kokosnoot in Gran Canaria…).
  secret: (id) => unlockSecret(id),
  // Dagverloop heeft nieuwe kleuren gezet.
  changed({ scheme, vars }) {
    store.saveThemeToday(dayKey(today()), shownTheme.theme, shownTheme.accent, { vars, scheme });
    updateThemeColor();
  },
};

function loadFx(name) {
  if (name === fxName) { fx?.start?.(fxCtx); return; }
  fx?.stop?.();
  fx = null;
  fxName = name;
  if (!name) return;
  import(`./fx/${name}.js`).then((m) => {
    if (fxName !== name) return; // intussen een ander thema
    fx = m;
    m.start?.(fxCtx);
    if (!$('#home').hidden) m.home?.(fxCtx);
  }).catch((e) => store.logError(`fx ${name}: ${e.message}`));
}

// ---------- Puzzels ophalen (Web Worker, met vangnet op de hoofdthread) ----------

// Twee workers: 'nu' voor een puzzel waar Ruby op wacht, en 'voorraad' die op
// de achtergrond rustig (met veel tijd) de volgende puzzels klaarzet. Zo hoeft
// een tik nooit te wachten op het vullen van de voorraad.
const workers = {};
let reqId = 0;
const pending = new Map();

function getWorker(lane) {
  if (lane in workers) return workers[lane];
  let w = null;
  try {
    w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    w.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      clearTimeout(p.timer);
      if (data.error) p.reject(new Error(data.error)); else p.resolve(data.puzzle);
    };
    w.onerror = () => {
      workers[lane] = null;
      for (const [id, p] of pending) if (p.lane === lane) { clearTimeout(p.timer); p.reject(new Error('worker')); pending.delete(id); }
    };
  } catch {
    w = null;
  }
  workers[lane] = w;
  return w;
}

async function generateHere(kind, args) {
  const g = await import('./generator.js');
  if (kind === 'daily') return g.generateDaily(new Date(args.date));
  if (kind === 'shape') return g.generateShape(args.name, args.seed);
  if (kind === 'match') return g.generateMatchPuzzle(args.date, args.kind);
  return g.generate(args);
}

// Zonder `background` rekenen we bij problemen met de worker zelf verder (Ruby wacht);
// op de achtergrond niet, want dat zou de app laten haperen.
function requestPuzzle(kind, args, { background = false } = {}) {
  const lane = background ? 'voorraad' : 'nu';
  const w = getWorker(lane);
  if (!w) return background ? Promise.reject(new Error('geen worker')) : generateHere(kind, args);
  const job = new Promise((resolve, reject) => {
    const id = ++reqId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, background ? 60000 : 8000);
    pending.set(id, { resolve, reject, timer, lane });
    w.postMessage({ id, kind, args });
  });
  return background ? job : job.catch(() => generateHere(kind, args));
}

// Per niveau ligt er alvast een puzzel klaar, zodat starten meteen gaat. Die
// maken we op de achtergrond met ruim de tijd (5 s), zodat ook een trage iPhone
// een verse puzzel vindt in plaats van er een uit de voorraad (bank.js) te pakken.
let stashBusy = false;
async function fillStash() {
  if (stashBusy) return;
  stashBusy = true;
  try {
    for (const l of LEVELS) {
      if (store.loadStash()[l.id]) continue;
      const p = await requestPuzzle('level', { levelId: l.id, timeBudget: 5000 }, { background: true });
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

function confirmDialog(title, text, yes = 'Ja', no = 'Nee', icon = '') {
  $('#confirm-icon').hidden = !icon;
  $('#confirm-icon').textContent = icon;
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

const BRAND_HTML = $('.brand').innerHTML;

// Wat het startscherm het laatst liet zien (dag en dagdeel); zie 'visibilitychange'.
let homeMoment = '';
const momentOf = (date) => `${dateKey(date)} ${M.partOfDay(date)} ${currentMatch(date)?.phase ?? ''}`;

function renderHome() {
  const now = today();
  homeMoment = momentOf(now);
  // In Briefje staan de naam van de app en het hartje er in zijn handschrift.
  const hand = handwritten();
  $('.brand').innerHTML = hand
    ? '<span class="hand-art hart-1 brand-heart" aria-hidden="true"></span><span class="hand-art logo" role="img" aria-label="Ruby\'s Sudoku"></span>'
    : BRAND_HTML;
  // Het emoji aan het laatste woord vast, zodat het nooit in zijn eentje op een nieuwe regel staat.
  // In de begroeting met de preitaart is de 🥧 een knopje (het geheime thema Preitaart).
  const hello = params.get('begroeting') === 'preitaart' ? M.pieGreeting() : M.greeting(now);
  $('#greeting').innerHTML = withEmoji(hello.replace(/ (\S+)$/, '\u00a0$1'))
    .replace(/<span class="emo">🥧<\/span>$/, '<button type="button" class="emo pie-tap" aria-label="Preitaart">🥧</button>');
  $('#subtitle').textContent = M.subtitle(now);
  const days = M.daysTogether(now);
  const heart = hand ? '<span class="hand-art hart-2 together-heart" role="img" aria-label="hartje"></span>' : '<span class="emo">💛</span>';
  $('#together').innerHTML = days > 0 ? `Al ${days} ${days === 1 ? 'dag' : 'dagen'} samen ${heart}` : '';

  // Speciale dag
  const special = M.specialDay(now, stats);
  const specialSlot = $('#special-slot');
  specialSlot.innerHTML = '';
  if (special && !special.shape) {
    // Zonder puzzel (de maandversary): alleen een klein, lief kaartje.
    const card = document.createElement('div');
    card.className = 'card special small';
    card.setAttribute('aria-label', special.title);
    card.innerHTML = `<span class="card-kicker">Maandversary 💛</span><span class="card-meta">${escapeHtml(special.text)}</span>`;
    specialSlot.append(card);
  } else if (special) {
    const done = stats.specialDone.includes(special.id);
    // Al aan begonnen? Dan gaat ze gewoon verder, zonder dat het hart vervangen wordt.
    const busy = !done && game && !game.solved && game.special === special.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card special';
    btn.innerHTML = `<span class="card-kicker">Speciaal voor vandaag</span>
      <span class="card-title">${escapeHtml(special.title)}</span>
      <span class="card-meta">${done ? 'Opgelost 💛 Tik om je berichtje nog eens te lezen' : busy ? 'Verder 💛' : 'Een puzzel met een verrassing'}</span>`;
    btn.addEventListener('click', async () => {
      if (game && !game.solved && game.special === special.id) { enterPlay(); return; }
      if (done) { showMessage({ icon: '💌', title: special.title, text: special.solvedText }); return; }
      await showMessage({ icon: special.icon, title: special.title, text: special.text, ok: 'Laat maar zien!' });
      startGame({ kind: 'shape', special });
    });
    specialSlot.append(btn);
  }

  renderWrappedCard(now);

  // Verder spelen
  const cont = $('#continue-slot');
  cont.innerHTML = '';
  // De dagpuzzel zelf heeft al een "Verder"-knop in z'n eigen kaart.
  // Net zo voor de speciale puzzel van vandaag.
  const matchNow = currentMatch(now);
  if (game && !game.solved && game.daily !== dateKey(now) && !(special && game.special === special.id) && !(matchNow && game.match === matchNow.match.date)) {
    const lvl = levelById(game.levelId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card continue';
    const what = game.special ? 'Speciale puzzel' : game.daily ? 'Dagpuzzel' : `${lvl.emoji} ${lvl.name}`; // ook Warming-up of Herstelpuzzel
    btn.innerHTML = `<span class="card-kicker">Verder puzzelen</span>
      <span class="card-title">${withEmoji(what)}</span>
      <span class="card-meta">${settings.showTimer ? formatTime(game.elapsed) + ' · ' : ''}${game.values.filter(Boolean).length} van 81 vakjes</span>`;
    btn.addEventListener('click', () => enterPlay());
    cont.append(btn);
  }

  renderMatch(matchNow, special);
  renderInstall();
  renderUpdate();
  fx?.home?.(fxCtx);

  // Dagpuzzel
  const key = dateKey(now);
  const dl = levelById(dailyLevelFor(now));
  const doneToday = stats.dailyDone.includes(key);
  const doneTime = stats.dailyTimes[key];
  const busy = game && !game.solved && game.daily === key;
  const streak = store.currentStreak(stats, key);
  $('#daily-title').textContent = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#daily-meta').innerHTML = withEmoji(`${dl.emoji} ${dl.name}`);
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
  badge.textContent = M.milestoneBadge(next);
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

// ---------- Wedstrijddag ----------

// Het kaartje op het startscherm. Zonder wedstrijd blijft het leeg en ziet
// het startscherm er precies zo uit als altijd.
function renderMatch(now, special = null) {
  const slot = $('#match-slot');
  slot.innerHTML = '';
  if (!now) return;
  const { match, phase } = now;
  const info = stats.matches[match.date] || {};
  const card = document.createElement('div');
  card.className = 'card match';
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', 'Wedstrijddag');
  const busy = (kind) => game && !game.solved && game.match === match.date && game.matchKind === kind;
  const button = (label, cls, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${cls}`;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };
  const play = (kind) => () => {
    if (busy(kind)) enterPlay();
    else startGame({ kind: 'match', match: { date: match.date, kind } });
  };
  let text = '';
  const actions = document.createElement('div');
  actions.className = 'match-actions';

  if (phase === 'voor') {
    // Elke wedstrijd z'n eigen peptalk, en niet dezelfde als de vorige keren.
    if (info.pep == null) {
      store.setMatchPeptalk(stats, match.date, M.pickPeptalk(match, store.recentPeptalks(stats)));
      saved(store.saveStats(stats));
    }
    text = M.peptalkText(stats.matches[match.date].pep, match);
    // Op de laatste thuiswedstrijd is de speciale puzzel (de volleybal) de warming-up.
    if (special?.replacesWarmup) text += `\n${M.WARMUP_BY_SPECIAL}`;
    else if (info.warmup) text += `\n${M.WARMUP_DONE}`;
    else actions.append(button(busy('warmup') ? 'Verder met de warming-up' : 'Warming-up 🧠', 'primary', play('warmup')));
  } else if (phase === 'tijdens') {
    text = M.duringLine(match);
  } else if (!info.uitslag) {
    text = M.HOW_DID_IT_GO;
    actions.classList.add('match-outcomes');
    for (const { id, label } of M.OUTCOME_BUTTONS) {
      actions.append(button(label, 'ghost', () => {
        store.setMatchOutcome(stats, match.date, id);
        saved(store.saveStats(stats));
        renderHome();
        $('#match-slot .btn.primary')?.focus();
      }));
    }
  } else {
    text = M.outcomeReply(info.uitslag, match.date);
    if (info.herstel) text += `\n${M.RECOVERY_DONE}`;
    else actions.append(button(busy('herstel') ? 'Verder met de herstelpuzzel' : 'Herstelpuzzel 🛋️', 'primary', play('herstel')));
  }

  card.innerHTML = `<span class="card-kicker">Wedstrijddag</span>
    <span class="card-title">${escapeHtml(M.matchHeadline(match, phase))}</span>
    ${text.split('\n').map((t) => `<p class="match-text">${escapeHtml(t)}</p>`).join('')}`;
  if (actions.children.length) card.append(actions);
  slot.append(card);
}

function showScreen(name) {
  $('#home').hidden = name !== 'home';
  $('#play').hidden = name !== 'play';
  window.scrollTo(0, 0);
}

function goHome() {
  applyFeedback();
  closeHint();
  stopTimer();
  saveGame();
  renderHome();
  showScreen('home');
}

// ---------- Spel starten ----------

let starting = false;
async function startGame({ kind, levelId, special, match }) {
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
    else if (kind === 'shape') p = await requestPuzzle('shape', { name: special.shape, seed: special.seed });
    else if (kind === 'match') p = await requestPuzzle('match', match);
    else p = await takePuzzle(levelId);
    game = new Game({
      givens: p.givens, solution: p.solution, levelId: p.levelId,
      daily: p.daily || null, special: special?.id || null, shape: p.shape || null,
      match: p.match || null, matchKind: p.matchKind || null,
    });
    store.recordStart(stats, game.levelId);
    saved(store.saveStats(stats));
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
  $('#play-title').innerHTML = withEmoji(game.special ? `Speciaal voor jou ${M.specialById(game.special)?.icon || '❤️'}` : game.daily ? `Dagpuzzel · ${lvl.name}` : `${lvl.emoji} ${lvl.name}`);
  // Herstelpuzzel: rustig aan. Timer standaard verborgen, en alleen zachte geluiden.
  recovery = game.matchKind === 'herstel';
  timerShownInRecovery = false;
  applyFeedback();
  // Na een slaapberichtje mocht het scherm uit; bij een nieuwe puzzel weer niet.
  wakeLockBlocked = false;
  keepAwake();
  notesMode = false;
  hint = null;
  paused = false;
  $('#board').classList.remove('reveal', 'heartbeat', 'pulse');
  $('#board').dataset.color = game.shape && SHAPE_CELLS[game.shape] ? shapeColor(game.shape) : '';
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
    b.dataset.b = Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3); // het blok (RubyxCube kleurt per blok)
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
    b.innerHTML = `${icon}<span>${label}${id === 'notes' ? ' <span class="tool-state">uit</span>' : ''}</span>${id === 'hint' ? `<b class="tool-count" aria-hidden="true">${MAX_HINTS}</b>` : ''}`;
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
    b.innerHTML = `<span class="nd d${d}">${d}</span><small></small>`;
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
  const glyph = glyphs();
  const shape = game.shape ? SHAPE_CELLS[game.shape] : null;

  const cells = $('#board').children;
  for (let i = 0; i < 81; i++) {
    const v = game.values[i];
    const given = game.isGiven(i);
    const wrong = !given && v && (showWrong ? game.isWrong(i) : checkMarks.has(i));
    const cls = ['cell'];
    // Met de hand alleen wat zij invult; pixels en ledcijfers voor alle cijfers.
    const g = v && (allGlyphs(glyph) || (glyph === 'hand' && !given)) ? glyph : null;
    if (v) cls.push(given ? 'given' : 'user', ...(g ? [g] : []));
    // Een figuur met accenten (pijl, lint, naden…) tekent die in de donkerdere tint; anders de omtrek.
    if (shape?.mask[i]) {
      cls.push('in-shape', ...(given ? ['shape-given'] : []));
      if (shape.hasAccent ? shape.accent[i] : shape.outline[i]) cls.push(shape.hasAccent ? 'shape-accent' : 'shape-edge');
    }
    if (peerSet?.has(i)) cls.push('peer');
    if (hlDigit && v === hlDigit) cls.push('same');
    if (i === selected && !stage) cls.push('selected');
    if (wrong) cls.push('wrong');
    if (region?.has(i)) cls.push('hint-region');
    if (focus?.has(i)) cls.push('hint-focus');
    if (i === popCell) cls.push('pop');

    let html = '';
    if (v) html = g === 'hand' ? `<span class="v hand d${v}"></span>` : g ? `<span class="v ${g} d${v}">${v}</span>` : `<span class="v">${v}</span>`;
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
  // Hooguit 3 hints per puzzel: de knop telt af. Zijn ze op, dan wordt hij dof (maar een
  // tik geeft nog een lief berichtje, en een hint die open staat kan ze gewoon afmaken).
  const hb = $('#tool-hint'), hintsToGo = hintsLeft(game);
  hb.disabled = game.solved;
  hb.querySelector('.tool-count').textContent = hintsToGo;
  hb.classList.toggle('used-up', !hintsToGo && !hint);
  hb.setAttribute('aria-label', hintsToGo ? `Hint, nog ${hintsToGo} over` : 'Hint, op voor deze puzzel');
  const nb = $('#tool-notes');
  nb.setAttribute('aria-pressed', String(notesMode));
  nb.querySelector('.tool-state').textContent = notesMode ? 'aan' : 'uit';
  // In 'direct' ziet ze fouten al meteen; anders kan ze altijd zelf laten controleren.
  $('#check-btn').hidden = settings.errors === 'direct';
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
    // Geen vakje gekozen: in Gitaar klinkt dan de snaar van dit cijfer (zie playString).
    if (selected == null || game.isGiven(selected)) playString(d);
    // Geen bewerkbaar vakje: dan markeren we gewoon dit cijfer op het bord.
    focusDigit = focusDigit === d ? null : d;
    if (selected != null && game.isGiven(selected)) selected = null;
    render();
    return;
  }
  if (notesMode || note) {
    if (game.toggleNote(selected, d).changed) feedback('note', { digit: d });
    checkMarks.delete(selected);
    afterChange();
    return;
  }
  // Een fout telt alleen mee als ze hem te zien krijgt (direct, of later bij een controle of hint).
  const r = game.setDigit(selected, d, { autoNotes: settings.autoNotes, countMistake: settings.errors === 'direct' });
  if (!r.changed) return;
  checkMarks.delete(selected);
  if (r.removed) feedback('erase');
  else {
    popCell = selected;
    if (r.wrong && settings.errors === 'direct') { feedback('wrong', { digit: d }); announce('Dit cijfer klopt niet'); }
    else if (game.counts()[d] === 9 && !r.solved) feedback('done', { digit: d });
    else feedback('place', { digit: d });
  }
  afterChange();
  // Het thema kan iets doen met een net gezet cijfer (Vertrekhal laat het doorratelen).
  if (!r.removed) fx?.placed?.(fxCtx, { cell: selected, digit: d });
  if (r.solved) onSolved();
  else if (!r.removed && game.isFull()) almostThere();
}

// Gitaar: op het cijferpad tikken zonder gekozen vakje laat de snaar van dat cijfer
// klinken (er verandert niets aan de puzzel). Zes oplopende tonen achter elkaar, elk
// binnen 2 seconden, en het vuurtje gaat aan: het geheime thema Kampvuur.
const strings = stringRun();
function playString(d) {
  if (shownTheme.theme !== 'gitaar') return;
  feedback('place', { digit: d });
  if (strings(d, performance.now()) && !(stats.unlockedThemes || []).includes('kampvuur')) {
    feedback('chord');
    unlockSecret('kampvuur');
  }
}

// Alles staat vol, maar er klopt nog iets niet: dat zeggen we zacht, in elke
// foutcontrole-stand. Anders zit ze naar een vol bord te kijken zonder feestje.
function almostThere() {
  const how = settings.errors === 'direct'
    ? 'Kijk nog even naar de rode cijfers'
    : 'Tik op ⋯ en kies Controleer mijn puzzel, of vraag een hint';
  toast(`Bijna! Alles staat vol, maar er klopt nog iets niet. ${how} 💛`, 6000);
  announce('Alles staat vol, maar er klopt nog iets niet.');
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
  if (ch) { selected = ch[0].cell; feedback('place', { digit: ch[0].to.v }); }
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

// In de herstelpuzzel is de tijd verborgen tot ze er zelf op tikt (alleen voor die puzzel).
let recovery = false;
let timerShownInRecovery = false;
const timerShown = () => (recovery ? timerShownInRecovery : settings.showTimer);

function renderTimer() {
  const t = $('#timer');
  if (!game) return;
  t.textContent = timerShown() ? formatTime(game.elapsed) : '⏱ ••:••';
  t.setAttribute('aria-label', timerShown() ? `Tijd ${formatTime(game.elapsed)}, tik om te verbergen` : 'Tijd verborgen, tik om te tonen');
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
  // Een app op het beginscherm blijft vaak dagen open. Is het intussen een
  // nieuwe dag (of een ander dagdeel), dan het startscherm opnieuw tekenen.
  else if (!$('#home').hidden && momentOf(today()) !== homeMoment) { applyTheme(); renderHome(); checkOpeningUnlocks(); }
});
window.addEventListener('pagehide', saveGame);

// ---------- Slimme hints ----------

function showHint() {
  if (!game || game.solved || paused) return;
  if (hint) { advanceHint(); return; }
  if (!hintsLeft(game)) { toast(M.HINTS_UP_LINES[Math.floor(Math.random() * M.HINTS_UP_LINES.length)], 3200); return; }
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
  // De kaart groeit vanaf het gereedschap naar beneden, tot de onderkant van het scherm.
  const controls = $('.controls').getBoundingClientRect();
  card.style.setProperty('--hint-max', `${Math.max(controls.height, window.innerHeight - controls.top - 8)}px`);
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
    // Stap 2 laat de techniek zien: dan staat hij in het Techniekenboekje (ook als ze de puzzel niet afmaakt).
    if (discoverFromHint(stats, hint, hintStage, dateKey(today()))) {
      saved(store.saveStats(stats));
      renderBookDot();
    }
    if (hintStage === 2) applyHintAction(hint.action);
    renderHint();
    render();
  } else closeHint();
}

function applyHintAction(a) {
  selected = a.cell;
  if (a.type === 'erase') {
    game.erase(a.cell);
    // Zonder directe foutcontrole is dit het moment dat ze de fout te zien krijgt.
    if (settings.errors !== 'direct') game.mistakes++;
  }
  else if (a.type === 'note') game.addNote(a.cell, a.digit);
  else if (a.type === 'place') {
    if (a.eliminations?.length) game.removeNotes(a.eliminations);
    game.setDigit(a.cell, a.digit, { autoNotes: settings.autoNotes });
    popCell = a.cell;
    feedback('place', { digit: a.digit });
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

// Op een gecombineerd dagthema (wedstrijd + een andere bijzondere dag) de
// feest-emoji's van die andere dag of dat andere thema.
function dayCelebrate() {
  if (!shownTheme.accent) return null;
  return M.specialDay(today())?.celebrate || themeById(shownTheme.accent).celebrate;
}

// `special`: de feest-emoji's van een speciale dag (of null).
// `jersey`: de 33e puzzel in Volleybal, dan dwarrelen er ballen en haar rugnummer.
// `handHearts`: in Briefje zijn getekende hartjes (niet bij een speciale dag zonder hart).
function celebrate(special, jersey = false, handHearts = true) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('#confetti');
  box.innerHTML = '';
  const set = special || (jersey ? ['🏐', '33'] : dayCelebrate() || themeById(document.documentElement.dataset.theme).celebrate);
  const hand = handwritten() && handHearts;
  // In de slaapstand rustiger: minder deeltjes, en langzamer.
  const calm = sleeping();
  // Wandeltijd: de pootjes 🐾 zijn te vangen. Ze dwarrelen als knopjes in het
  // opgelost-scherm zelf (daarbuiten is alles even niet aan te tikken), onder de knoppen.
  const paws = document.createElement('div');
  paws.className = 'paw-layer';
  const catchPaw = pawCatcher();
  for (let k = 0; k < (calm ? 10 : 28); k++) {
    if (!hand && set[k % set.length] === '🐾') { paws.append(pawButton(k, catchPaw, calm)); continue; }
    const s = document.createElement('span');
    // Briefje: zijn twee getekende hartjes, om en om in rood en balpenblauw.
    if (hand) {
      s.className = `hand-art hart-${(k % 2) + 1}`;
      s.style.color = k % 4 < 2 ? 'var(--heart)' : 'var(--user)';
    } else {
      s.textContent = set[k % set.length];
      if (s.textContent === '33') s.className = 'jersey-33';
    }
    s.style.left = `${Math.random() * 100}%`;
    s.style.setProperty('--s', `${18 + Math.random() * 22}px`);
    s.style.setProperty('--d', `${(3.2 + Math.random() * 2.5) * (calm ? 1.6 : 1)}s`);
    s.style.setProperty('--delay', `${Math.random() * 1.4}s`);
    s.style.setProperty('--x', `${(Math.random() - 0.5) * 120}px`);
    s.style.setProperty('--r', `${(Math.random() - 0.5) * 90}deg`);
    box.append(s);
  }
  $('#solved-dialog .paw-layer')?.remove();
  if (paws.children.length) $('#solved-dialog').append(paws);
  setTimeout(() => { box.innerHTML = ''; }, 7000);
}

// Een pootje uit de confetti als knopje. Gevangen: hij springt even op (en telt mee).
function pawButton(k, catchPaw, calm) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'paw-catch';
  b.textContent = '🐾';
  b.setAttribute('aria-label', 'Een pootje');
  b.style.left = `${4 + Math.random() * 84}%`;
  b.style.setProperty('--s', `${24 + Math.random() * 14}px`);
  // Iets trager dan de rest, zodat ze te vangen zijn; pas als het opgelost-scherm er staat.
  b.style.setProperty('--d', `${(4.6 + Math.random() * 2.4) * (calm ? 1.6 : 1)}s`);
  b.style.setProperty('--delay', `${0.3 + Math.random() * 2.2}s`);
  b.style.setProperty('--x', `${(Math.random() - 0.5) * 100}px`);
  b.addEventListener('click', () => {
    if (b.classList.contains('gevangen')) return;
    const at = getComputedStyle(b).transform;
    b.style.setProperty('--at', at === 'none' ? 'translate(0, 0)' : at);
    b.classList.add('gevangen');
    if (catchPaw(k).done) unlockSecret('wandeltijd');
  });
  return b;
}

let solvedHandled = null;
function onSolved() {
  if (!game || solvedHandled === game.id || hint) return;
  solvedHandled = game.id;
  const g = game;
  selected = null;
  render();
  const day = dateKey(today());
  const started = dateKey(new Date(g.startedAt));
  const match = g.match ? { date: g.match, kind: g.matchKind } : null;
  const { previousBest, firstOnLevel, counted } = store.recordSolve(stats, { levelId: g.levelId, elapsed: g.elapsed, hints: g.hints, daily: g.daily, special: g.special, started, match, hour: today().getHours() }, day);
  // Seizoensthema's: elke meegetelde puzzel telt voor het seizoen van vandaag.
  if (counted) recordSeasonSolve(stats, today());
  // Komt er een thema vrij (seizoen, aantal puzzels, reeks, Ruby-modus, vóór tienen…)?
  const freshThemes = checkThemeUnlocks(stats, today());
  // Het geheime thema Middernacht: opgelost terwijl de klok tussen 00:00 en 00:01 staat.
  if (midnightMinute(today()) && unlockTheme(stats, 'middernacht', today())) freshThemes.push('middernacht');
  // Vrijgespeeld seizoen: vandaag meteen dat seizoen (een dagthema, zie themeForDay).
  if (freshThemes.length) applyTheme();
  // Pas de puzzel opruimen als de statistieken echt bewaard zijn; anders staat
  // hij er na een herstart nog en telt hij alsnog mee.
  if (saved(store.saveStats(stats))) store.clearGame();
  requestPersist();
  const fresh = M.newMilestones(stats, unlocked);
  unlocked = [...unlocked, ...fresh.map((m) => m.id)];
  store.saveUnlocked(unlocked);

  // Het thema kan iets eigens doen (latte-hartje, kubus, 8-bit-deuntje).
  const own = fx?.solved?.(fxCtx);
  feedback('solved', { sound: !own?.sound });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const board = $('#board');
  if (g.shape && SHAPE_CELLS[g.shape]) {
    // De figuur loopt vol (~1,2 s), een hart klopt één keer (andere figuren
    // pulseren zacht), en dan pas het opgelost-scherm.
    const beat = SHAPES[g.shape].color === 'heart' ? 'heartbeat' : 'pulse';
    board.classList.add('reveal');
    if (!reduce) {
      setTimeout(() => board.classList.add(beat), 1250);
      setTimeout(() => board.classList.remove(beat), 2000);
    }
  } else {
    board.classList.add('solved-glow');
    setTimeout(() => board.classList.remove('solved-glow'), 1500);
  }
  // Rugnummer 33 net vrij in Volleybal: een eigen feestje (een speciale puzzel gaat voor).
  // Ook een wedstrijdpuzzel krijgt in Volleybal ballen en een 33 (zonder de mijlpaal zelf).
  const volleybal = document.documentElement.dataset.theme === 'volleybal';
  const jersey = !g.special && volleybal && (fresh.some((m) => m.id === 'rugnummer33') || Boolean(g.matchKind));
  // Op id, niet op vandaag: na middernacht is het geen speciale dag meer.
  const special = g.special ? M.specialById(g.special, stats) : null;
  // Slaapstand: een slaapberichtje, geen "nog eentje"-knop (wel een klein linkje),
  // en het scherm mag weer uit.
  const asleep = sleeping();
  $('#solved-again').hidden = asleep;
  $('#solved-again-small').hidden = !asleep;
  if (asleep) letScreenSleep();
  celebrate(special?.celebrate || null, jersey, !special || shapeColor(special.shape) === 'heart');

  let note;
  if (special) note = special.solvedText;
  else if (g.matchKind === 'warmup') note = M.warmupNote();
  else if (g.matchKind === 'herstel') note = M.recoveryNote(stats.matches[g.match]?.uitslag);
  else if (asleep) note = M.sleepNote();
  else {
    const recent = store.loadRecentNotes();
    note = M.loveNote(recent);
    store.saveRecentNotes([...recent, note]);
  }
  const lvl = levelById(g.levelId);
  // Briefje: een getekend hartje, "Goed zo!" in zijn handschrift en één keer per dag een krabbeltje.
  const hand = handwritten();
  if (hand && !g.special) $('#solved-title').innerHTML = '<span class="hand-art goed-zo" role="img" aria-label="Goed zo!"></span>';
  else $('#solved-title').textContent = g.special ? 'Het is je gelukt!' : 'Opgelost!';
  if (hand) document.querySelector('.solved-emoji').innerHTML = '<span class="hand-art hart-2 solved-heart"></span>';
  else document.querySelector('.solved-emoji').textContent = special ? special.icon : jersey ? '🏐' : '🎉';
  const scribble = hand && store.scribbleDue(store.loadScribbleDay(), day);
  if (scribble) store.saveScribbleDay(day);
  $('#solved-scribble').hidden = !scribble;
  $('#solved-stats').textContent = [
    g.special ? 'Speciale puzzel' : g.daily ? `Dagpuzzel · ${lvl.name}` : lvl.name,
    recovery && !timerShownInRecovery ? null : formatTime(g.elapsed),
    g.hints ? `${g.hints} ${g.hints === 1 ? 'hint' : 'hints'}` : 'zonder hints',
    !g.mistakes && settings.errors !== 'uit' ? 'zonder fouten ✨' : null,
  ].filter(Boolean).join(' · ');
  // Een nieuw persoonlijk record (of de allereerste op dit niveau) krijgt een eigen, warme regel.
  // Een speciale puzzel is geen wedstrijdje; daar zeggen we niks over tijden.
  // Net zo voor de puzzels van een wedstrijddag.
  const recordText = counted && !g.special && !g.matchKind ? M.recordLine({ level: lvl, elapsed: g.elapsed, previousBest, firstOnLevel }) : '';
  $('#solved-record').textContent = recordText;
  $('#solved-record').hidden = !recordText;
  // Nieuw in het boekje: een eigen regel, tenzij er al een record-, speciale-dag-,
  // wedstrijd- of slaapberichtje staat. Dan blijft het bij het stipje op de knop.
  const seen = store.loadBookSeen();
  const news = unseen(stats, seen);
  const bookLine = news.length && !recordText && !special && !g.matchKind && !asleep
    ? `Nieuw in je boekje: ${listNames(news.map((id) => TECHNIQUES[id].name))} 📖` : '';
  $('#solved-book').textContent = bookLine;
  $('#solved-book').hidden = !bookLine;
  if (bookLine) { store.saveBookSeen([...seen, ...news]); renderBookDot(); }
  $('#solved-note').textContent = note;
  $('#solved-again').textContent = 'Nog eentje';
  $('#solved-again').dataset.level = g.matchKind ? 'zondag' : g.special || g.daily ? 'koffie' : g.levelId;

  setTimeout(() => {
    const d = openDialog('solved-dialog');
    d.addEventListener('close', async () => {
      d.querySelector('.paw-layer')?.remove();
      for (const m of fresh) {
        feedback('unlock');
        await showMessage({ icon: m.icon, title: `🔓 ${m.title}`, text: m.text, ok: 'Wat lief 💛' });
      }
      for (const id of freshThemes) await offerTheme(id);
      if (d.returnValue === 'again') startGame({ kind: 'level', levelId: $('#solved-again').dataset.level });
      else if (d.returnValue === 'home') goHome();
    }, { once: true });
  }, reduce ? 200 : g.shape ? 2050 : 1900);
}

// Een nieuw thema is vrij: vragen of ze het meteen wil proberen.
async function offerTheme(id) {
  const t = themeById(id);
  feedback('unlock');
  const yes = await confirmDialog(`Nieuw thema: ${t.name} ${t.emoji}`, M.THEME_UNLOCK_TEXT[id], 'Probeer maar!', 'Later', t.icon);
  if (!yes) return;
  settings.theme = id;
  store.saveSettings(settings);
  applyTheme();
  renderHome();
  render();
}

// Thema's die vrijkomen door alleen de app te openen (een datumvenster, zoals
// het WK Beachvolleybal). Bij het opstarten en bij terugkomen in de app.
async function checkOpeningUnlocks() {
  const fresh = checkThemeUnlocks(stats, today(), { opening: true });
  if (!fresh.length) return;
  saved(store.saveStats(stats));
  for (const id of fresh) await offerTheme(id);
}

// Een geheim thema gevonden: vrijspelen en meteen aanbieden. Was het al vrij,
// dan gebeurt er niets extra's. Geeft true als het nieuw was.
function unlockSecret(id) {
  if (!unlockTheme(stats, id, today())) return false;
  saved(store.saveStats(stats));
  offerTheme(id).then(showFreshMilestones);
  return true;
}

// Mijlpalen die buiten een opgeloste puzzel om vrijkomen (zoals Alle geheimen).
async function showFreshMilestones() {
  const fresh = M.newMilestones(stats, unlocked);
  if (!fresh.length) return;
  unlocked = [...unlocked, ...fresh.map((m) => m.id)];
  store.saveUnlocked(unlocked);
  for (const m of fresh) {
    feedback('unlock');
    await showMessage({ icon: m.icon, title: `🔓 ${m.title}`, text: m.text, ok: 'Wat lief 💛' });
  }
}

// Het geheime thema Game Boy: 8 keer snel op het logo tikken.
const logoTap = tapCounter();
$('.brand').addEventListener('click', () => {
  if (logoTap(performance.now())) unlockSecret('gameboy');
});

// Preitaart: drie keer op de 🥧 in de begroeting tikken. Elke tik wiebelt hij even.
const pieTap = tapCounter(PIE_TAPS);
$('#greeting').addEventListener('click', (e) => {
  const pie = e.target.closest('.pie-tap');
  if (!pie) return;
  pie.classList.remove('wiebel');
  void pie.offsetWidth;
  pie.classList.add('wiebel');
  if (pieTap(performance.now())) unlockSecret('preitaart');
});

// Onzichtbare inkt: in Briefje het getekende hartje op het opgelost-scherm 3 seconden
// ingedrukt houden. Intussen licht het hartje langzaam paars op (--uv, 0–1), zodat ze
// merkt dat er iets gebeurt. Loslaten: weer van voren af aan.
let holdStart = null, holdTimer = null;
function holdFrame() {
  const heart = $('.solved-heart');
  if (!heart || holdStart == null) return;
  heart.style.setProperty('--uv', holdProgress(holdStart, performance.now()).toFixed(3));
  requestAnimationFrame(holdFrame);
}
function holdEnd() {
  holdStart = null;
  clearTimeout(holdTimer);
  $('.solved-heart')?.style.setProperty('--uv', '0');
}
$('.solved-emoji').addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.solved-heart')) return;
  e.preventDefault();
  holdStart = performance.now();
  requestAnimationFrame(holdFrame);
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (holdProgress(holdStart, performance.now()) < 1) return;
    $('.solved-heart')?.style.setProperty('--uv', '1');
    holdStart = null;
    unlockSecret('onzichtbare-inkt');
  }, HOLD_MS);
});
for (const t of ['pointerup', 'pointercancel', 'pointerleave']) $('.solved-emoji').addEventListener(t, holdEnd);
$('.solved-emoji').addEventListener('contextmenu', (e) => e.preventDefault());

$('#solved-again').addEventListener('click', () => $('#solved-dialog').close('again'));
$('#solved-again-small').addEventListener('click', () => $('#solved-dialog').close('again'));
$('#solved-home').addEventListener('click', () => $('#solved-dialog').close('home'));

// ---------- Menu ----------

$('#back-btn').addEventListener('click', goHome);
$('#pause-btn').addEventListener('click', pause);
$('#menu-btn').addEventListener('click', () => { if (game) { render(); openDialog('menu-dialog'); } });
$('#timer').addEventListener('click', () => {
  if (recovery) timerShownInRecovery = !timerShownInRecovery;
  else {
    settings.showTimer = !settings.showTimer;
    store.saveSettings(settings);
  }
  renderTimer();
});

$('#check-btn').addEventListener('click', () => {
  closeDialog('menu-dialog');
  checkMarks = new Set();
  for (let i = 0; i < 81; i++) if (!game.isGiven(i) && game.isWrong(i)) checkMarks.add(i);
  const n = checkMarks.size;
  game.mistakes += n;
  saveGame();
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
    if (e.target === d && !['confirm-dialog', 'solved-dialog', 'wrapped-dialog'].includes(d.id)) d.close();
  });
}

// ---------- Instellingen ----------

// Eén keuze in de thema-kiezer: een radioknop met voorproefje.
function themeChoice({ id, name, previews, hint = '' }) {
  // Op een dagthema-dag niet te kiezen; haar eigen keuze blijft wel aangevinkt.
  return `<label class="theme-opt${shownTheme.own ? '' : ' fixed'}">
      <input type="radio" name="theme" value="${id}" ${settings.theme === id ? 'checked' : ''} ${shownTheme.own ? '' : 'disabled'}>
      <span class="theme-card"><i class="theme-preview" aria-hidden="true">${previews.map(themePreview).join('')}</i>
        <span class="theme-name">${escapeHtml(name)}</span>${hint ? `<small class="theme-hint">${escapeHtml(hint)}</small>` : ''}</span></label>`;
}

// Een nog vergrendeld thema: wel te zien en te focussen, niet te kiezen.
function lockedTheme(t) {
  const hint = unlockHint(t, stats, today());
  return `<button type="button" class="theme-opt locked" aria-disabled="true" aria-label="${escapeHtml(`${t.name}, nog op slot. ${hint}`)}">
      <span class="theme-card"><i class="theme-preview" aria-hidden="true">${themePreview(t.id)}</i>
        <span class="theme-name">${escapeHtml(t.name)}</span><small class="theme-hint" aria-hidden="true">${escapeHtml(hint)}</small></span></button>`;
}

// "Vandaag kies ik je thema: Volleybal 🏐 Morgen mag je weer zelf."
function dayThemeInfo() {
  const { theme, accent, kind } = shownTheme;
  const base = themeById(theme);
  if (!accent) return { name: base.name, emoji: M.THEME_EMOJI[theme] || '' };
  const icon = M.specialDay(today())?.icon || M.THEME_EMOJI[accent] || '';
  return { name: `${base.name} met ${themeById(accent).name}`, emoji: `${M.THEME_EMOJI[theme]}${kind === 'oudjaar' ? '🎆' : icon}` };
}

function renderSettings() {
  const note = $('#day-theme-note');
  note.hidden = shownTheme.own;
  note.textContent = shownTheme.own ? '' : M.dayThemeLine(today(), dayThemeInfo());
  // Per groepje een rij voorproefjes. Een geheim thema staat er pas als het vrij is.
  const own = stats.unlockedThemes;
  const seasonNow = resolveTheme('seizoen', today(), own);
  $('#theme-picker').innerHTML = THEME_GROUPS.map((g) => {
    const items = THEMES.filter((t) => t.group === g.id && !(t.unlock?.secret && !own.includes(t.id)))
      .map((t) => (!t.unlock || own.includes(t.id) ? themeChoice({ id: t.id, name: t.name, previews: [t.id] }) : lockedTheme(t)));
    // 'Seizoen (automatisch)' pas zodra er minstens één seizoen vrij is.
    if (g.id === 'seizoen' && THEMES.some((t) => t.season && own.includes(t.id))) items.unshift(themeChoice({ ...SEASON_AUTO, previews: [seasonNow], hint: 'automatisch' }));
    if (!items.length) return '';
    return `<h3 class="theme-group-title" id="theme-group-${g.id}">${escapeHtml(g.name)}</h3>
      <div id="theme-options-${g.id}" class="theme-options" role="radiogroup" aria-labelledby="theme-group-${g.id}">${items.join('')}</div>`;
  }).join('');
  for (const r of document.querySelectorAll('input[name="errors"]')) r.checked = r.value === settings.errors;
  explainErrors();
  for (const r of document.querySelectorAll('input[name="sound"]')) r.checked = r.value === settings.sound;
  for (const r of document.querySelectorAll('input[name="sleep"]')) r.checked = r.value === settings.sleep;
  // De regen-schakelaar staat er alleen bij Regenachtige dag.
  $('#rain-row').hidden = shownTheme.theme !== 'regen';
  for (const name of ['autoNotes', 'highlightSame', 'showTimer', 'haptics', 'rainSound']) {
    document.querySelector(`input[name="${name}"]`).checked = Boolean(settings[name]);
  }
  $('#haptics-row').hidden = !hasHaptics;
  $('#install-setting').hidden = !canInstall();
  $('#backup-undo').hidden = !store.loadPreviousBackup();
}

const ERRORS_EXPLAIN = {
  direct: 'Een cijfer dat niet klopt, wordt meteen rood.',
  verzoek: 'Je ziet pas wat er niet klopt als je erom vraagt: tik tijdens het spelen op ⋯ en kies Controleer mijn puzzel.',
  uit: 'Geen controle onderweg. Wil je toch even kijken, dan kan dat via ⋯ › Controleer mijn puzzel.',
};
const explainErrors = () => { $('#errors-explain').textContent = ERRORS_EXPLAIN[settings.errors] || ''; };

$('#settings-dialog').addEventListener('change', (e) => {
  const { name, value, checked, type } = e.target;
  if (!name) return;
  settings[name] = type === 'checkbox' ? checked : value;
  store.saveSettings(settings);
  applySleep();
  if (name === 'theme') { applyTheme(); renderHome(); $('#rain-row').hidden = shownTheme.theme !== 'regen'; } // render() volgt hieronder
  if (name === 'rainSound' || name === 'sound') fx?.update?.(fxCtx);
  if (name === 'errors') { checkMarks = new Set(); explainErrors(); }
  // Even laten horen hoe het klinkt: bij Gitaar een kort akkoord.
  if (name === 'sound') feedback(value === 'gitaar' ? 'preview' : 'place');
  // Het thema Gitaar speelt ook meteen een akkoord: dan hoort ze dat de gitaar meedoet.
  if (name === 'theme' && shownTheme.theme === 'gitaar' && settings.sound !== 'uit') feedback('preview');
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
  settings = loadSettings();
  stats = store.loadStats();
  unlocked = store.loadUnlocked();
  game = Game.fromJSON(store.loadGame());
  selected = null;
  focusDigit = null;
  checkMarks = new Set();
  applyTheme();
  applySleep();
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
  const b = res.data.stats;
  const puzzles = (n) => `${n} ${n === 1 ? 'opgeloste puzzel' : 'opgeloste puzzels'}`;
  const streaks = (s) => `langste reeks ${s.bestStreak}`;
  // Heeft de back-up minder dan wat er nu staat? Dan zeggen we dat extra duidelijk.
  const less = b.totalSolved < stats.totalSolved || b.bestStreak < stats.bestStreak;
  const ok = await confirmDialog(less ? 'Let op: deze back-up heeft minder' : 'Back-up terugzetten?',
    `Nu op dit toestel: ${puzzles(stats.totalSolved)}, ${streaks(stats)}. In de back-up${when}: ${puzzles(b.totalSolved)}, ${streaks(b)}. `
      + 'Wat er nu staat, wordt vervangen. Je kunt dat daarna nog één keer terugdraaien bij Instellingen.',
    less ? 'Toch terugzetten' : 'Ja, terugzetten', 'Nee');
  if (!ok) return;
  if (!store.importBackup(parsed).ok) { toast('Dat lukte niet. Er is niks veranderd 💛', 4000); return; }
  reloadState();
  requestPersist();
  toast('Je voortgang is terug 💛');
}

async function undoRestore() {
  closeDialog('settings-dialog');
  const prev = store.loadPreviousBackup();
  if (!prev) return;
  const n = prev.data.stats.totalSolved;
  const ok = await confirmDialog('Terug naar hoe het was?',
    `Dan staat alles weer zoals vlak vóór het terugzetten (${n} ${n === 1 ? 'opgeloste puzzel' : 'opgeloste puzzels'}).`,
    'Ja, terug', 'Nee');
  if (!ok) return;
  if (!store.restorePrevious().ok) { toast('Dat lukte niet. Er is niks veranderd 💛', 4000); return; }
  reloadState();
  toast('Alles staat weer zoals het was 💛');
}

$('#backup-save').addEventListener('click', () => { saveBackup().catch(() => toast('Dat lukte even niet. Probeer je het nog eens?')); });
$('#backup-restore').addEventListener('click', () => { $('#backup-file').value = ''; $('#backup-file').click(); });
$('#backup-file').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) restoreBackup(file).catch(() => toast('Dat lukte niet. Er is niks veranderd 💛', 4000));
});
$('#backup-undo').addEventListener('click', () => { undoRestore().catch(() => toast('Dat lukte niet. Er is niks veranderd 💛', 4000)); });

// ---------- Statistieken & berichtjes ----------

// Statistieken: 'Overzicht' (de cijfers) of 'Kalender'.
let statsView = 'overzicht';
function showStatsView(view) {
  statsView = view;
  for (const r of document.querySelectorAll('input[name="stats-view"]')) r.checked = r.value === view;
  $('#stats-body').hidden = view !== 'overzicht';
  $('#calendar').hidden = view !== 'kalender';
  $('#book').hidden = view !== 'boekje';
  if (view === 'kalender') renderCalendar();
  if (view === 'boekje') renderBook();
}
for (const r of document.querySelectorAll('input[name="stats-view"]')) r.addEventListener('change', () => showStatsView(r.value));

function renderStats() {
  calMonth = null;
  calSelected = dateKey(today());
  // Staat er iets nieuws in het boekje, dan opent Statistieken daar.
  showStatsView(unseen(stats, store.loadBookSeen()).length ? 'boekje' : statsView);
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
    </table>${wrappedListHtml()}`;
}

// ---------- Techniekenboekje ----------

const listNames = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`);

// Het stipje op Statistieken en op de knop Boekje: er is iets nieuws ontdekt.
function renderBookDot() {
  const fresh = unseen(stats, store.loadBookSeen()).length > 0;
  for (const dot of document.querySelectorAll('.book-dot')) dot.hidden = !fresh;
}

// "sinds 23 oktober" (met het jaar erbij als dat niet dit jaar is).
function sinceText(day) {
  const d = new Date(`${day}T12:00`);
  const opts = { day: 'numeric', month: 'long', ...(d.getFullYear() !== today().getFullYear() ? { year: 'numeric' } : {}) };
  return `sinds ${d.toLocaleDateString('nl-NL', opts)}`;
}

// Een mini-voorbeeld: een uitsnede van het bord met dezelfde markeringen als een hint bij stap 2.
function miniBoard(ex) {
  const [r0, r1] = ex.rows, [c0, c1] = ex.cols;
  const w = c1 - c0 + 1, h = r1 - r0 + 1;
  const region = new Set(ex.region), focus = new Set(ex.focus);
  const strike = new Map();
  for (const [cell, d] of ex.strike) strike.set(cell, (strike.get(cell) || 0) | bit(d));
  const glyph = glyphs();
  let html = '', k = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++, k++) {
      const i = r * 9 + c, raw = ex.cells[k], v = Math.abs(raw), given = raw > 0;
      const cls = ['cell'];
      const g = v && (allGlyphs(glyph) || (glyph === 'hand' && !given)) ? glyph : null;
      if (v) cls.push(given ? 'given' : 'user', ...(g ? [g] : []));
      if (ex.digit && v === ex.digit) cls.push('same');
      if (region.has(i)) cls.push('hint-region');
      if (focus.has(i)) cls.push('hint-focus');
      // Blokranden zoals op het echte bord; aan de buitenkant geen extra lijn.
      if (c === c1) cls.push('mb-lc'); else if (c % 3 === 2) cls.push('mb-r');
      if (r === r1) cls.push('mb-lr'); else if (r % 3 === 2) cls.push('mb-b');
      let inner = '';
      if (v) inner = g === 'hand' ? `<span class="v hand d${v}"></span>` : g ? `<span class="v ${g} d${v}">${v}</span>` : `<span class="v">${v}</span>`;
      else if (ex.notes[k]) {
        inner = '<span class="notes">';
        for (let d = 1; d <= 9; d++) {
          const has = ex.notes[k] & bit(d);
          const c2 = has ? ((strike.get(i) || 0) & bit(d) ? 'strike' : ex.digit === d ? 'hl' : '') : '';
          inner += `<span class="${c2}">${has ? d : ''}</span>`;
        }
        inner += '</span>';
      }
      html += `<span class="${cls.join(' ')}" data-b="${Math.floor(r / 3) * 3 + Math.floor(c / 3)}">${inner}</span>`;
    }
  }
  // Brede uitsneden (een hele rij of het hele bord) krijgen kleinere vakjes, zodat alles past.
  const cell = w >= 7 ? 30 : 36;
  return `<div class="mini-sudoku" style="--cols:${w};--rows:${h};--size:${cell * 9}px" role="img" aria-label="Voorbeeld op een stukje bord">${html}</div>`;
}

let examples = null;
async function renderBook() {
  const box = $('#book');
  const known = knownCount(stats), total = TECHNIQUE_IDS.length;
  // De voorbeelden zijn data (scripts/build-boekje.mjs); pas laden als het boekje opengaat.
  examples ??= (await import('./boekje-voorbeelden.js')).EXAMPLES;
  box.innerHTML = `
    <p class="book-count">Je kent nu ${known} van de ${total} technieken</p>
    <div class="book-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${known}" aria-label="Technieken in je boekje"><span style="--p:${known / total}"></span></div>
    ${BOOK.map(({ level, ids }) => `<section class="book-level" aria-label="${escapeHtml(level.name)}">
      <h3 class="book-level-title"><span aria-hidden="true">${level.emoji}</span> ${escapeHtml(level.name)}</h3>
      ${ids.map((id) => {
        const t = stats.techniques[id];
        const name = escapeHtml(TECHNIQUES[id].name);
        if (!t) {
          return `<article class="book-item locked" data-technique="${id}"><h4><span class="book-lock" aria-hidden="true">🔒</span> ${name}</h4>
            <p class="book-hint">${escapeHtml(lockedHint(id))}</p></article>`;
        }
        return `<article class="book-item" data-technique="${id}"><h4>${name}</h4>
          <p class="book-since">${sinceText(t.since)}${t.hints > 1 ? ` · ${t.hints}× in een hint` : ''}</p>
          <p class="book-text">${escapeHtml(TECHNIQUE_TEXT[id])}</p>
          ${miniBoard(examples[id])}</article>`;
      }).join('')}
    </section>`).join('')}`;
  // Gezien: het stipje mag weg.
  store.saveBookSeen([...store.loadBookSeen(), ...TECHNIQUE_IDS.filter((id) => stats.techniques[id])]);
  renderBookDot();
}

// ---------- Ruby Wrapped ----------

// De jaren waarvoor er iets in het logboek staat of een overzicht bewaard is.
const wrappedDataYears = () => [...store.logEntries(stats).map((e) => Number(e.day.slice(0, 4))), ...Object.keys(stats.wrapped || {}).map(Number)];

// Het overzicht van een jaar: vers uit het logboek, of het bewaarde als dat vollediger is.
function wrappedFor(year) {
  const before = JSON.stringify(stats.wrapped?.[year] ?? null);
  const w = store.rememberWrapped(stats, wrapped(store.logEntries(stats), year));
  if (JSON.stringify(stats.wrapped?.[year] ?? null) !== before) saved(store.saveStats(stats));
  return w;
}

// Van 31 december tot en met 7 januari: een kaartje op het startscherm.
function renderWrappedCard(now) {
  const slot = $('#wrapped-slot');
  slot.innerHTML = '';
  const year = wrappedYearOn(now);
  if (!year || !wrappedDataYears().includes(year)) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card wrapped-card';
  btn.innerHTML = `<span class="card-kicker">Ruby Wrapped ${year}</span>
    <span class="card-title">${escapeHtml(M.WRAPPED_CARD_TITLE)}</span>
    <span class="card-meta">Tik om je jaar te bekijken</span>`;
  btn.addEventListener('click', () => openWrapped(year));
  slot.append(btn);
}

// Onder Statistieken: alle eerdere (en de huidige) Wrapped om terug te kijken.
function wrappedListHtml() {
  const years = wrappedYears(wrappedDataYears(), today());
  if (!years.length) return '';
  return `<div class="wrapped-list"><h3>Ruby Wrapped ✨</h3>${years.map((y) => `<button type="button" class="btn ghost" data-wrapped="${y}">${y}</button>`).join('')}</div>`;
}
$('#stats-body').addEventListener('click', (e) => {
  const b = e.target.closest('[data-wrapped]');
  if (!b) return;
  closeDialog('stats-dialog');
  openWrapped(Number(b.dataset.wrapped));
});

let wrCards = [];
let wrIndex = 0;
let wrYear = null;

function openWrapped(year) {
  wrYear = year;
  wrCards = M.wrappedCards(wrappedFor(year), levelById);
  wrIndex = 0;
  $('.wr-close').innerHTML = ICONS.close;
  renderWrapped();
  openDialog('wrapped-dialog');
  $('#wr-next').focus();
}

function renderWrapped() {
  const c = wrCards[wrIndex];
  $('#wr-progress').innerHTML = wrCards.map((_, k) => `<span class="${k < wrIndex ? 'done' : k === wrIndex ? 'now' : ''}"></span>`).join('');
  const card = $('#wr-card');
  card.dataset.card = c.id;
  card.setAttribute('aria-label', `Kaart ${wrIndex + 1} van ${wrCards.length}`);
  card.innerHTML = `<span class="wr-emoji" aria-hidden="true">${escapeHtml(c.emoji)}</span>
    <span class="wr-kicker">${escapeHtml(c.kicker)}</span>
    <p class="wr-big">${escapeHtml(c.big)}</p>
    <p class="wr-text">${escapeHtml(c.text)}</p>`;
  // Opnieuw starten van de inschuif-animatie (staat uit bij minder beweging).
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
  const last = wrIndex === wrCards.length - 1;
  $('#wr-prev').disabled = wrIndex === 0;
  $('#wr-next').setAttribute('aria-label', last ? 'Sluiten' : 'Volgende kaart');
  const actions = $('#wr-actions');
  actions.innerHTML = '';
  if (last) {
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'btn primary';
    share.id = 'wr-share';
    share.textContent = 'Deel als plaatje';
    share.addEventListener('click', () => shareWrapped(c).catch(() => toast('Dat lukte even niet 💛')));
    actions.append(share);
  }
}

function stepWrapped(d) {
  const n = wrIndex + d;
  if (n < 0) return;
  if (n >= wrCards.length) { closeDialog('wrapped-dialog'); return; }
  wrIndex = n;
  renderWrapped();
}
$('#wr-prev').addEventListener('click', () => stepWrapped(-1));
$('#wr-next').addEventListener('click', () => stepWrapped(1));
$('#wrapped-dialog').addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); stepWrapped(1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); stepWrapped(-1); }
  else if (k === 'Home') { e.preventDefault(); stepWrapped(-wrIndex); }
  else if (k === 'End') { e.preventDefault(); stepWrapped(wrCards.length - 1 - wrIndex); }
});

// De afsluitkaart als plaatje (canvas → PNG), via het deelmenu of anders als download.
async function shareWrapped(c) {
  await document.fonts?.ready;
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const x = canvas.getContext('2d');
  const grad = x.createRadialGradient(W / 2, 0, 50, W / 2, 0, H);
  grad.addColorStop(0, v('--bg-2', '#fdefc8'));
  grad.addColorStop(0.7, v('--bg', '#fff8e7'));
  x.fillStyle = grad;
  x.fillRect(0, 0, W, H);
  x.textAlign = 'center';
  x.fillStyle = v('--ink', '#3a2f22');
  const wrap = (text, font, y, lineHeight, maxWidth) => {
    x.font = font;
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (x.measureText(test).width > maxWidth && line) { x.fillText(line, W / 2, y); line = word; y += lineHeight; } else line = test;
    }
    x.fillText(line, W / 2, y);
    return y + lineHeight;
  };
  let y = 360;
  y = wrap(c.emoji, '160px sans-serif', y, 200, W - 160);
  x.fillStyle = v('--ink-soft', '#7a6a55');
  y = wrap(c.kicker.toUpperCase(), '800 40px Nunito, sans-serif', y, 70, W - 160);
  x.fillStyle = v('--ink', '#3a2f22');
  y = wrap(c.big, '600 100px Fraunces, Georgia, serif', y + 20, 120, W - 160);
  wrap(c.text, '48px Nunito, sans-serif', y + 30, 68, W - 200);
  x.fillStyle = v('--ink-soft', '#7a6a55');
  x.font = '700 36px Nunito, sans-serif';
  x.fillText(`Ruby Wrapped ${wrYear} · Ruby's Sudoku`, W / 2, H - 80);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], `ruby-wrapped-${wrYear}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `Ruby Wrapped ${wrYear}` }); return; } catch (err) { if (err?.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Plaatje gedownload 💛');
}

// ---------- Kalender ----------

let calMonth = null; // { y, m } die nu in beeld is (m = 0..11)
let calSelected = null; // 'JJJJ-MM-DD'

const monthKey = ({ y, m }) => y * 12 + m;
const dayKeyOf = (y, m, d) => dateKey(new Date(y, m, d));
const monthName = (y, m) => new Date(y, m, 1).toLocaleDateString('nl-NL', { month: 'long' });
const longDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Alle opgeloste puzzels per dag, en de eerste maand waar iets in staat.
function calendarData() {
  const byDay = new Map();
  for (const e of store.logEntries(stats)) {
    if (!byDay.has(e.day)) byDay.set(e.day, []);
    byDay.get(e.day).push(e);
  }
  const first = store.logEntries(stats)[0]?.day;
  return { byDay, first: first ? { y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 } : null };
}

function renderCalendar() {
  const now = today();
  const todayKey = dateKey(now);
  const thisMonth = { y: now.getFullYear(), m: now.getMonth() };
  const { byDay, first } = calendarData();
  const minMonth = first && monthKey(first) < monthKey(thisMonth) ? first : thisMonth;
  calMonth ??= thisMonth;
  if (monthKey(calMonth) > monthKey(thisMonth)) calMonth = thisMonth;
  if (monthKey(calMonth) < monthKey(minMonth)) calMonth = minMonth;
  const { y, m } = calMonth;
  const name = monthName(y, m);

  $('#cal-prev').innerHTML = ICONS.back;
  $('#cal-next').innerHTML = ICONS.next;
  $('#cal-prev').disabled = monthKey(calMonth) <= monthKey(minMonth);
  $('#cal-next').disabled = monthKey(calMonth) >= monthKey(thisMonth);
  $('#cal-month').textContent = `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
  $('#cal-weekdays').innerHTML = M.CALENDAR_WEEKDAYS.map((d) => `<span>${d}</span>`).join('');

  // Het maandrooster: maandag eerst, lege plekjes vóór de eerste dag.
  const days = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const hand = handwritten();
  // Een gekozen dag uit een andere maand telt hier niet.
  if (calSelected?.slice(0, 7) !== dayKeyOf(y, m, 1).slice(0, 7)) calSelected = null;
  // Wie met het toetsenbord in het rooster komt, landt op de gekozen dag (of vandaag, of de 1e).
  const focusKey = calSelected || (monthKey(calMonth) === monthKey(thisMonth) ? todayKey : dayKeyOf(y, m, 1));
  let html = '<span></span>'.repeat(offset);
  let puzzles = 0, solvedDays = 0;
  for (let d = 1; d <= days; d++) {
    const key = dayKeyOf(y, m, d);
    const list = byDay.get(key) || [];
    const future = key > todayKey;
    puzzles += list.length;
    if (list.length) solvedDays++;
    const daily = list.some((e) => e.daily), special = list.find((e) => e.special);
    const cls = ['cal-day', list.length ? 'solved' : '', daily ? 'daily' : '', special ? 'special' : '', key === todayKey ? 'today' : ''].filter(Boolean).join(' ');
    const heart = list.length ? (hand ? '<span class="cal-heart hand-art hart-2" aria-hidden="true"></span>' : `<span class="cal-heart" aria-hidden="true">${ICONS.heart}</span>`) : '';
    const label = [
      `${d} ${name}`, key === todayKey ? 'vandaag' : '',
      list.length ? `${list.length} ${list.length === 1 ? 'puzzel' : 'puzzels'} opgelost` : future ? '' : 'geen puzzel',
      daily ? 'met de dagpuzzel' : '', special ? `speciale puzzel voor ${M.specialLabel(special.special).replace(/ \S+$/, '')}` : '',
    ].filter(Boolean).join(', ');
    html += `<button type="button" class="${cls}" data-day="${key}" aria-label="${escapeHtml(label)}" aria-pressed="${key === calSelected}"
      tabindex="${key === focusKey ? 0 : -1}"${future ? ' disabled' : ''}><span class="cal-num">${d}</span>${heart}</button>`;
  }
  $('#cal-grid').innerHTML = html;
  $('#cal-grid').setAttribute('aria-label', `Dagen in ${name} ${y}`);
  $('#cal-summary').textContent = M.monthSummary({ puzzles, days: solvedDays, current: monthKey(calMonth) === monthKey(thisMonth), month: name });
  renderCalendarDay(byDay, todayKey);
}

// Wat ze op de gekozen dag heeft opgelost.
function renderCalendarDay(byDay, todayKey) {
  const box = $('#cal-detail');
  if (!calSelected) { box.innerHTML = `<p class="muted">${escapeHtml(M.CALENDAR_PICK_DAY)}</p>`; return; }
  const list = byDay.get(calSelected) || [];
  const items = list.map((e) => {
    const lvl = e.level ? levelById(e.level) : null;
    const sp = e.special ? M.specialById(e.special) : null;
    const figure = sp?.shape ? SHAPES[sp.shape].name : 'speciale puzzel';
    const [emoji, what] = e.special ? [sp?.icon || '💛', `${figure.charAt(0).toUpperCase()}${figure.slice(1)}`] : lvl ? [lvl.emoji, lvl.name] : ['📅', 'Dagpuzzel'];
    const meta = [
      e.special ? M.specialLabel(e.special) : '',
      e.ms != null ? formatTime(e.ms) : '',
      e.hints == null ? '' : e.hints ? `${e.hints} ${e.hints === 1 ? 'hint' : 'hints'}` : 'zonder hints',
      e.daily && lvl ? 'de dagpuzzel' : '',
    ].filter(Boolean).join(' · ');
    return `<li><span class="cal-emoji" aria-hidden="true">${emoji}</span><div><span class="cal-what">${escapeHtml(what)}</span>
      ${meta ? `<span class="cal-meta"> · ${escapeHtml(meta)}</span>` : ''}${e.record ? `<p class="cal-record">${escapeHtml(M.calendarRecordNote(e.day))}</p>` : ''}</div></li>`;
  }).join('');
  box.innerHTML = `<h4>${escapeHtml(longDate(calSelected))}</h4>${items
    ? `<ul class="cal-list">${items}</ul>`
    : `<p class="muted">${escapeHtml(M.emptyDayLine({ isToday: calSelected === todayKey, future: calSelected > todayKey }))}</p>`}`;
}

function moveCalMonth(step) {
  calMonth = { y: calMonth.y + Math.floor((calMonth.m + step) / 12), m: (((calMonth.m + step) % 12) + 12) % 12 };
  calSelected = null;
  renderCalendar();
}
$('#cal-prev').addEventListener('click', () => moveCalMonth(-1));
$('#cal-next').addEventListener('click', () => moveCalMonth(1));

$('#cal-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.cal-day');
  if (!b || b.disabled) return;
  calSelected = b.dataset.day;
  renderCalendar();
  $(`#cal-grid [data-day="${calSelected}"]`)?.focus();
});

// Met het toetsenbord: pijltjes per dag of week, Home/End naar begin of eind, PageUp/PageDown per maand.
$('#cal-grid').addEventListener('keydown', (e) => {
  const b = e.target.closest('.cal-day');
  if (!b) return;
  const days = [...$('#cal-grid').querySelectorAll('.cal-day:not(:disabled)')];
  const i = days.indexOf(b);
  const to = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - 7, ArrowDown: i + 7, Home: 0, End: days.length - 1 }[e.key];
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const btn = e.key === 'PageUp' ? $('#cal-prev') : $('#cal-next');
    e.preventDefault();
    if (!btn.disabled) { moveCalMonth(e.key === 'PageUp' ? -1 : 1); $('#cal-grid .cal-day[tabindex="0"]')?.focus(); }
    return;
  }
  if (to === undefined) return;
  e.preventDefault();
  const target = days[Math.max(0, Math.min(days.length - 1, to))];
  for (const d of days) d.tabIndex = d === target ? 0 : -1;
  target.focus();
});

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

// ---------- Scherm aan laten ----------

// Zolang de app in beeld is, gaat het scherm niet uit (Screen Wake Lock).
// Gaat de app naar de achtergrond, dan laat de browser hem zelf los; bij
// terugkomen vragen we hem opnieuw. Safari wil soms eerst een tik zien,
// daarom proberen we het ook bij elke aanraking zolang we er nog geen hebben.
let wakeLock = null;
let wakeLockPending = false;
let wakeLockBlocked = false; // na een slaapberichtje: het scherm mag uit
async function keepAwake() {
  if (wakeLockBlocked || !('wakeLock' in navigator) || wakeLock || wakeLockPending || document.visibilityState !== 'visible') return;
  wakeLockPending = true;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {
    wakeLock = null; // bijvoorbeeld in de energiebesparingsmodus: dan maar niet
  }
  wakeLockPending = false;
}
document.addEventListener('visibilitychange', keepAwake);
document.addEventListener('pointerdown', keepAwake, { passive: true });
// Welterusten: de wake lock los, zodat het scherm uit mag (tot ze een nieuwe puzzel begint).
function letScreenSleep() {
  wakeLockBlocked = true;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applySleep(); });

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
applySleep();
renderBookDot();
if (testDate) {
  const badge = document.createElement('div');
  badge.className = 'test-badge';
  badge.textContent = `Testdatum ${params.get('vandaag').replace('T', ' ')} · aparte opslag`;
  document.body.append(badge);
}
try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* oudere browsers */ }
buildBoard();
renderHome();
showScreen('home');
if (stats.totalSolved > 0) requestPersist();
checkOpeningUnlocks();

const idle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
idle(() => fillStash());

registerServiceWorker();
keepAwake();
