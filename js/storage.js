// Alles in localStorage, altijd met try/catch: in een privévenster of met
// geblokkeerde opslag werkt de app gewoon door, alleen zonder geheugen.

const PREFIX = 'rubys-sudoku:';

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
  };
}

// Maakt oude (of half kapotte) statistieken weer compleet. Oude dagpuzzels
// hebben nog geen tijd; die blijven gewoon in dailyDone staan.
export function migrateStats(raw) {
  const s = { ...emptyStats(), ...(raw && typeof raw === 'object' ? raw : {}) };
  for (const k of ['dailyDone', 'specialDone']) if (!Array.isArray(s[k])) s[k] = [];
  for (const k of ['levels', 'dailyTimes']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
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

// ---------- Puzzelvoorraad (zodat een nieuwe puzzel meteen klaarstaat) ----------

export const loadStash = () => read('stash', {});
export const saveStash = (s) => write('stash', s);

// ---------- "Zet op beginscherm"-kaartje ----------

export const loadInstallSnooze = () => read('install-snooze', 0);
export const saveInstallSnooze = (until) => write('install-snooze', until);
