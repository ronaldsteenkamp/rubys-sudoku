// Alles in localStorage, altijd met try/catch: in een privévenster of met
// geblokkeerde opslag werkt de app gewoon door, alleen zonder geheugen.

import { SEASON_THEMES } from './themes.js';
import { isValidGameData } from './game.js';

let PREFIX = 'rubys-sudoku:';

// Met ?vandaag= (een testdatum) gebruikt de app een aparte opslag, zodat
// testen nooit Ruby's echte reeks, statistieken of verrassingen raakt.
export function useTestStorage(on = true) { PREFIX = on ? 'rubys-sudoku-test:' : 'rubys-sudoku:'; }
const SEASON_IDS = SEASON_THEMES.map((t) => t.id);

function read(key, fallback) {
  let raw = null;
  try {
    raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    // Kapotte JSON niet weggooien: de volgende keer opslaan zou hem overschrijven.
    // Een kopie onder '<key>-kapot' is nog te redden (bijvoorbeeld voor de statistieken).
    if (raw) try { globalThis.localStorage.setItem(`${PREFIX}${key}-kapot`, raw); } catch { /* dan niet */ }
    return fallback;
  }
}

function write(key, value) {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try { globalThis.localStorage?.removeItem(PREFIX + key); } catch { /* niks aan te doen */ }
}

// ---------- Instellingen ----------

export const DEFAULT_SETTINGS = {
  theme: 'zonnig', // zonnig | nacht | … | seizoen (zie themes.js)
  errors: 'direct', // direct | verzoek | uit
  autoNotes: true,
  highlightSame: true,
  showTimer: true,
  sound: 'zacht', // uit | zacht | gitaar
  haptics: true,
};

export const SOUND_STYLES = ['uit', 'zacht', 'gitaar'];

// Vroeger was geluid een schakelaar (true/false): aan wordt 'zacht', uit wordt 'uit'.
function migrateSound(sound) {
  if (typeof sound === 'boolean') return sound ? 'zacht' : 'uit';
  return SOUND_STYLES.includes(sound) ? sound : DEFAULT_SETTINGS.sound;
}

// Alleen bekende instellingen, met het juiste type; de rest valt terug op standaard.
function cleanSettings(raw) {
  const s = { ...DEFAULT_SETTINGS };
  if (!isObj(raw)) return s;
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) if (typeof raw[k] === typeof def) s[k] = raw[k];
  // Ook instellingen van vóór de geluidsstijlen (sound: true/false) komen goed over.
  if ('sound' in raw) s.sound = migrateSound(raw.sound);
  return s;
}

export const loadSettings = () => cleanSettings(read('settings', {}));
export const saveSettings = (s) => write('settings', s);

// ---------- Lopende puzzel ----------

// Een opgeslagen puzzel die niet klopt, telt als geen puzzel (en wordt opgeruimd).
export function loadGame() {
  const g = read('game', null);
  if (g === null || isValidGameData(g)) return g;
  remove('game');
  return null;
}
export const saveGame = (g) => write('game', g);
export const clearGame = () => remove('game');

// ---------- Statistieken ----------

export function emptyStats() {
  return {
    levels: {}, // { [levelId]: { played, solved, best, totalTime } }
    totalSolved: 0,
    dailySolved: 0,
    noHintSolved: 0,
    streak: 0,
    bestStreak: 0,
    lastSolvedDay: null,
    dailyDone: [], // datums van opgeloste dagpuzzels (laatste 60)
    dailyTimes: {}, // { 'JJJJ-MM-DD': ms } tijd per opgeloste dagpuzzel
    specialDone: [],
    seasonSolves: {}, // { 'herfst-2026': 2 } opgeloste puzzels per seizoen
    unlockedThemes: [], // ontgrendelde seizoensthema's, bijv. ['herfst']
  };
}

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const count = (n) => (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
const time = (n) => (Number.isFinite(n) && n >= 0 ? n : null);
const isKey = (k) => /^[a-z0-9-]{1,30}$/.test(k);

// Een object met alleen nette sleutels en getallen (tijden, aantallen).
function numberMap(raw, fix) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    const n = fix(v);
    if (isKey(k) && n != null) out[k] = n;
  }
  return out;
}

