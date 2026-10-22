import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/storage.js';

class MemoryStorage {
  #m = new Map();
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null; }
  setItem(k, v) { this.#m.set(k, String(v)); }
  removeItem(k) { this.#m.delete(k); }
}

beforeEach(() => { globalThis.localStorage = new MemoryStorage(); });

test('instellingen met standaardwaarden', () => {
  assert.equal(S.loadSettings().errors, 'direct');
  S.saveSettings({ ...S.loadSettings(), theme: 'lelie' });
  assert.equal(S.loadSettings().theme, 'lelie');
  assert.equal(S.loadSettings().autoNotes, true);
});

test('werkt zonder (of met kapotte) opslag', () => {
  globalThis.localStorage = { getItem() { throw new Error('geblokkeerd'); }, setItem() { throw new Error('vol'); }, removeItem() { throw new Error('x'); } };
  assert.deepEqual(S.loadSettings(), S.DEFAULT_SETTINGS);
  assert.equal(S.saveGame({ a: 1 }), false);
  assert.doesNotThrow(() => S.clearGame());
  delete globalThis.localStorage;
  assert.equal(S.loadGame(), null);
});

test('statistieken: beste tijd, per niveau en zonder hints', () => {
  let st = S.emptyStats();
  S.recordStart(st, 'koffie');
  S.recordSolve(st, { levelId: 'koffie', elapsed: 300000, hints: 2 }, '2026-10-20');
  const { newBest } = S.recordSolve(st, { levelId: 'koffie', elapsed: 200000, hints: 0 }, '2026-10-20');
  assert.ok(newBest);
  assert.equal(st.levels.koffie.best, 200000);
  assert.equal(st.levels.koffie.solved, 2);
  assert.equal(st.totalSolved, 2);
  assert.equal(st.noHintSolved, 1);
  assert.equal(st.streak, 1, 'twee keer op één dag telt als één dag');
});

test('dagelijkse streak loopt op en breekt na een gemiste dag', () => {
  const st = S.emptyStats();
  const solve = (day) => S.recordSolve(st, { levelId: 'zondag', elapsed: 1000, hints: 0, daily: day }, day);
  solve('2026-10-18'); solve('2026-10-19'); solve('2026-10-20');
  assert.equal(st.streak, 3);
  assert.equal(st.dailySolved, 3);
  assert.equal(S.currentStreak(st, '2026-10-21'), 3);
  assert.equal(S.currentStreak(st, '2026-10-23'), 0);
  solve('2026-10-23');
  assert.equal(st.streak, 1);
  assert.equal(st.bestStreak, 3);
});

test('streak over een maandgrens', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'zondag', elapsed: 1, hints: 0 }, '2026-10-31');
  S.recordSolve(st, { levelId: 'zondag', elapsed: 1, hints: 0 }, '2026-11-01');
  assert.equal(st.streak, 2);
});

test('opgeloste dagpuzzel telt maar één keer mee en bewaart z\'n tijd', () => {
  const st = S.emptyStats();
  const first = S.recordSolve(st, { levelId: 'koffie', elapsed: 372000, hints: 1, daily: '2026-10-21' }, '2026-10-21');
  assert.equal(first.counted, true);
  assert.equal(st.dailyTimes['2026-10-21'], 372000);
  const again = S.recordSolve(st, { levelId: 'koffie', elapsed: 60000, hints: 0, daily: '2026-10-21' }, '2026-10-21');
  assert.equal(again.counted, false);
  assert.equal(again.newBest, false);
  assert.equal(st.totalSolved, 1);
  assert.equal(st.dailySolved, 1);
  assert.equal(st.noHintSolved, 0);
  assert.equal(st.levels.koffie.solved, 1);
  assert.equal(st.levels.koffie.best, 372000, 'geen nep-record');
  assert.equal(st.dailyTimes['2026-10-21'], 372000);
});

