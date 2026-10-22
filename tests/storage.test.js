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
