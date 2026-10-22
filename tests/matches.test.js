// Tijden in het schema zijn Nederlandse tijd; we testen dus ook in die tijdzone.
process.env.TZ = 'Europe/Amsterdam';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MATCHES, LAST_MATCH, matchOn, matchPhase, currentMatch, matchStart, matchEnd, isLate, shortOpponent } from '../js/matches.js';
import { generateWarmup, generateRecovery, levelById } from '../js/generator.js';
import { countSolutions } from '../js/solver.js';
import { logicalSolve } from '../js/techniques.js';

const at = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi);

test('het schema: geldige datums en tijden, gesorteerd, geen dubbele datums', () => {
  assert.equal(MATCHES.length, 16);
  const dates = MATCHES.map((m) => m.date);
  assert.equal(new Set(dates).size, dates.length, 'dubbele datum');
  assert.deepEqual([...dates].sort(), dates, 'op datum gesorteerd');
  for (const m of MATCHES) {
    assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(m.time, /^([01]\d|2[0-3]):[0-5]\d$/);
    const s = matchStart(m);
    // Bestaat de datum echt (geen 31 november)?
    assert.equal(`${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`, m.date);
    assert.equal(typeof m.home, 'boolean');
    assert.ok(m.opponent.length > 2);
  }
  assert.equal(LAST_MATCH.date, '2027-04-17');
});

test('matchOn: de wedstrijd van die dag, anders null', () => {
  assert.equal(matchOn(at(2026, 10, 22, 8)).opponent, 'DIO Bedum DS 7');
  assert.equal(matchOn(at(2026, 11, 28, 23, 59)).opponent, 'Kroton DS 5');
  assert.equal(matchOn(at(2026, 10, 23)), null);
  assert.equal(matchOn(at(2027, 1, 12)).time, '19:45');
});

test('fasen rond een gewone wedstrijd (za 31 oktober 17:00)', () => {
  assert.equal(matchPhase(at(2026, 10, 31, 0, 0)), 'voor', 'vanaf middernacht');
  assert.equal(matchPhase(at(2026, 10, 31, 16, 59)), 'voor', 'net voor aanvang');
  assert.equal(matchPhase(at(2026, 10, 31, 17, 0)), 'tijdens', 'aanvang');
  assert.equal(matchPhase(at(2026, 10, 31, 18, 59)), 'tijdens');
  assert.equal(matchPhase(at(2026, 10, 31, 19, 0)), 'na', 'aanvang + 2 uur');
  assert.equal(matchPhase(at(2026, 10, 31, 23, 59)), 'na');
  assert.equal(matchPhase(at(2026, 11, 1, 0, 30)), null, 'eindigt om 19:00, dus de volgende dag niets meer');
  assert.equal(isLate(MATCHES[1]), false);
});

test('de ochtendwedstrijd van 11:00 (za 28 november)', () => {
  assert.equal(matchPhase(at(2026, 11, 28, 9, 30)), 'voor');
  assert.equal(matchPhase(at(2026, 11, 28, 10, 59)), 'voor');
  assert.equal(matchPhase(at(2026, 11, 28, 11, 0)), 'tijdens');
  assert.equal(matchPhase(at(2026, 11, 28, 13, 0)), 'na');
  assert.equal(matchPhase(at(2026, 11, 29, 9, 0)), null);
});