test('dagtijden blijven beperkt tot de bewaarde dagpuzzels', () => {
  const st = S.emptyStats();
  st.dailyDone = Array.from({ length: 60 }, (_, k) => `2020-01-${String(k).padStart(2, '0')}`);
  st.dailyTimes = { '2020-01-00': 1 };
  S.recordSolve(st, { levelId: 'zondag', elapsed: 5, hints: 0, daily: '2026-10-21' }, '2026-10-21');
  assert.deepEqual(st.dailyTimes, { '2026-10-21': 5 });
});

test('oude statistieken zonder dagtijden worden netjes aangevuld', () => {
  localStorage.setItem('rubys-sudoku:stats', JSON.stringify({ totalSolved: 4, dailyDone: ['2026-10-01'], levels: { zondag: { solved: 4 } } }));
  const st = S.loadStats();
  assert.equal(st.totalSolved, 4);
  assert.deepEqual(st.dailyDone, ['2026-10-01']);
  assert.deepEqual(st.dailyTimes, {});
  assert.equal(st.levels.zondag.solved, 4);
  assert.deepEqual(S.migrateStats({ dailyTimes: null, dailyDone: 'kapot' }).dailyDone, []);
  assert.deepEqual(S.migrateStats(null), S.emptyStats());
});

test('back-up: heen en terug levert dezelfde gegevens op', () => {
  S.saveSettings({ ...S.DEFAULT_SETTINGS, theme: 'lelie', sound: 'gitaar' });
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'koffie', elapsed: 1234, hints: 0, daily: '2026-10-21' }, '2026-10-21');
  S.saveStats(st);
  S.saveUnlocked(['eerste', 'dag1']);
  S.saveRecentNotes(['lief']);
  const game = { v: 1, givens: new Array(81).fill(0), solution: new Array(81).fill(1), levelId: 'zondag', elapsed: 42 };
  S.saveGame(game);

  const backup = JSON.parse(JSON.stringify(S.exportBackup(new Date(2026, 9, 21))));
  assert.equal(backup.app, 'rubys-sudoku');
  assert.equal(backup.version, 1);

  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.importBackup(backup).ok, true);
  assert.equal(S.loadSettings().theme, 'lelie');
  assert.equal(S.loadSettings().sound, 'gitaar');
  assert.deepEqual(S.loadStats(), st);
  assert.deepEqual(S.loadUnlocked(), ['eerste', 'dag1']);
  assert.deepEqual(S.loadRecentNotes(), ['lief']);
  assert.deepEqual(S.loadGame(), game);
});

test('back-up: ongeldige bestanden worden geweigerd en overschrijven niets', () => {
  S.saveSettings({ ...S.DEFAULT_SETTINGS, theme: 'nacht' });
  S.saveStats({ ...S.emptyStats(), totalSolved: 7 });
  S.saveUnlocked(['eerste']);
  const good = S.exportBackup();
  const bad = [
    null, 'tekst', [], {},
    { ...good, app: 'iets-anders' },
    { ...good, version: 99 },
    { ...good, data: null },
    { ...good, data: { ...good.data, stats: { totalSolved: 'veel' } } },
    { ...good, data: { ...good.data, unlocked: [1, 2] } },
    { ...good, data: { ...good.data, game: { v: 1, givens: [1, 2, 3] } } },
    { ...good, data: { ...good.data, game: { v: 1, givens: new Array(81).fill(0) } } }, // zonder oplossing
  ];
  for (const b of bad) {
    const res = S.importBackup(b);
    assert.equal(res.ok, false, JSON.stringify(b)?.slice(0, 60));
    assert.equal(typeof res.reason, 'string');
  }
  assert.equal(S.loadSettings().theme, 'nacht');
  assert.equal(S.loadStats().totalSolved, 7);
  assert.deepEqual(S.loadUnlocked(), ['eerste']);
});

