import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, GREETINGS, WEEKDAY_GREETINGS, SUBTITLES, PART_SUBTITLES, subtitle, partOfDay, specialDay, specialById, daysTogether, loveNote, LOVE_NOTES, newMilestones, NICKNAMES, MILESTONES, nextMilestone, milestoneLine, milestoneBadge, humanDuration, recordLine, RECORD_LINES, FIRST_LEVEL_LINES, monthSummary, emptyDayLine, calendarRecordNote,
  PEPTALKS, peptalksFor, pickPeptalk, peptalkText, matchHeadline, duringLine, WARMUP_NOTES, warmupNote, OUTCOME_BUTTONS, OUTCOME_REPLIES, outcomeReply, RECOVERY_NOTES, recoveryNote } from '../js/messages.js';
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

test('tijdsverschil zoals je het zegt', () => {
  const cases = [
    [400, 'een tikje'], [1000, '1 seconde'], [12000, '12 seconden'], [59000, '59 seconden'],
    [60000, 'een minuut'], [80000, 'ruim een minuut'], [110000, 'bijna 2 min'], [120000, '2 min'],
    [150000, 'ruim 2 min'], [170000, 'bijna 3 min'], [3585000, 'bijna een uur'], [3570000, 'ruim 59 min'], [3600000, 'een uur'],
    [5400000, 'ruim een uur'], [7200000, '2 uur'], [-5, 'een tikje'],
  ];
  for (const [ms, want] of cases) assert.equal(humanDuration(ms), want, `${ms} ms`);
});

const koffie = { name: 'Koffie erbij', emoji: '☕' };

test('recordregel: warm, met het niveau en hoeveel sneller, in elke variant', () => {
  assert.ok(RECORD_LINES.length >= 4);
  for (let k = 0; k < RECORD_LINES.length; k++) {
    const rng = () => (k + 0.5) / RECORD_LINES.length;
    const line = recordLine({ level: koffie, elapsed: 300000, previousBest: 420000, firstOnLevel: false }, rng);
    assert.match(line, /Koffie erbij/);
    assert.match(line, /2 min/);
    assert.ok(!/undefined|null|NaN/.test(line), line);
    assert.match(line.charAt(0), /[A-Z0-9]/, `begint met een hoofdletter of getal: ${line}`);
  }
  assert.equal(recordLine({ level: koffie, elapsed: 300000, previousBest: 420000 }, () => 0),
    'Nieuw record op Koffie erbij! 2 min sneller dan je vorige beste ☕');
});

test('recordregel: niets bij langzamer of even snel, zacht bij de allereerste', () => {
  assert.equal(recordLine({ level: koffie, elapsed: 500000, previousBest: 420000, firstOnLevel: false }), '');
  assert.equal(recordLine({ level: koffie, elapsed: 420000, previousBest: 420000, firstOnLevel: false }), '');
  assert.equal(recordLine({ level: koffie, elapsed: 420000, previousBest: null, firstOnLevel: false }), '');
  for (let k = 0; k < FIRST_LEVEL_LINES.length; k++) {
    const line = recordLine({ level: { name: 'Even nadenken', emoji: '🤔' }, elapsed: 1, previousBest: null, firstOnLevel: true }, () => (k + 0.5) / FIRST_LEVEL_LINES.length);
    assert.match(line, /eerste Even nadenken/);
    assert.ok(!/sneller/.test(line));
  }
});

test('kalender: maandzinnetje, lege dag en recordnotitie', () => {
  assert.equal(monthSummary({ puzzles: 14, days: 9, current: true, month: 'oktober' }), 'Deze maand: 14 puzzels op 9 dagen 💛');
  assert.equal(monthSummary({ puzzles: 1, days: 1, current: false, month: 'september' }), 'In september: 1 puzzel op 1 dag 💛');
  assert.match(monthSummary({ puzzles: 0, days: 0, current: true, month: 'oktober' }), /Deze maand nog geen/);
  assert.match(monthSummary({ puzzles: 0, days: 0, current: false, month: 'augustus' }), /In augustus/);
  assert.match(emptyDayLine({ isToday: true }), /Vandaag/);
  assert.match(emptyDayLine({ future: true }), /nog komen/);
  assert.match(emptyDayLine({}), /Rustdagen/);
  assert.equal(calendarRecordNote('2026-10-22'), calendarRecordNote('2026-10-22'), 'vast per dag');
});

// ---------- Wedstrijddag ----------

import { MATCHES } from '../js/matches.js';
const dio = MATCHES[0]; // do 21:00 uit
const dovo = MATCHES[1]; // za 17:00 thuis
const kroton = MATCHES[5]; // za 11:00 uit