test('de late wedstrijd van 21:00: "na" loopt door tot de volgende dag 12:00', () => {
  const dio = MATCHES[0];
  assert.equal(isLate(dio), true, 'eindigt om 23:00, na 22:30');
  assert.equal(matchPhase(at(2026, 10, 22, 20, 59)), 'voor');
  assert.equal(matchPhase(at(2026, 10, 22, 21, 0)), 'tijdens');
  assert.equal(matchPhase(at(2026, 10, 22, 22, 59)), 'tijdens');
  assert.equal(matchPhase(at(2026, 10, 22, 23, 0)), 'na');
  assert.equal(currentMatch(at(2026, 10, 23, 8, 0)).match, dio, 'de volgende ochtend nog over DIO Bedum');
  assert.equal(matchPhase(at(2026, 10, 23, 11, 59)), 'na');
  assert.equal(matchPhase(at(2026, 10, 23, 12, 0)), null);
  // De wedstrijd van 19:45 eindigt om 21:45: geen late wedstrijd.
  assert.equal(isLate(MATCHES[8]), false);
  assert.equal(matchPhase(at(2027, 1, 13, 8, 0)), null);
  // 21:00 in maart (Oranje Nassau) is ook laat.
  assert.equal(matchPhase(at(2027, 3, 21, 9, 0)), 'na');
});

test('overgang naar wintertijd (nacht van 24 op 25 oktober 2026)', () => {
  // Een verzonnen late wedstrijd die over de omschakeling heen loopt.
  const late = [{ date: '2026-10-24', time: '23:30', home: true, opponent: 'Test DS 1' }];
  const end = matchEnd(late[0]);
  assert.equal(`${end.getDate()} ${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`, '25 1:30', 'lokale tijd: aanvang + 2 uur');
  assert.equal(matchPhase(at(2026, 10, 25, 0, 30), late), 'tijdens', 'over middernacht heen');
  assert.equal(matchPhase(at(2026, 10, 25, 1, 30), late), 'na');
  assert.equal(matchPhase(at(2026, 10, 25, 2, 30), late), 'na', 'het uur dat twee keer voorkomt');
  assert.equal(matchPhase(at(2026, 10, 25, 11, 59), late), 'na');
  assert.equal(matchPhase(at(2026, 10, 25, 12, 0), late), null);
  // Een middagwedstrijd op de dag zelf rekent gewoon in lokale tijd.
  const day = [{ date: '2026-10-25', time: '14:00', home: true, opponent: 'Test DS 2' }];
  assert.equal(matchPhase(at(2026, 10, 25, 13, 59), day), 'voor');
  assert.equal(matchPhase(at(2026, 10, 25, 15, 59), day), 'tijdens');
  assert.equal(matchPhase(at(2026, 10, 25, 16, 0), day), 'na');
});

test('korte naam van de tegenstander', () => {
  assert.equal(shortOpponent(MATCHES[0]), 'DIO Bedum');
  assert.equal(shortOpponent({ opponent: 'Butiq / Set Uppers DS 8' }), 'Butiq / Set Uppers');
});

test('warming-up: kort, licht, uniek en vast per wedstrijd', () => {
  for (const m of MATCHES) {
    const p = generateWarmup(m.date);
    assert.equal(countSolutions(p.givens, 2), 1);
    assert.ok(p.clues >= 45 && p.clues <= 50, `${m.date}: ${p.clues} cijfers`);
    assert.equal(logicalSolve(p.givens).level, 1, 'alleen eenvoudige technieken');
    assert.equal(p.levelId, 'warmup');
    assert.deepEqual([p.match, p.matchKind], [m.date, 'warmup']);
    assert.deepEqual(generateWarmup(m.date).givens, p.givens, 'deterministisch');
  }
  assert.notDeepEqual(generateWarmup(MATCHES[0].date).givens, generateWarmup(MATCHES[1].date).givens);
});

test('herstelpuzzel: Zondagochtend-niveau, uniek en vast per wedstrijd, anders dan de warming-up', () => {
  for (const m of MATCHES) {
    const p = generateRecovery(m.date);
    assert.equal(countSolutions(p.givens, 2), 1);
    assert.equal(p.rating, 1);
    assert.ok(p.clues < generateWarmup(m.date).clues, 'minder gegeven dan de warming-up');
    assert.equal(p.levelId, 'herstel');
    assert.deepEqual(generateRecovery(m.date).givens, p.givens);
  }
  assert.equal(levelById('warmup').name, 'Warming-up');
  assert.equal(levelById('herstel').name, 'Herstelpuzzel');
});