test('back-up: onbekende of verkeerde instellingen vallen terug op standaard', () => {
  const b = S.makeBackup({ settings: { theme: 'zonnig', errors: 5, hack: true }, stats: S.emptyStats(), unlocked: [], recentNotes: [], game: null });
  const res = S.validateBackup(b);
  assert.equal(res.ok, true);
  assert.equal(res.data.settings.theme, 'zonnig');
  assert.equal(res.data.settings.errors, 'direct');
  assert.equal('hack' in res.data.settings, false);
});

test('back-up: seizoensvoortgang en ontgrendelde thema\'s gaan mee', () => {
  S.saveStats({ ...S.emptyStats(), totalSolved: 4, seasonSolves: { 'herfst-2026': 3, 'winter-2026': 1 }, unlockedThemes: ['herfst'] });
  S.saveSettings({ ...S.DEFAULT_SETTINGS, theme: 'herfst' });
  const backup = JSON.parse(JSON.stringify(S.exportBackup()));
  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.importBackup(backup).ok, true);
  assert.deepEqual(S.loadStats().seasonSolves, { 'herfst-2026': 3, 'winter-2026': 1 });
  assert.deepEqual(S.loadStats().unlockedThemes, ['herfst']);
  assert.equal(S.loadSettings().theme, 'herfst');
});

test('krabbeltje in Briefje: één keer per dag, en het gaat mee in de back-up', () => {
  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.loadScribbleDay(), null);
  assert.equal(S.scribbleDue(S.loadScribbleDay(), '2026-10-22'), true);
  S.saveScribbleDay('2026-10-22');
  assert.equal(S.scribbleDue(S.loadScribbleDay(), '2026-10-22'), false);
  assert.equal(S.scribbleDue(S.loadScribbleDay(), '2026-10-23'), true);

  const backup = JSON.parse(JSON.stringify(S.exportBackup()));
  assert.equal(backup.data.scribbleDay, '2026-10-22');
  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.importBackup(backup).ok, true);
  assert.equal(S.loadScribbleDay(), '2026-10-22');

  // Een oudere back-up zonder krabbeltje (of met onzin) zet het terug op 'nog niet geweest'.
  const old = { ...backup, data: { ...backup.data } };
  delete old.data.scribbleDay;
  assert.equal(S.importBackup(old).ok, true);
  assert.equal(S.loadScribbleDay(), null);
  assert.equal(S.importBackup({ ...backup, data: { ...backup.data, scribbleDay: 42 } }).ok, true);
  assert.equal(S.loadScribbleDay(), null);
});

test('geluid: de oude schakelaar wordt een geluidsstijl, ook in een oude back-up', () => {
  assert.equal(S.loadSettings().sound, 'zacht', 'standaard');
  for (const [old, now] of [[true, 'zacht'], [false, 'uit'], ['gitaar', 'gitaar'], ['trompet', 'zacht'], [7, 'zacht']]) {
    globalThis.localStorage.setItem('rubys-sudoku:settings', JSON.stringify({ theme: 'lelie', sound: old }));
    assert.equal(S.loadSettings().sound, now, String(old));
    assert.equal(S.loadSettings().theme, 'lelie');
  }
  // Een back-up van vóór de geluidsstijlen.
  const b = S.makeBackup({ settings: { theme: 'zonnig', sound: false }, stats: S.emptyStats(), unlocked: [], recentNotes: [], game: null });
  assert.equal(S.validateBackup(b).data.settings.sound, 'uit');
  const b2 = S.makeBackup({ settings: { theme: 'zonnig', sound: true }, stats: S.emptyStats(), unlocked: [], recentNotes: [], game: null });
  assert.equal(S.validateBackup(b2).data.settings.sound, 'zacht');
  const b3 = S.makeBackup({ settings: { theme: 'zonnig', sound: 'gitaar' }, stats: S.emptyStats(), unlocked: [], recentNotes: [], game: null });
  assert.equal(S.importBackup(b3).ok, true);
  assert.equal(S.loadSettings().sound, 'gitaar');
});

