import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapped, wrappedYearOn, wrappedYears, partOfHour, APP_START } from '../js/wrapped.js';
import { wrappedCards, WRAPPED_CARD_TITLE } from '../js/messages.js';
import { levelById } from '../js/generator.js';
import * as S from '../js/storage.js';

const e = (day, level = 'zondag', extra = {}) => ({ day, level, ms: 300000, hints: 0, daily: false, special: null, record: false, hour: 20, ...extra });
const cardIds = (w) => wrappedCards(w, levelById).map((c) => c.id);

test('lege data: alleen opening en afsluiter, geen fouten', () => {
  const w = wrapped([], 2027);
  assert.equal(w.puzzles, 0);
  assert.deepEqual([w.favorite, w.fastest, w.hours, w.busiestMonth], [null, null, null, null]);
  assert.deepEqual(cardIds(w), ['opening', 'afsluiter']);
  assert.deepEqual(cardIds(wrapped(undefined, 2027)), ['opening', 'afsluiter']);
});

test('één puzzel: puzzelkaart en snelste tijd, maar geen kaarten die meer data nodig hebben', () => {
  const w = wrapped([e('2027-03-04', 'koffie', { ms: 201000, hour: 8 })], 2027);
  assert.equal(w.puzzles, 1);
  assert.deepEqual(w.fastest, { level: 'koffie', ms: 201000, day: '2027-03-04' });
  assert.equal(w.favorite, null, 'te weinig voor een favoriet');
  assert.equal(w.hours, null, 'te weinig voor een puzzeluur');
  assert.equal(w.longestStreak, 1);
  assert.deepEqual(cardIds(w), ['opening', 'puzzels', 'snelste', 'afsluiter']);
  const texts = wrappedCards(w, levelById).map((c) => `${c.kicker} ${c.big} ${c.text}`).join(' ');
  assert.match(texts, /1 puzzel\b/);
  assert.match(texts, /3:21/);
  assert.match(texts, /Op naar 2028 💛/);
});

test('een vol jaar: alle kaarten met de juiste getallen', () => {
  const log = [];
  // Elke dag van april een koffie-puzzel 's avonds, plus op 10 april twee nadenken-puzzels 's ochtends.
  for (let d = 1; d <= 30; d++) log.push(e(`2027-04-${String(d).padStart(2, '0')}`, 'koffie', { ms: 400000 - d * 1000, hour: 21 }));
  log.push(e('2027-04-10', 'nadenken', { ms: 150000, hour: 9 }), e('2027-04-10', 'nadenken', { ms: 900000, hour: 9 }));
  log.push(e('2027-02-14', 'zondag', { special: 'valentijn-2027', hour: 22 }));
  log.push(e('2027-12-31', 'ruby', { hour: 23 }));
  log.push(e('2026-12-31', 'ruby', { hour: 23 }), e('2028-01-01', 'ruby', { hour: 0 })); // buiten het jaar
  const w = wrapped(log, 2027);
  assert.equal(w.puzzles, 34);
  assert.equal(w.partial, false);
  assert.deepEqual(w.favorite, { level: 'koffie', count: 30 });
  assert.deepEqual(w.fastest, { level: 'nadenken', ms: 150000, day: '2027-04-10' });
  assert.equal(w.longestStreak, 30);
  assert.equal(w.hours.peak, 21);
  assert.equal(w.hours.part, 'avond');
  assert.deepEqual(w.busiestMonth, { month: 3, count: 32 });
  assert.deepEqual(w.busiestDay, { day: '2027-04-10', count: 3 });
  assert.deepEqual(w.specials, ['valentijn-2027']);
  assert.equal(w.coffee, 17);
  assert.ok(w.cells > 34 * 40);
  assert.deepEqual(cardIds(w), ['opening', 'puzzels', 'favoriet', 'snelste', 'reeks', 'uur', 'maand', 'speciaal', 'koffie', 'afsluiter']);
  for (const c of wrappedCards(w, levelById)) assert.ok(!/undefined|null|NaN/.test(`${c.kicker} ${c.big} ${c.text}`), c.id);
});