// Maakt oude (of half kapotte, of met de hand aangepaste) statistieken weer
// compleet en netjes: elk getal is echt een getal, elke datum echt een datum.
// Oude dagpuzzels hebben nog geen tijd; die blijven gewoon in dailyDone staan.
export function migrateStats(raw) {
  const r = isObj(raw) ? raw : {};
  const s = emptyStats();
  for (const k of ['totalSolved', 'dailySolved', 'noHintSolved', 'streak', 'bestStreak']) s[k] = count(r[k]);
  s.lastSolvedDay = isDay(r.lastSolvedDay) ? r.lastSolvedDay : null;
  s.dailyDone = Array.isArray(r.dailyDone) ? r.dailyDone.filter(isDay) : [];
  s.specialDone = isStrings(r.specialDone) ? r.specialDone : [];
  s.dailyTimes = numberMap(r.dailyTimes, time);
  s.seasonSolves = numberMap(r.seasonSolves, (n) => (Number.isFinite(n) && n >= 0 ? count(n) : null));
  if (isObj(r.levels)) {
    for (const [id, l] of Object.entries(r.levels)) {
      if (!isKey(id) || !isObj(l)) continue;
      s.levels[id] = { played: count(l.played), solved: count(l.solved), best: time(l.best), totalTime: time(l.totalTime) ?? 0 };
    }
  }
  s.unlockedThemes = Array.isArray(r.unlockedThemes) ? r.unlockedThemes.filter((t) => SEASON_IDS.includes(t)) : [];
  return s;
}

export const loadStats = () => migrateStats(read('stats', {}));
// Geeft false als het opslaan niet lukte (bijvoorbeeld een volle opslag).
export const saveStats = (s) => write('stats', s);

const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);

export function recordStart(stats, levelId) {
  const l = stats.levels[levelId] || (stats.levels[levelId] = { played: 0, solved: 0, best: null, totalTime: 0 });
  l.played++;
  return stats;
}

// Telt een dag mee voor de reeks. De reeks gaat alleen vooruit: een dag die
// eerder ligt dan de laatst getelde dag verandert niets.
function markPlayed(stats, day) {
  const last = stats.lastSolvedDay;
  if (last && day <= last) return;
  stats.streak = last && dayDiff(last, day) === 1 ? stats.streak + 1 : 1;
  stats.lastSolvedDay = day;
}

// Werkt de statistieken bij na een opgeloste puzzel. `today` = 'JJJJ-MM-DD'.
// `started` is de dag waarop de puzzel begon. Een dagpuzzel die al eens is
// opgelost telt niet nog een keer mee.
export function recordSolve(stats, { levelId, elapsed, hints, daily, special, started }, today) {
  if (daily && stats.dailyDone.includes(daily)) return { stats, newBest: false, counted: false };
  const l = stats.levels[levelId] || (stats.levels[levelId] = { played: 1, solved: 0, best: null, totalTime: 0 });
  l.solved++;
  l.totalTime += elapsed;
  const newBest = l.best == null || elapsed < l.best;
  if (newBest) l.best = elapsed;
  stats.totalSolved++;
  if (!hints) stats.noHintSolved++;
  if (daily) {
    stats.dailySolved++;
    stats.dailyDone = [...stats.dailyDone, daily].slice(-60);
    stats.dailyTimes = { ...stats.dailyTimes, [daily]: elapsed };
    for (const k of Object.keys(stats.dailyTimes)) if (!stats.dailyDone.includes(k)) delete stats.dailyTimes[k];
  }
  if (special && !stats.specialDone.includes(special)) stats.specialDone = [...stats.specialDone, special];

  // Streak: dagen achter elkaar met minstens één opgeloste puzzel. Ook de dag
  // van de dagpuzzel en de dag waarop ze begon tellen mee: een puzzel van
  // gisteravond die pas na middernacht af is, houdt de reeks dus heel.
  // Ligt de laatste dag in de toekomst (klok verzet), dan rekenen we vanaf vandaag.
  if (stats.lastSolvedDay && stats.lastSolvedDay > today) stats.lastSolvedDay = today;
  for (const day of [...new Set([started, daily, today].filter((d) => isDay(d) && d <= today))].sort()) markPlayed(stats, day);
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  return { stats, newBest, counted: true };
}

// Streak zoals die vandaag telt (0 als ze gisteren niet gespeeld heeft).
export function currentStreak(stats, today) {
  if (!stats.lastSolvedDay) return 0;
  return dayDiff(stats.lastSolvedDay, today) <= 1 ? stats.streak : 0;
}

// ---------- Mijlpalen & berichtjes ----------

const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
export const loadUnlocked = () => strings(read('unlocked', []));
export const saveUnlocked = (u) => write('unlocked', u);
export const loadRecentNotes = () => strings(read('recent-notes', []));
export const saveRecentNotes = (n) => write('recent-notes', n.slice(-8));

// ---------- Krabbeltje in Briefje (één keer per dag) ----------

// De dag ('JJJJ-MM-DD') waarop het krabbeltje voor het laatst te zien was.
export const loadScribbleDay = () => { const d = read('scribble', null); return typeof d === 'string' ? d : null; };
export const saveScribbleDay = (day) => write('scribble', day);
// Het krabbeltje mag vandaag (nog) als het vandaag nog niet geweest is.
export const scribbleDue = (lastDay, today) => lastDay !== today;