const validGame = () => ({ v: 1, givens: new Array(81).fill(0), solution: new Array(81).fill(1), levelId: 'zondag' });

test('een kapotte puzzel in de opslag telt als geen puzzel en wordt opgeruimd', () => {
  globalThis.localStorage.setItem('rubys-sudoku:game', JSON.stringify({ v: 1, givens: new Array(81).fill(0) }));
  assert.equal(S.loadGame(), null);
  assert.equal(globalThis.localStorage.getItem('rubys-sudoku:game'), null);
  S.saveGame(validGame());
  assert.deepEqual(S.loadGame(), validGame());
});

test('kapotte JSON wordt bewaard onder -kapot in plaats van later overschreven', () => {
  globalThis.localStorage.setItem('rubys-sudoku:stats', '{"totalSolved":12,');
  assert.equal(S.loadStats().totalSolved, 0);
  assert.equal(globalThis.localStorage.getItem('rubys-sudoku:stats-kapot'), '{"totalSolved":12,');
  S.saveStats(S.emptyStats());
  assert.equal(globalThis.localStorage.getItem('rubys-sudoku:stats-kapot'), '{"totalSolved":12,');
});

test('statistieken: elk veld wordt een net getal of een nette datum (ook tegen HTML in een back-up)', () => {
  const s = S.migrateStats({
    totalSolved: '<img src=x onerror=alert(1)>', streak: '5', bestStreak: -3, dailySolved: 2.7, noHintSolved: null,
    lastSolvedDay: 'morgen', dailyDone: ['2026-10-01', 7, '<b>'], specialDone: [1],
    dailyTimes: { '2026-10-01': 1000, '2026-10-02': 'snel' }, seasonSolves: { 'herfst-2026': 2, x: '<i>' },
    levels: { zondag: 5, koffie: { played: '<img>', solved: 3, best: 'snel', totalTime: 9000 }, __proto__: { played: 1 } },
    unlockedThemes: ['herfst', 'nep'],
  });
  assert.equal(s.totalSolved, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 0);
  assert.equal(s.dailySolved, 2);
  assert.equal(s.noHintSolved, 0);
  assert.equal(s.lastSolvedDay, null);
  assert.deepEqual(s.dailyDone, ['2026-10-01']);
  assert.deepEqual(s.specialDone, []);
  assert.deepEqual(s.dailyTimes, { '2026-10-01': 1000 });
  assert.deepEqual(s.seasonSolves, { 'herfst-2026': 2 });
  assert.deepEqual(s.levels, { koffie: { played: 0, solved: 3, best: null, totalTime: 9000 } });
  assert.deepEqual(s.unlockedThemes, ['herfst']);
  // Een niveau dat geen object was, laat het starten van dat niveau niet meer vastlopen.
  assert.doesNotThrow(() => S.recordStart(s, 'zondag'));
});

test('berichtjes in de opslag zijn altijd een lijst met teksten', () => {
  globalThis.localStorage.setItem('rubys-sudoku:unlocked', JSON.stringify({ eerste: true }));
  assert.deepEqual(S.loadUnlocked(), []);
  globalThis.localStorage.setItem('rubys-sudoku:recent-notes', JSON.stringify(['lief', 3]));
  assert.deepEqual(S.loadRecentNotes(), ['lief']);
});

test('instellingen met een verkeerd type vallen terug op standaard', () => {
  globalThis.localStorage.setItem('rubys-sudoku:settings', JSON.stringify({ theme: 5, errors: 'uit', autoNotes: 'ja' }));
  const s = S.loadSettings();
  assert.equal(s.theme, 'zonnig');
  assert.equal(s.errors, 'uit');
  assert.equal(s.autoNotes, true);
});

