import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECIAL_DAYS, specialKindsOn, easter, kingsDay, monthsTogether, APP_GIFT, LAST_HOME_MATCH, MONTHSARY_LINES, specialLabel } from '../js/messages.js';
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
  assert.equal(specialDay(new Date(2027, 8, 26)).title, '1 jaar samen 💛');
  assert.match(specialDay(new Date(2030, 8, 26)).text, /4 jaar/);
  assert.equal(specialDay(new Date(2026, 8, 30)), null);
  assert.equal(daysTogether(new Date(2026, 9, 21)), 25);
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
  assert.equal(specialById('jubileum-2028').solvedText, specialDay(new Date(2028, 8, 26)).solvedText);
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

// ---------- Speciale dagen ----------

const at = (y, m, d) => new Date(y, m - 1, d, 12);

test('voorrang bij samenvallen ligt vast', () => {
  assert.deepEqual(SPECIAL_DAYS.map((s) => s.kind), [
    'jubileum', 'verjaardag', 'halfjaar', 'honderd', 'app-verjaardag', 'thuiswedstrijd',
    'valentijn', 'pasen', 'koningsdag', 'halloween', 'sinterklaas', 'kerst', 'tweede-kerstdag', 'nieuwjaar', 'maandversary']);
  // Pasen 2062 valt op 26 maart: half jaar gaat voor Pasen, en beide voor de maandversary.
  assert.deepEqual(specialKindsOn(at(2062, 3, 26)), ['halfjaar', 'pasen', 'maandversary']);
  assert.equal(specialDay(at(2062, 3, 26)).kind, 'halfjaar');
  // Een half jaar valt altijd op een 29e: dan geen maandversary.
  assert.equal(specialDay(at(2027, 3, 26)).kind, 'halfjaar');
  // Het jubileum (ook een 29e) gaat voor alles.
  assert.deepEqual(specialKindsOn(at(2027, 9, 26)), ['jubileum', 'maandversary']);
  assert.equal(specialDay(at(2027, 9, 26)).kind, 'jubileum');
});

test('jubileum en verjaardag blijven zoals ze waren', () => {
  const j = specialDay(at(2027, 9, 26));
  assert.deepEqual([j.id, j.title, j.shape, j.seed], ['jubileum-2027', '1 jaar samen 💛', 'heart', 290900 + 2027]);
  assert.equal(j.text, 'Vandaag zijn we precies één jaar samen. Elk jaar met jou is mijn favoriete puzzel. Deze is speciaal voor jou gemaakt, kijk maar goed naar de vorm 😉');
  assert.equal(j.solvedText, 'Gelukkig eenjarig jubileum, lieverd. Op nog heel veel jaren, puzzels en preitaartjes samen. Ik hou van je. 💛');
  assert.equal(specialDay(at(2026, 9, 26)).title, 'Vandaag begon het 💛');
  const v = specialDay(at(2027, 10, 12));
  assert.deepEqual([v.id, v.title, v.shape, v.seed], ['verjaardag-2027', 'Gefeliciteerd, 22 jaar! 🎂', 'heart', 121000 + 2027]);
  assert.match(v.text, /^Hiep hiep hoera, \S+.*! Vandaag ben je 22\./);
  assert.equal(v.solvedText, 'Van harte gefeliciteerd met je 22e verjaardag, mooiste meisje dat er is. Ik hoop dat je dag net zo zonnig is als jij 🎉💛');
  assert.deepEqual(j.celebrate, ['❤️', '💛', '💗', '💕']);
});

test('half jaar samen: elk jaar op 26 maart, met de juiste woorden', () => {
  assert.equal(specialDay(at(2026, 3, 26)), null, 'vóór het jubileum nog niet');
  assert.equal(specialDay(at(2027, 3, 26)).title, 'Een half jaar samen 💞');
  assert.equal(specialDay(at(2028, 3, 26)).title, 'Anderhalf jaar samen 💞');
  assert.equal(specialDay(at(2029, 3, 26)).title, 'Tweeënhalf jaar samen 💞');
  assert.equal(specialDay(at(2030, 3, 26)).title, 'Drieënhalf jaar samen 💞');
  assert.match(specialDay(at(2028, 3, 26)).text, /anderhalf jaar samen/);
  assert.equal(specialDay(at(2027, 3, 26)).shape, 'half-heart');
});

