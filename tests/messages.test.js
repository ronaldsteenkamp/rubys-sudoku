import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, specialDay, daysTogether, loveNote, LOVE_NOTES, newMilestones, NICKNAMES } from '../js/messages.js';
import { emptyStats } from '../js/storage.js';

test('begroeting past bij het dagdeel', () => {
  assert.match(greeting(new Date(2026, 9, 21, 8)), /morgen/);
  assert.match(greeting(new Date(2026, 9, 21, 14)), /middag|pauze/);
  assert.match(greeting(new Date(2026, 9, 21, 21)), /avond|bank/);
  assert.match(greeting(new Date(2026, 9, 21, 2)), /wakker|nachtuil/);
  assert.ok(NICKNAMES.some((n) => greeting(new Date(), () => 0).includes(n)));
});

test('jubileum telt elk jaar door', () => {
  assert.equal(specialDay(new Date(2027, 8, 29)).title, '1 jaar samen 💛');
  assert.match(specialDay(new Date(2030, 8, 29)).text, /4 jaar/);
  assert.equal(specialDay(new Date(2026, 8, 30)), null);
  assert.equal(daysTogether(new Date(2026, 9, 21)), 22);
});

test('verjaardag op 12 oktober met juiste leeftijd', () => {
  const s = specialDay(new Date(2027, 9, 12));
  assert.equal(s.kind, 'verjaardag');
  assert.match(s.title, /22 jaar/);
});

test('lief berichtje herhaalt niet direct', () => {
  const recent = LOVE_NOTES.slice(0, LOVE_NOTES.length - 1);
  assert.equal(loveNote(recent), LOVE_NOTES[LOVE_NOTES.length - 1]);
  assert.ok(LOVE_NOTES.length >= 10 && LOVE_NOTES.length <= 20);
});

test('mijlpalen ontgrendelen op het juiste moment', () => {
  const st = emptyStats();
  assert.deepEqual(newMilestones(st, []), []);
  st.totalSolved = 1; st.noHintSolved = 1;
  assert.deepEqual(newMilestones(st, []).map((m) => m.id), ['eerste', 'zonderhint']);
  assert.deepEqual(newMilestones(st, ['eerste', 'zonderhint']), []);
  st.levels.ruby = { solved: 1 }; st.bestStreak = 7; st.totalSolved = 10;
  assert.deepEqual(newMilestones(st, ['eerste', 'zonderhint']).map((m) => m.id), ['tien', 'streak3', 'streak7', 'ruby']);
});