test('terugzetten bewaart de stand van daarvoor, en dat is weer terug te draaien', () => {
  S.saveStats({ ...S.emptyStats(), totalSolved: 150, bestStreak: 40 });
  S.saveUnlocked(['eerste', 'honderd']);
  const old = S.makeBackup({ settings: S.DEFAULT_SETTINGS, stats: { ...S.emptyStats(), totalSolved: 2 }, unlocked: [], recentNotes: [], game: null });
  assert.equal(S.loadPreviousBackup(), null);
  assert.equal(S.importBackup(old).ok, true);
  assert.equal(S.loadStats().totalSolved, 2);
  assert.equal(S.loadPreviousBackup().data.stats.totalSolved, 150);

  assert.equal(S.restorePrevious().ok, true);
  assert.equal(S.loadStats().totalSolved, 150);
  assert.equal(S.loadStats().bestStreak, 40);
  assert.deepEqual(S.loadUnlocked(), ['eerste', 'honderd']);
  // En weer andersom: heen en weer kan.
  assert.equal(S.loadPreviousBackup().data.stats.totalSolved, 2);
});

test('foutenlogboek: alleen de laatste 20, en ze gaan mee in de back-up', () => {
  for (let i = 0; i < 25; i++) S.logError(`fout ${i}`, new Date(2026, 9, 22));
  const errors = S.loadErrors();
  assert.equal(errors.length, 20);
  assert.match(errors.at(-1), /fout 24$/);
  assert.equal(S.exportBackup().data.errors.length, 20);
  // Bij terugzetten doen ze niets.
  assert.equal(S.validateBackup(S.exportBackup()).ok, true);
});

test('dagpuzzel van gisteravond die na middernacht af is, houdt de reeks heel', () => {
  const st = { ...S.emptyStats(), streak: 5, bestStreak: 5, lastSolvedDay: '2026-10-21' };
  // Begonnen op 22 oktober om 23:58, opgelost op 23 oktober om 00:03.
  S.recordSolve(st, { levelId: 'koffie', elapsed: 1, hints: 0, daily: '2026-10-22', started: '2026-10-22' }, '2026-10-23');
  assert.equal(st.streak, 7, '22 en 23 oktober tellen allebei');
  assert.equal(st.lastSolvedDay, '2026-10-23');
  assert.ok(st.dailyDone.includes('2026-10-22'));
  // Ook een gewone puzzel die gisteren begon.
  const st2 = { ...S.emptyStats(), streak: 2, lastSolvedDay: '2026-10-21' };
  S.recordSolve(st2, { levelId: 'zondag', elapsed: 1, hints: 0, started: '2026-10-22' }, '2026-10-23');
  assert.equal(st2.streak, 4);
});

test('de reeks gaat nooit achteruit en loopt niet vast op een datum in de toekomst', () => {
  const st = { ...S.emptyStats(), streak: 4, bestStreak: 4, lastSolvedDay: '2026-10-22' };
  // Een puzzel die al dagen geleden begon, verandert niets aan wat al geteld is.
  S.recordSolve(st, { levelId: 'zondag', elapsed: 1, hints: 0, started: '2026-10-10' }, '2026-10-22');
  assert.equal(st.streak, 4);
  // De klok stond even vooruit (laatste dag in de toekomst): de reeks blijft staan en telt gewoon door.
  const fut = { ...S.emptyStats(), streak: 3, bestStreak: 3, lastSolvedDay: '2027-09-29' };
  assert.equal(S.currentStreak(fut, '2026-10-22'), 3);
  S.recordSolve(fut, { levelId: 'zondag', elapsed: 1, hints: 0 }, '2026-10-22');
  assert.equal(fut.lastSolvedDay, '2026-10-22');
  assert.equal(fut.streak, 3);
  S.recordSolve(fut, { levelId: 'zondag', elapsed: 1, hints: 0 }, '2026-10-23');
  assert.equal(fut.streak, 4);
});