test('het eerste jaar is gedeeltelijk: "sinds 21 oktober"', () => {
  assert.equal(APP_START, '2026-10-21');
  const w = wrapped([e('2026-10-21'), e('2026-11-02'), e('2026-12-24')], 2026);
  assert.equal(w.partial, true);
  assert.equal(w.since, '2026-10-21');
  const cards = wrappedCards(w, levelById);
  assert.match(cards[0].text, /sinds 21 oktober/);
  assert.match(cards.find((c) => c.id === 'puzzels').kicker, /Sinds 21 oktober/);
  assert.doesNotMatch(cards.map((c) => c.text).join(' '), /dit jaar/i);
  assert.equal(wrapped([e('2027-01-05')], 2027).partial, false);
});

test('de jaargrens: wanneer welke Wrapped klaarstaat', () => {
  const at = (y, m, d) => new Date(y, m - 1, d, 12);
  assert.equal(wrappedYearOn(at(2026, 12, 30)), null);
  assert.equal(wrappedYearOn(at(2026, 12, 31)), 2026);
  assert.equal(wrappedYearOn(at(2027, 1, 1)), 2026);
  assert.equal(wrappedYearOn(at(2027, 1, 7)), 2026);
  assert.equal(wrappedYearOn(at(2027, 1, 8)), null);
  // Bij statistieken: elk jaar vanaf 31 december, nieuwste eerst.
  assert.deepEqual(wrappedYears([2026, 2027, 2027], at(2027, 6, 1)), [2026]);
  assert.deepEqual(wrappedYears([2026, 2027], at(2027, 12, 31)), [2027, 2026]);
  // Een puzzel op oudjaarsavond na middernacht telt voor het nieuwe jaar.
  const log = [e('2026-12-31', 'zondag', { hour: 23 }), e('2027-01-01', 'zondag', { hour: 0 })];
  assert.equal(wrapped(log, 2026).puzzles, 1);
  assert.equal(wrapped(log, 2027).puzzles, 1);
});

test('puzzeluur: oude logboekregels zonder uur tellen niet mee voor het uur', () => {
  const log = [e('2027-05-01', 'zondag', { hour: null }), e('2027-05-02', 'zondag', { hour: null }), e('2027-05-03', 'zondag', { hour: 7 }), e('2027-05-04', 'zondag', { hour: 7 })];
  assert.equal(wrapped(log, 2027).hours, null, 'maar 2 met een uur');
  log.push(e('2027-05-05', 'zondag', { hour: 3 }));
  assert.equal(wrapped(log, 2027).hours.part, 'ochtend');
  assert.equal(partOfHour(23), 'avond');
  // Gelijkspel per uur: het drukste uur ligt in het drukste dagdeel (niet 11:00 bij een avondpuzzelaar).
  const tie = wrapped([11, 21, 22, 23, 20].map((h, k) => e(`2027-06-0${k + 1}`, 'zondag', { hour: h })), 2027).hours;
  assert.equal(tie.part, 'avond');
  assert.equal(partOfHour(tie.peak), 'avond');
  assert.equal(partOfHour(5), 'nacht');
});

test('teksten vast per jaar, en de kaart op het startscherm', () => {
  const w = wrapped([e('2027-03-01'), e('2027-03-02'), e('2027-03-03')], 2027);
  assert.deepEqual(wrappedCards(w, levelById), wrappedCards(w, levelById));
  assert.equal(WRAPPED_CARD_TITLE, 'Jouw jaar in puzzels ✨');
});

test('een eerder jaar blijft te bekijken, ook als het logboek het niet meer heeft', () => {
  const stats = S.emptyStats();
  const full = wrapped([e('2026-10-21'), e('2026-11-02'), e('2026-12-24')], 2026);
  assert.equal(S.rememberWrapped(stats, full), full);
  // Later is het logboek van 2026 opgeruimd: het bewaarde overzicht wint.
  const empty = wrapped([], 2026);
  assert.equal(S.rememberWrapped(stats, empty).puzzles, 3);
  // En het gaat mee door migratie (en dus de back-up), met alleen nette waarden.
  const again = S.migrateStats(JSON.parse(JSON.stringify(stats)));
  assert.deepEqual(again.wrapped[2026], stats.wrapped[2026]);
  assert.deepEqual(S.migrateStats({ wrapped: { 2026: { year: 2026, puzzles: '<img>' }, abc: {} } }).wrapped, {});
});