// ---------- Puzzelvoorraad (zodat een nieuwe puzzel meteen klaarstaat) ----------

export const loadStash = () => read('stash', {});
export const saveStash = (s) => write('stash', s);

// ---------- "Zet op beginscherm"-kaartje ----------

export const loadInstallSnooze = () => read('install-snooze', 0);
export const saveInstallSnooze = (until) => write('install-snooze', until);

// ---------- Back-up maken en terugzetten ----------

export const BACKUP_APP = 'rubys-sudoku';
export const BACKUP_VERSION = 1;

// Bouwt een back-up-object uit de losse onderdelen (puur, makkelijk te testen).
export function makeBackup({ settings, stats, unlocked, recentNotes, game, scribbleDay = null, errors = [] }, date = new Date()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    created: date.toISOString(),
    // `errors` is alleen om mee te kijken; bij terugzetten doet het niets.
    data: { settings, stats, unlocked, recentNotes, game: game ?? null, scribbleDay, errors },
  };
}

// Alles wat nu in de opslag staat, als back-up.
export const exportBackup = (date) => makeBackup({
  settings: loadSettings(), stats: loadStats(), unlocked: loadUnlocked(), recentNotes: loadRecentNotes(), game: loadGame(),
  scribbleDay: loadScribbleDay(), errors: loadErrors(),
}, date);

// Controleert een ingelezen back-up. Geeft { ok: true, data } met nette,
// aangevulde gegevens terug, of { ok: false, reason } zonder iets aan te raken.
export function validateBackup(obj) {
  if (!isObj(obj) || obj.app !== BACKUP_APP) return { ok: false, reason: 'geen back-up van Ruby\'s Sudoku' };
  if (obj.version !== BACKUP_VERSION) return { ok: false, reason: 'onbekende versie' };
  const d = obj.data;
  if (!isObj(d) || !isObj(d.settings) || !isObj(d.stats)) return { ok: false, reason: 'onvolledig' };
  if (typeof d.stats.totalSolved !== 'number' || !isObj(d.stats.levels)) return { ok: false, reason: 'statistieken kloppen niet' };
  if (!isStrings(d.unlocked ?? []) || !isStrings(d.recentNotes ?? [])) return { ok: false, reason: 'berichtjes kloppen niet' };
  const g = d.game ?? null;
  if (g !== null && !isValidGameData(g)) return { ok: false, reason: 'puzzel klopt niet' };

  // Oudere back-ups kennen het krabbeltje nog niet; iets anders dan een datum telt als 'nooit'.
  const scribbleDay = typeof d.scribbleDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.scribbleDay) ? d.scribbleDay : null;

  return {
    ok: true,
    data: { settings: cleanSettings(d.settings), stats: migrateStats(d.stats), unlocked: d.unlocked ?? [], recentNotes: d.recentNotes ?? [], game: g, scribbleDay },
  };
}

// Zet een gecontroleerde back-up terug. Ongeldige invoer laat alles ongemoeid.
// De stand van daarvoor bewaren we eerst, zodat terugzetten altijd terug te draaien is.
export function importBackup(obj, { keepPrevious = true } = {}) {
  const res = validateBackup(obj);
  if (!res.ok) return res;
  if (keepPrevious) write('voor-terugzetten', exportBackup());
  const { settings, stats, unlocked, recentNotes, game, scribbleDay } = res.data;
  saveSettings(settings);
  saveStats(stats);
  saveUnlocked(unlocked);
  saveRecentNotes(recentNotes);
  if (game) saveGame(game); else clearGame();
  if (scribbleDay) saveScribbleDay(scribbleDay); else remove('scribble');
  return res;
}

// De stand van vlak vóór het laatste terugzetten (of null).
export function loadPreviousBackup() {
  const b = read('voor-terugzetten', null);
  return validateBackup(b).ok ? b : null;
}

// Zet de stand van vóór het terugzetten weer terug; de stand van nu wordt dan
// op zijn beurt de 'vorige', zodat je heen en weer kunt.
export function restorePrevious() {
  const prev = loadPreviousBackup();
  if (!prev) return { ok: false, reason: 'geen vorige stand' };
  return importBackup(prev);
}

// ---------- Foutenlogboek ----------

// De laatste paar fouten, zodat er via een back-up te zien is wat er op het toestel misging.
export const loadErrors = () => strings(read('fouten', []));
export function logError(text, date = new Date()) {
  write('fouten', [...loadErrors(), `${date.toISOString()} ${String(text).slice(0, 300)}`].slice(-20));
}