test('met een testdatum gaat alles naar een aparte opslag', () => {
  S.saveStats({ ...S.emptyStats(), totalSolved: 12 });
  S.useTestStorage();
  try {
    assert.equal(S.loadStats().totalSolved, 0);
    S.saveStats({ ...S.emptyStats(), totalSolved: 1 });
    assert.equal(JSON.parse(globalThis.localStorage.getItem('rubys-sudoku:stats')).totalSolved, 12);
    assert.equal(JSON.parse(globalThis.localStorage.getItem('rubys-sudoku-test:stats')).totalSolved, 1);
  } finally {
    S.useTestStorage(false);
  }
});

// ---------- Logboek (kalender) en records ----------

test('logboek: elke meegetelde puzzel komt erin, met niveau, tijd, hints, dagpuzzel en speciaal', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'koffie', elapsed: 402400, hints: 1, daily: '2026-10-21' }, '2026-10-21');
  S.recordSolve(st, { levelId: 'zondag', elapsed: 241000, hints: 0 }, '2026-10-22');
  S.recordSolve(st, { levelId: 'nadenken', elapsed: 900000, hints: 2, special: 'verjaardag-2026' }, '2026-10-22');
  // Een dagpuzzel die al is opgelost, telt niet en komt er dus ook niet in.
  S.recordSolve(st, { levelId: 'koffie', elapsed: 1000, hints: 0, daily: '2026-10-21' }, '2026-10-22');
  assert.deepEqual(S.logEntries(st), [
    { day: '2026-10-21', level: 'koffie', ms: 402000, hints: 1, daily: true, record: false, special: null, hour: null },
    { day: '2026-10-22', level: 'zondag', ms: 241000, hints: 0, daily: false, record: false, special: null, hour: null },
    { day: '2026-10-22', level: 'nadenken', ms: 900000, hints: 2, daily: false, record: false, special: 'verjaardag-2026', hour: null },
  ]);
  // Compact opgeslagen.
  assert.deepEqual(st.log[0], ['2026-10-21', 'koffie', 402, 1, 1]);
});

test('logboek: een dagpuzzel van gisteravond die na middernacht af is, staat op de dag van de puzzel', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'koffie', elapsed: 1000, hints: 0, daily: '2026-10-22', started: '2026-10-22' }, '2026-10-23');
  assert.equal(S.logEntries(st)[0].day, '2026-10-22');
});

test('logboek: begrensd op ruim twee jaar en hooguit LOG_MAX puzzels, de oudste eruit', () => {
  const st = S.emptyStats();
  st.log = [['2023-01-01', 'zondag', 100, 0, 0]];
  for (let i = 0; i < S.LOG_MAX + 20; i++) st.log.push(['2026-10-01', 'zondag', i, 0, 0]);
  S.recordSolve(st, { levelId: 'zondag', elapsed: 5000, hints: 0 }, '2026-10-22');
  assert.equal(st.log.length, S.LOG_MAX);
  assert.ok(st.log.every((r) => r[0] >= '2024-08-13'), 'niets ouder dan LOG_DAYS dagen');
  assert.deepEqual(st.log.at(-1), ['2026-10-22', 'zondag', 5, 0, 0], 'de nieuwste blijft');
  assert.equal(st.log[0][2], 21, 'de oudste gingen eruit');
  // Klein genoeg voor localStorage: een vol logboek blijft onder de 80 KB.
  assert.ok(JSON.stringify(st.log).length < 80000);
});

test('logboek: oude statistieken zonder logboek krijgen er een uit de bekende dagpuzzels', () => {
  const s = S.migrateStats({ totalSolved: 3, levels: {}, dailyDone: ['2026-10-01', '2026-10-03'], dailyTimes: { '2026-10-03': 402000 } });
  assert.deepEqual(S.logEntries(s), [
    { day: '2026-10-01', level: null, ms: null, hints: null, daily: true, record: false, special: null, hour: null },
    { day: '2026-10-03', level: null, ms: 402000, hints: null, daily: true, record: false, special: null, hour: null },
  ]);
  assert.deepEqual(S.migrateStats({}).log, []);
  // Bestaat het logboek al, dan komen de dagpuzzels er niet nog eens bij.
  const again = S.migrateStats(JSON.parse(JSON.stringify(s)));
  assert.equal(again.log.length, 2);
});