test('wedstrijdkop: wanneer, thuis of uit, en tegen wie', () => {
  assert.equal(matchHeadline(dio, 'voor'), 'Vanavond om 21:00 uit bij DIO Bedum 🏐');
  assert.equal(matchHeadline(dovo, 'voor'), 'Vanmiddag om 17:00 thuis tegen Dovo/Hujades 🏐');
  assert.equal(matchHeadline(kroton, 'voor'), 'Vanochtend om 11:00 uit bij Kroton 🏐');
  assert.match(matchHeadline(dovo, 'tijdens'), /^Nu bezig: thuis tegen/);
  assert.equal(matchHeadline(dio, 'na'), 'Uit bij DIO Bedum 🏐');
  assert.match(duringLine(dio), /📣/);
});

test('peptalks: 15 tot 20, met bijnamen, rugnummer 33, thuis/uit, ochtend/avond en een paar grappige', () => {
  assert.ok(PEPTALKS.length >= 15 && PEPTALKS.length <= 20);
  const all = MATCHES.flatMap((m) => peptalksFor(m).map((i) => peptalkText(i, m)));
  assert.ok(all.some((t) => /33/.test(t)), 'rugnummer 33');
  assert.ok(all.some((t) => NICKNAMES.some((n) => t.includes(n))), 'met bijnaam');
  for (const when of ['thuis', 'uit', 'ochtend', 'avond']) assert.ok(PEPTALKS.some((p) => p.when === when), when);
  for (const m of MATCHES) for (const i of peptalksFor(m)) {
    const t = peptalkText(i, m);
    assert.ok(!/undefined|null/.test(t), t);
  }
  // Alleen passende peptalks: geen thuispeptalk bij een uitwedstrijd, geen ochtendpeptalk 's avonds.
  const fits = (m) => peptalksFor(m).map((i) => PEPTALKS[i].when).filter(Boolean);
  assert.deepEqual([...new Set(fits(dio))].sort(), ['avond', 'uit']);
  assert.deepEqual([...new Set(fits(dovo))].sort(), ['thuis']);
  assert.deepEqual([...new Set(fits(kroton))].sort(), ['ochtend', 'uit']);
});

test('peptalk: niet dezelfde als bij de vorige wedstrijden', () => {
  const recent = peptalksFor(dio).slice(0, -1);
  assert.equal(pickPeptalk(dio, recent, () => 0), peptalksFor(dio).at(-1));
  // Alles al gehad: dan mag er toch weer eentje.
  assert.ok(peptalksFor(dio).includes(pickPeptalk(dio, peptalksFor(dio), () => 0.5)));
});

test('warming-up, uitkomsten en herstel: teksten voor elk geval, met variatie', () => {
  assert.ok(WARMUP_NOTES.length >= 3 && WARMUP_NOTES.includes('Hersens zijn warm, nu de armen nog 💪'));
  assert.ok(WARMUP_NOTES.includes(warmupNote(() => 0.99)));
  assert.deepEqual(OUTCOME_BUTTONS.map((b) => b.id), ['gewonnen', 'verloren', 'stil']);
  for (const id of ['gewonnen', 'verloren', 'stil']) {
    assert.ok(OUTCOME_REPLIES[id].length >= 3, id);
    assert.ok(RECOVERY_NOTES[id].length >= 3, id);
    assert.ok(OUTCOME_REPLIES[id].includes(outcomeReply(id, '2026-10-22')));
    assert.equal(outcomeReply(id, '2026-10-22'), outcomeReply(id, '2026-10-22'), 'vast per wedstrijd');
    assert.ok(RECOVERY_NOTES[id].includes(recoveryNote(id, () => 0.4)));
  }
  // Verloren: troostend en trots, nooit oppeppend-competitief.
  for (const t of [...OUTCOME_REPLIES.verloren, ...RECOVERY_NOTES.verloren]) {
    assert.doesNotMatch(t, /volgende keer|beter|winnen|harder|revanche/i, t);
  }
  // Zonder antwoord: de neutrale teksten.
  assert.ok(RECOVERY_NOTES.stil.includes(recoveryNote(undefined, () => 0)));
});

test('mijlpaal "Seizoen uitgespeeld" na de herstelpuzzel van de laatste wedstrijd', () => {
  const m = MILESTONES.find((x) => x.id === 'seizoen-uit');
  assert.ok(m);
  const base = { totalSolved: 1, levels: {}, matches: {} };
  assert.equal(m.check(base), false);
  assert.equal(m.check({ ...base, matches: { '2027-04-17': { warmup: true } } }), false);
  assert.equal(m.check({ ...base, matches: { '2027-04-17': { herstel: true } } }), true);
});
