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