test('logboek: kapotte regels gaan eruit, de rest blijft (gesorteerd)', () => {
  const s = S.migrateStats({
    levels: {},
    log: [
      ['2026-10-05', 'koffie', 300, 0, 1], 'kapot', ['morgen', 'koffie', 1, 0, 0], ['2026-10-01', '<img>', 1, 0, 0],
      ['2026-10-02', 'zondag', -5, 0, 0], ['2026-10-02', 'zondag', 10, 1.5, 0], ['2026-10-02', 'zondag', 10, 0, 9],
      ['2026-10-02', 'zondag', 10, 0, 0, 'nep'], ['2026-10-03', null, null, null, 1], ['2026-10-04', 'zondag', 60, 0, 2, 'jubileum-2026'],
    ],
  });
  assert.deepEqual(s.log, [['2026-10-03', null, null, null, 1], ['2026-10-04', 'zondag', 60, 0, 2, 'jubileum-2026'], ['2026-10-05', 'koffie', 300, 0, 1]]);
});

test('logboek: gaat mee in de back-up en komt terug; oude back-ups zonder logboek blijven werken', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'koffie', elapsed: 402000, hints: 0, daily: '2026-10-21' }, '2026-10-21');
  S.saveStats(st);
  const backup = JSON.parse(JSON.stringify(S.exportBackup()));
  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.importBackup(backup).ok, true);
  assert.deepEqual(S.loadStats().log, st.log);

  const old = JSON.parse(JSON.stringify(backup));
  delete old.data.stats.log;
  const res = S.validateBackup(old);
  assert.equal(res.ok, true);
  assert.equal(res.data.stats.log.length, 1, 'uit de dagpuzzels van de oude back-up');
});

test('records: previousBest en firstOnLevel, en het record staat in het logboek', () => {
  const st = S.emptyStats();
  const first = S.recordSolve(st, { levelId: 'koffie', elapsed: 400000, hints: 0 }, '2026-10-20');
  assert.equal(first.previousBest, null);
  assert.equal(first.firstOnLevel, true);
  const slower = S.recordSolve(st, { levelId: 'koffie', elapsed: 500000, hints: 0 }, '2026-10-21');
  assert.deepEqual([slower.newBest, slower.previousBest, slower.firstOnLevel], [false, 400000, false]);
  const faster = S.recordSolve(st, { levelId: 'koffie', elapsed: 280000, hints: 0 }, '2026-10-22');
  assert.deepEqual([faster.newBest, faster.previousBest, faster.firstOnLevel], [true, 400000, false]);
  assert.deepEqual(S.logEntries(st).map((e) => e.record), [false, false, true], 'de allereerste is nog geen record');
  // Oude stats met wel een aantal maar geen beste tijd: niet "de allereerste".
  const old = S.migrateStats({ levels: { ruby: { played: 3, solved: 2, best: null, totalTime: 0 } } });
  assert.equal(S.recordSolve(old, { levelId: 'ruby', elapsed: 1, hints: 0 }, '2026-10-22').firstOnLevel, false);
});

// ---------- Wedstrijddagen ----------

