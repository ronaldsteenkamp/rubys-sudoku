import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, GREETINGS, WEEKDAY_GREETINGS, SUBTITLES, PART_SUBTITLES, subtitle, partOfDay, specialDay, specialById, daysTogether, loveNote, LOVE_NOTES, newMilestones, NICKNAMES, MILESTONES, nextMilestone, milestoneLine, milestoneBadge } from '../js/messages.js';
import { emptyStats } from '../js/storage.js';

// Voorspelbare 'random' zodat de tests altijd hetzelfde doen.
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const longNicks = NICKNAMES.filter((n) => n.length >= 3);
const allTexts = [
  ...Object.values(GREETINGS).flat(), ...Object.values(WEEKDAY_GREETINGS).flat(),
].flatMap((f) => longNicks.map((n) => f(n))).concat(SUBTITLES, Object.values(PART_SUBTITLES).flat());

test('begroeting past bij het dagdeel (of de dag van de week)', () => {
  assert.equal(partOfDay(new Date(2026, 9, 21, 2)), 'nacht');
  assert.equal(partOfDay(new Date(2026, 9, 21, 8)), 'ochtend');
  assert.equal(partOfDay(new Date(2026, 9, 21, 14)), 'middag');
  assert.equal(partOfDay(new Date(2026, 9, 21, 21)), 'avond');
  const rng = seeded(42);
  for (const h of [2, 8, 14, 21]) {
    for (let day = 18; day <= 24; day++) {
      const date = new Date(2026, 9, day, h);
      const lists = [GREETINGS[partOfDay(date)], ...(h >= 6 ? [WEEKDAY_GREETINGS[date.getDay()] || []] : [])].flat();
      const allowed = new Set(lists.flatMap((f) => longNicks.map((n) => f(n))));
      for (let k = 0; k < 40; k++) {
        const g = greeting(date, rng);
        assert.ok(allowed.has(g), `${h}u op ${date.toDateString()}: ${g}`);
      }
    }
  }
  assert.ok(NICKNAMES.some((n) => greeting(new Date(), () => 0).includes(n)));
});

test('heel veel begroetingen en ondertitels, allemaal verschillend', () => {
  for (const [part, list] of Object.entries(GREETINGS)) assert.ok(list.length >= 12, part);
  assert.ok(SUBTITLES.length >= 50);
  for (const list of Object.values(PART_SUBTITLES)) assert.ok(list.length >= 4);
  const greetings = [...Object.values(GREETINGS).flat(), ...Object.values(WEEKDAY_GREETINGS).flat()].map((f) => f('X'));
  assert.equal(new Set(greetings).size, greetings.length, 'geen dubbele begroetingen');
  const subs = [...SUBTITLES, ...Object.values(PART_SUBTITLES).flat()];
  assert.equal(new Set(subs).size, subs.length, 'geen dubbele ondertitels');
  // Elke begroeting gebruikt de bijnaam, en blijft kort genoeg voor de grote kop.
  for (const f of [...Object.values(GREETINGS).flat(), ...Object.values(WEEKDAY_GREETINGS).flat()]) {
    assert.ok(f('BIJNAAM').includes('BIJNAAM'), f('X'));
    assert.ok(f('Gehaktballetje').length <= 46, f('Gehaktballetje'));
  }
});

test('ondertitel komt uit de algemene lijst of uit die van het dagdeel', () => {
  const rng = seeded(7);
  for (const h of [3, 9, 15, 20]) {
    const date = new Date(2026, 9, 21, h);
    const allowed = new Set([...SUBTITLES, ...PART_SUBTITLES[partOfDay(date)]]);
    for (let k = 0; k < 60; k++) assert.ok(allowed.has(subtitle(date, rng)));
  }
});

test('"Ik hou van je" staat ook niet in begroetingen en ondertitels', () => {
  assert.deepEqual(allTexts.filter((t) => /hou van je/i.test(t)), []);
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

test('rugnummer 33: dicht bij 32 puzzels, vrij bij 33', () => {
  const st = emptyStats();
  const before = ['eerste', 'dag1', 'zonderhint', 'tien', 'streak3', 'streak7', 'vijfentwintig'];
  st.totalSolved = 32;
  assert.deepEqual(newMilestones(st, before).map((m) => m.id), []);
  const next = nextMilestone(st, before);
  assert.equal(next.milestone.id, 'rugnummer33');
  assert.deepEqual([next.current, next.target, next.remaining], [32, 33, 1]);
  assert.equal(milestoneLine(next), 'Nog 1 puzzel tot je volgende geheime berichtje 🔐');

  st.totalSolved = 33;
  assert.deepEqual(newMilestones(st, before).map((m) => m.id), ['rugnummer33']);
  assert.deepEqual(newMilestones(st, [...before, 'rugnummer33']), []);
  // Daarna is 50 de volgende puzzelmijlpaal.
  assert.equal(nextMilestone(st, [...before, 'rugnummer33']).milestone.id, 'vijftig');

  // Na 25 telt het regeltje al af naar 33, niet naar 50.
  st.totalSolved = 26;
  assert.equal(milestoneLine(nextMilestone(st, before)), 'Nog 7 puzzels tot je volgende geheime berichtje 🔐');

  // Op de goede plek: na 25 (en de maand op rij), vóór 50.
  const ids = MILESTONES.map((m) => m.id);
  assert.ok(ids.indexOf('vijfentwintig') < ids.indexOf('rugnummer33') && ids.indexOf('rugnummer33') < ids.indexOf('vijftig'));
  const m = MILESTONES.find((x) => x.id === 'rugnummer33');
  assert.deepEqual([m.title, m.icon, m.hint], ['Rugnummer 33', '🏐', 'Los 33 puzzels op']);
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
  assert.equal(milestoneBadge(next), 'nog 2 dagen 🔐');
  assert.equal(milestoneBadge({ ...next, remaining: 1 }), 'nog 1 dag 🔐', 'het bolletje zegt waar het om gaat');

  st.totalSolved = 9;
  const tien = nextMilestone(st, ['eerste', 'dag1', 'zonderhint']);
  assert.equal(tien.milestone.id, 'tien');
  assert.deepEqual([tien.current, tien.target], [9, 10]);
  assert.equal(milestoneLine(tien), 'Nog 1 puzzel tot je volgende geheime berichtje 🔐');
  assert.equal(milestoneBadge(tien), 'nog 1 puzzel 🔐');

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
  assert.equal(milestoneBadge(null), '');
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