test('100 dagen samen: alleen op 4 januari 2027', () => {
  assert.equal(daysTogether(at(2027, 1, 4)), 100);
  assert.equal(specialDay(at(2027, 1, 4)).id, 'honderd-2027');
  assert.equal(specialDay(at(2027, 1, 4)).shape, 'balloon');
  for (const d of [at(2028, 1, 4), at(2027, 1, 3), at(2027, 1, 5)]) assert.ok(!specialKindsOn(d).includes('honderd'));
});

test('app-verjaardag: niet op 21-10-2026, wel op 21-10-2027, met haar eigen cijfers', () => {
  assert.deepEqual(APP_GIFT, { year: 2026, month: 10, day: 21 });
  assert.equal(specialDay(at(2026, 10, 21)), null);
  const s = specialDay(at(2027, 10, 21), { totalSolved: 247, bestStreak: 31 });
  assert.equal(s.title, "1 jaar Ruby's Sudoku 🎁");
  assert.match(s.text, /^1 jaar Ruby's Sudoku: 247 puzzels, langste reeks 31 dagen 🔥/);
  assert.equal(s.shape, 'gift');
  assert.match(specialDay(at(2029, 10, 21), { totalSolved: 1, bestStreak: 1 }).text, /^3 jaar Ruby's Sudoku: 1 puzzel, langste reeks 1 dag/);
  assert.ok(!/undefined|NaN/.test(specialDay(at(2027, 10, 21)).text), 'ook zonder stats een nette tekst');
});

test('laatste thuiswedstrijd: alleen op 17-4-2027', async () => {
  const s = specialDay(at(2027, 4, 17));
  assert.equal(s.kind, 'thuiswedstrijd');
  assert.equal(s.shape, 'volleyball');
  assert.equal(s.replacesWarmup, true);
  assert.match(s.text, /17:00/);
  assert.match(s.text, /LSV/);
  // 200 dagen samen is op 14 april: dan noemt het kaartje dat niet.
  assert.doesNotMatch(s.text, /200 dagen/);
  assert.equal(specialDay(at(2028, 4, 17)), null);
  // De constante moet de laatste thuiswedstrijd in het schema zijn.
  const { MATCHES } = await import('../js/matches.js');
  const home = MATCHES.filter((m) => m.home).at(-1);
  assert.deepEqual([home.date, home.time, home.opponent], [LAST_HOME_MATCH.date, LAST_HOME_MATCH.time, LAST_HOME_MATCH.opponent]);
});

test('Pasen (Meeus/Butcher) voor bekende jaren', () => {
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  for (const [y, want] of [[2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16'], [2038, '2038-04-25'], [2043, '2043-03-29']]) {
    assert.equal(key(easter(y)), want, String(y));
  }
  assert.equal(specialDay(at(2027, 3, 28)).kind, 'pasen');
  assert.equal(specialDay(at(2027, 3, 28)).shape, 'egg');
});

test('Koningsdag: 27 april, of 26 april als de 27e een zondag is', () => {
  assert.equal(kingsDay(2027).getDate(), 27);
  assert.equal(kingsDay(2025).getDate(), 26, '27 april 2025 is een zondag');
  assert.equal(specialDay(at(2025, 4, 26)).kind, 'koningsdag');
  assert.equal(specialDay(at(2025, 4, 27)), null);
  assert.deepEqual(specialDay(at(2027, 4, 27)).celebrate, ['🧡', '👑', '🎉']);
});

test('feestdagen: de juiste dag, figuur en teksten', () => {
  const cases = [
    [at(2027, 2, 14), 'valentijn', 'heart-arrow'], [at(2026, 10, 31), 'halloween', 'pumpkin'],
    [at(2026, 12, 5), 'sinterklaas', 'letter-r'], [at(2026, 12, 25), 'kerst', 'tree'],
    [at(2026, 12, 26), 'tweede-kerstdag', 'star'], [at(2027, 1, 1), 'nieuwjaar', 'fireworks'],
  ];
  for (const [d, kind, shape] of cases) {
    const s = specialDay(d);
    assert.deepEqual([s.kind, s.shape], [kind, shape]);
    assert.ok(s.title && s.text && s.solvedText && s.celebrate.length >= 3, kind);
  }
  assert.match(specialDay(at(2026, 12, 5)).text, /— de Sint/);
  assert.match(specialDay(at(2027, 1, 1)).title, /2027/);
  assert.match(specialDay(at(2031, 1, 1)).text + specialDay(at(2031, 1, 1)).solvedText, /2031/);
  assert.ok(specialDay(at(2026, 12, 26)).text.length < specialDay(at(2026, 12, 25)).text.length, 'tweede kerstdag is korter');
});

test('maandversary: elke 26e, alleen een kaartje', () => {
  const s = specialDay(at(2026, 11, 26));
  assert.deepEqual([s.id, s.title, s.shape], ['maandversary-2026-11-26', '2 maanden samen 💛', null]);
  assert.equal(specialDay(at(2026, 10, 26)).title, '1 maand samen 💛');
  assert.equal(specialDay(at(2026, 10, 29)), null, 'niet meer op de 29e');
  assert.equal(specialDay(at(2027, 2, 26)).kind, 'maandversary', 'ook in februari gewoon op de 26e');
  assert.equal(specialDay(at(2027, 2, 28)), null, 'en niet op de laatste dag van februari');
  assert.equal(monthsTogether(at(2027, 2, 26)), 5);
  assert.ok(MONTHSARY_LINES.length >= 12);
  for (const line of MONTHSARY_LINES) assert.match(line({ m: '7 maanden', n: 'Ruubs' }), /7 maanden/, 'elk zinnetje noemt het aantal maanden');
  // Vast per maand, en een andere zin dan de maand ervoor.
  assert.equal(specialDay(at(2027, 1, 26)).text, specialDay(at(2027, 1, 26)).text);
  assert.notEqual(specialDay(at(2027, 2, 26)).text, specialDay(at(2027, 1, 26)).text);
  assert.match(specialDay(at(2027, 1, 26)).text, /4 maanden/);
  // 3 maanden valt op Tweede kerstdag: die gaat voor.
  assert.deepEqual(specialKindsOn(at(2026, 12, 26)), ['tweede-kerstdag', 'maandversary']);
  assert.equal(specialDay(at(2026, 12, 26)).kind, 'tweede-kerstdag');
});

test('specialById herkent elke soort, ook na middernacht', () => {
  const days = [at(2027, 9, 26), at(2027, 10, 12), at(2027, 3, 26), at(2027, 1, 4), at(2027, 10, 21), at(2027, 4, 17),
    at(2027, 2, 14), at(2027, 3, 28), at(2027, 4, 27), at(2026, 10, 31), at(2026, 12, 5), at(2026, 12, 25), at(2026, 12, 26), at(2027, 1, 1), at(2026, 11, 26)];
  const kinds = new Set();
  for (const d of days) {
    const s = specialDay(d, { totalSolved: 5, bestStreak: 2 });
    const back = specialById(s.id, { totalSolved: 5, bestStreak: 2 });
    assert.deepEqual(back, s, s.id);
    kinds.add(s.kind);
    assert.ok(specialLabel(s.id).length > 3);
  }
  assert.equal(kinds.size, SPECIAL_DAYS.length, 'elke soort getest');
  assert.equal(specialById('kerst-2027').kind, 'kerst');
  assert.equal(specialById('honderd-2028'), null, 'die dag bestaat niet');
  assert.equal(specialById('app-verjaardag-2026'), null);
  assert.equal(specialById('maandversary-2026-11-28'), null);
  assert.equal(specialById('kerst-2026-12-25'), null);
});

test('teksten zijn vast per jaar en met een bijnaam', () => {
  for (const d of [at(2026, 12, 25), at(2027, 3, 28), at(2027, 2, 14)]) {
    assert.deepEqual(specialDay(d), specialDay(d));
  }
  const texts = [2026, 2027, 2028, 2029].map((y) => specialDay(at(y, 12, 25)).text);
  assert.ok(new Set(texts).size > 1, 'niet elk jaar dezelfde kersttekst');
  assert.ok(texts.some((t) => NICKNAMES.some((n) => t.includes(n))));
});