test('wedstrijdpuzzels tellen mee als gewone puzzel, één keer per wedstrijd, en niet als dagpuzzel', () => {
  const st = S.emptyStats();
  const warm = { levelId: 'warmup', elapsed: 60000, hints: 0, match: { date: '2026-11-28', kind: 'warmup' } };
  assert.equal(S.recordSolve(st, warm, '2026-11-28').counted, true);
  assert.equal(S.recordSolve(st, warm, '2026-11-28').counted, false, 'nog eens: telt niet');
  S.recordSolve(st, { levelId: 'herstel', elapsed: 200000, hints: 1, match: { date: '2026-11-28', kind: 'herstel' } }, '2026-11-28');
  assert.equal(st.totalSolved, 2);
  assert.equal(st.dailySolved, 0);
  assert.deepEqual(st.dailyDone, []);
  assert.equal(st.streak, 1);
  assert.deepEqual(st.matches['2026-11-28'], { warmup: true, herstel: true });
  assert.deepEqual(S.logEntries(st).map((e) => e.level), ['warmup', 'herstel']);
});

test('wedstrijddag: uitslag en peptalk bewaren; alleen wat zij zelf kiest', () => {
  const st = S.emptyStats();
  S.setMatchOutcome(st, '2026-11-28', 'verloren');
  S.setMatchOutcome(st, '2026-11-28', '3-0'); // geen geldige keuze: verandert niets
  S.setMatchPeptalk(st, '2026-11-28', 4);
  S.setMatchPeptalk(st, '2026-12-12', 9);
  assert.deepEqual(st.matches['2026-11-28'], { uitslag: 'verloren', pep: 4 });
  assert.deepEqual(S.recentPeptalks(st), [4, 9]);
});

test('wedstrijddagen: kapotte gegevens worden opgeruimd, oude stats zonder wedstrijden werken, en ze gaan mee in de back-up', () => {
  const s = S.migrateStats({
    levels: {},
    matches: {
      '2026-11-28': { uitslag: 'verloren', warmup: true, herstel: 'ja', pep: 3, extra: '<img>' },
      morgen: { uitslag: 'gewonnen' }, '2026-12-12': 'kapot', '2027-01-09': { uitslag: 'gelijk', pep: -1 },
    },
  });
  assert.deepEqual(s.matches, { '2026-11-28': { uitslag: 'verloren', warmup: true, pep: 3 }, '2027-01-09': {} });
  assert.deepEqual(S.migrateStats({}).matches, {});

  const st = S.emptyStats();
  S.setMatchOutcome(st, '2026-11-28', 'gewonnen');
  S.saveStats(st);
  const backup = JSON.parse(JSON.stringify(S.exportBackup()));
  globalThis.localStorage = new MemoryStorage();
  assert.equal(S.importBackup(backup).ok, true);
  assert.equal(S.loadStats().matches['2026-11-28'].uitslag, 'gewonnen');
});

test('logboek: het uur van oplossen gaat mee; oude regels zonder uur krijgen een nette lege waarde', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'zondag', elapsed: 241000, hints: 0, hour: 23 }, '2026-12-31');
  S.recordSolve(st, { levelId: 'koffie', elapsed: 300000, hints: 0, special: 'kerst-2026', hour: 9 }, '2026-12-31');
  assert.deepEqual(st.log, [['2026-12-31', 'zondag', 241, 0, 0, null, 23], ['2026-12-31', 'koffie', 300, 0, 0, 'kerst-2026', 9]]);
  assert.deepEqual(S.logEntries(st).map((e) => e.hour), [23, 9]);
  // Oude regels: zonder uur (en zonder speciale dag) blijven ze kort, en het uur is null.
  const s = S.migrateStats({ levels: {}, log: [['2026-10-22', 'zondag', 60, 0, 0], ['2026-10-23', 'zondag', 60, 0, 0, 'kerst-2026'], ['2026-10-24', 'zondag', 60, 0, 0, null, 25], ['2026-10-25', 'zondag', 60, 0, 0, null, 7]] });
  assert.deepEqual(s.log, [['2026-10-22', 'zondag', 60, 0, 0], ['2026-10-23', 'zondag', 60, 0, 0, 'kerst-2026'], ['2026-10-25', 'zondag', 60, 0, 0, null, 7]]);
  assert.deepEqual(S.logEntries(s).map((e) => e.hour), [null, null, 7]);
});
