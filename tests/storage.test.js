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
