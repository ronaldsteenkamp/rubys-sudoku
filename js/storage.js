// Alles in localStorage, altijd met try/catch: in een privévenster of met
// geblokkeerde opslag werkt de app gewoon door, alleen zonder geheugen.

import { SEASON_THEMES } from './themes.js';

const PREFIX = 'rubys-sudoku:';
const SEASON_IDS = SEASON_THEMES.map((t) => t.id);

function read(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
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
  theme: 'auto', // auto | zonnig | nacht | gran-canaria | lelie
  errors: 'direct', // direct | verzoek | uit
  autoNotes: true,
  highlightSame: true,
  showTimer: true,
  sound: true,
  haptics: true,
};

export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read('settings', {}) });
export const saveSettings = (s) => write('settings', s);

// ---------- Lopende puzzel ----------

export const loadGame = () => read('game', null);
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

// Maakt oude (of half kapotte) statistieken weer compleet. Oude dagpuzzels
// hebben nog geen tijd; die blijven gewoon in dailyDone staan.
export function migrateStats(raw) {
  const s = { ...emptyStats(), ...(raw && typeof raw === 'object' ? raw : {}) };
  for (const k of ['dailyDone', 'specialDone']) if (!Array.isArray(s[k])) s[k] = [];
  for (const k of ['levels', 'dailyTimes', 'seasonSolves']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
  s.unlockedThemes = Array.isArray(s.unlockedThemes) ? s.unlockedThemes.filter((t) => SEASON_IDS.includes(t)) : [];
  return s;
}

export const loadStats = () => migrateStats(read('stats', {}));
export const saveStats = (s) => write('stats', s);

const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);

export function recordStart(stats, levelId) {
  const l = stats.levels[levelId] || (stats.levels[levelId] = { played: 0, solved: 0, best: null, totalTime: 0 });
  l.played++;
  return stats;
}

// Werkt de statistieken bij na een opgeloste puzzel. `today` = 'JJJJ-MM-DD'.
// Een dagpuzzel die al eens is opgelost telt niet nog een keer mee.
export function recordSolve(stats, { levelId, elapsed, hints, daily, special }, today) {
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

  // Streak: dagen achter elkaar met minstens één opgeloste puzzel.
  if (stats.lastSolvedDay !== today) {
    const gap = stats.lastSolvedDay ? dayDiff(stats.lastSolvedDay, today) : null;
    stats.streak = gap === 1 ? stats.streak + 1 : 1;
    stats.lastSolvedDay = today;
  }
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  return { stats, newBest, counted: true };
}

// Streak zoals die vandaag telt (0 als ze gisteren niet gespeeld heeft).
export function currentStreak(stats, today) {
  if (!stats.lastSolvedDay) return 0;
  return dayDiff(stats.lastSolvedDay, today) <= 1 ? stats.streak : 0;
}

// ---------- Mijlpalen & berichtjes ----------

export const loadUnlocked = () => read('unlocked', []);
export const saveUnlocked = (u) => write('unlocked', u);
export const loadRecentNotes = () => read('recent-notes', []);
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
export function makeBackup({ settings, stats, unlocked, recentNotes, game, scribbleDay = null }, date = new Date()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    created: date.toISOString(),
    data: { settings, stats, unlocked, recentNotes, game: game ?? null, scribbleDay },
  };
}

// Alles wat nu in de opslag staat, als back-up.
export const exportBackup = (date) => makeBackup({
  settings: loadSettings(), stats: loadStats(), unlocked: loadUnlocked(), recentNotes: loadRecentNotes(), game: loadGame(),
  scribbleDay: loadScribbleDay(),
}, date);

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

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
  if (g !== null && (!isObj(g) || g.v !== 1 || !Array.isArray(g.givens) || g.givens.length !== 81)) return { ok: false, reason: 'puzzel klopt niet' };

  // Oudere back-ups kennen het krabbeltje nog niet; iets anders dan een datum telt als 'nooit'.
  const scribbleDay = typeof d.scribbleDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.scribbleDay) ? d.scribbleDay : null;

  // Alleen bekende instellingen, met het juiste type.
  const settings = { ...DEFAULT_SETTINGS };
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) if (typeof d.settings[k] === typeof def) settings[k] = d.settings[k];
  return {
    ok: true,
    data: { settings, stats: migrateStats(d.stats), unlocked: d.unlocked ?? [], recentNotes: d.recentNotes ?? [], game: g, scribbleDay },
  };
}

// Zet een gecontroleerde back-up terug. Ongeldige invoer laat alles ongemoeid.
export function importBackup(obj) {
  const res = validateBackup(obj);
  if (!res.ok) return res;
  const { settings, stats, unlocked, recentNotes, game, scribbleDay } = res.data;
  saveSettings(settings);
  saveStats(stats);
  saveUnlocked(unlocked);
  saveRecentNotes(recentNotes);
  if (game) saveGame(game); else clearGame();
  if (scribbleDay) saveScribbleDay(scribbleDay); else remove('scribble');
  return res;
}
