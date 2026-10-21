import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, specialDay, specialById, daysTogether, loveNote, LOVE_NOTES, newMilestones, NICKNAMES, MILESTONES, nextMilestone, milestoneLine } from '../js/messages.js';
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

test('"Ik hou van je" is bewaard voor de 100e puzzel', () => {
  assert.ok(LOVE_NOTES.every((m) => !/hou van je/i.test(m)));
  assert.match(MILESTONES.find((m) => m.id === 'honderd').text, /Ik hou van je/);
  assert.ok(MILESTONES.filter((m) => m.id !== 'honderd').every((m) => !/hou van je/i.test(m.text)));
});

test('speciale dag terugvinden op id (ook na middernacht)', () => {
  assert.equal(specialById('verjaardag-2027').solvedText, specialDay(new Date(2027, 9, 12)).solvedText);
  assert.equal(specialById('jubileum-2028').solvedText, specialDay(new Date(2028, 8, 29)).solvedText);
  assert.equal(specialById('jubileum-2028').id, 'jubileum-2028');
  assert.equal(specialById('iets-anders'), null);
  assert.equal(specialById(null), null);
});

test('volgende mijlpaal: de dichtstbijzijnde die nog geheim is', () => {
  const st = emptyStats();
  assert.equal(nextMilestone(st, []).milestone.id, 'eerste');
  st.totalSolved = 3; st.dailySolved = 1; st.noHintSolved = 1; st.streak = 1; st.bestStreak = 1;
  const next = nextMilestone(st, ['eerste', 'dag1', 'zonderhint']);
  assert.equal(next.milestone.id, 'streak3');
  assert.equal(next.remaining, 2);
  assert.equal(milestoneLine(next), 'Nog 2 dagen op rij tot je volgende geheime berichtje 🔐');

  st.totalSolved = 9;
  const tien = nextMilestone(st, ['eerste', 'dag1', 'zonderhint']);
  assert.equal(tien.milestone.id, 'tien');
  assert.deepEqual([tien.current, tien.target], [9, 10]);
  assert.equal(milestoneLine(tien), 'Nog 1 puzzel tot je volgende geheime berichtje 🔐');

  st.streak = 0;
  st.totalSolved = 3;
  assert.equal(milestoneLine(nextMilestone(st, ['eerste', 'dag1', 'zonderhint', 'streak3'])), 'Nog 7 puzzels tot je volgende geheime berichtje 🔐');
});

test('volgende mijlpaal: niks meer te tellen, dan geen regeltje', () => {
  const st = emptyStats();
  assert.equal(nextMilestone(st, MILESTONES.map((m) => m.id)), null);
  // Alleen nog mijlpalen zonder voortgang over (Ruby-modus, zonder hints).
  const rest = MILESTONES.filter((m) => m.progress).map((m) => m.id);
  assert.equal(nextMilestone(st, rest), null);
  assert.equal(milestoneLine(null), '');
  assert.ok(!MILESTONES.find((m) => m.id === 'ruby').progress);
});

test('begroeting gebruikt geen bijnamen van 1–2 tekens', () => {
  const short = NICKNAMES.filter((n) => n.length < 3);
  assert.ok(short.length > 0, 'de lijst heeft korte bijnamen, zoals R');
  for (let k = 0; k < 100; k++) {
    const v = k / 100;
    for (const h of [3, 9, 15, 21]) {
      const g = greeting(new Date(2026, 9, 21, h), () => v);
      assert.ok(short.every((n) => !new RegExp(`\\b${n}\\b`).test(g)), g);
    }
  }
});
