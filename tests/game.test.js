import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGrid, bit } from '../js/solver.js';
import { Game } from '../js/game.js';
import { EASY, EASY_SOLUTION } from './fixtures.js';

const newGame = () => new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION), levelId: 'zondag' });
const sol = parseGrid(EASY_SOLUTION);

test('gegeven cijfers zijn niet aan te passen', () => {
  const g = newGame();
  assert.equal(g.setDigit(2, 5).changed, false);
  assert.equal(g.erase(2).changed, false);
});

test('cijfer zetten, fout herkennen en weer weghalen', () => {
  const g = newGame();
  assert.equal(g.setDigit(0, sol[0]).wrong, false);
  const r = g.setDigit(1, 1);
  assert.equal(r.wrong, true);
  assert.equal(g.mistakes, 1);
  assert.ok(g.isWrong(1));
  assert.equal(g.setDigit(1, 1).removed, true);
  assert.equal(g.values[1], 0);
});

test('een fout die ze (nog) niet te zien krijgt, telt niet als fout; een vol bord herkennen', () => {
  const g = newGame();
  assert.equal(g.setDigit(1, 1, { countMistake: false }).wrong, true);
  assert.equal(g.mistakes, 0);
  assert.equal(g.isFull(), false);
  for (let i = 0; i < 81; i++) if (!g.values[i]) g.setDigit(i, sol[i]);
  assert.equal(g.isFull(), true);
  assert.equal(g.isSolved(), false);
});

test('notities aan/uit en automatisch wegstrepen', () => {
  const g = newGame();
  g.toggleNote(1, 4); g.toggleNote(1, 6); g.toggleNote(9 * 4 + 4, 4); g.toggleNote(80, 4);
  assert.deepEqual(g.noteDigits(1), [4, 6]);
  g.toggleNote(1, 6);
  assert.deepEqual(g.noteDigits(1), [4]);
  g.setDigit(0, 4); // rij 1 / kolom 1 / blok 1
  assert.deepEqual(g.noteDigits(1), [], 'notitie in dezelfde rij verdwijnt');
  assert.ok(g.notes[80] & bit(4), 'notitie elders blijft');
  g.undo();
  assert.deepEqual(g.noteDigits(1), [4], 'undo zet de notitie terug');
});

test('automatisch wegstrepen is uit te zetten', () => {
  const g = newGame();
  g.toggleNote(1, 4);
  g.setDigit(0, 4, { autoNotes: false });
  assert.deepEqual(g.noteDigits(1), [4]);
});

test('undo en redo', () => {
  const g = newGame();
  g.setDigit(0, 4); g.setDigit(1, 8);
  g.undo();
  assert.equal(g.values[1], 0);
  g.undo();
  assert.equal(g.values[0], 0);
  assert.equal(g.undo(), null);
  g.redo();
  assert.equal(g.values[0], 4);
  g.setDigit(3, 9);
  assert.equal(g.redo(), null, 'nieuwe zet wist de redo-stapel');
});

test('telt cijfers en detecteert conflicten', () => {
  const g = newGame();
  const before = g.counts()[4];
  g.setDigit(0, 4);
  assert.equal(g.counts()[4], before + 1);
  g.setDigit(1, 3); // rij 1 heeft al een 3
  assert.ok(g.conflicts(1).includes(2));
});

test('oplossen en reset', () => {
  const g = newGame();
  for (let i = 0; i < 81; i++) if (!g.isGiven(i)) g.setDigit(i, sol[i]);
  assert.ok(g.solved);
  assert.equal(g.setDigit(0, 1).changed, false, 'opgeloste puzzel ligt vast');
  g.reset();
  assert.equal(g.solved, false);
  assert.deepEqual(g.values, parseGrid(EASY));
});

test('alle notities invullen en notities verwijderen', () => {
  const g = newGame();
  g.fillNotes();
  assert.ok(g.notes[0] & bit(4));
  assert.equal(g.notes[0] & bit(3), 0);
  g.removeNotes([{ cell: 0, digit: 4 }]);
  assert.equal(g.notes[0] & bit(4), 0);
});

test('opslaan en terugladen via JSON', () => {
  const g = newGame();
  g.setDigit(0, 4); g.toggleNote(1, 5); g.elapsed = 12345;
  const copy = Game.fromJSON(JSON.parse(JSON.stringify(g)));
  assert.deepEqual(copy.values, g.values);
  assert.deepEqual(copy.notes, g.notes);
  assert.equal(copy.elapsed, 12345);
  assert.equal(Game.fromJSON({ v: 0 }), null);
  assert.equal(Game.fromJSON(null), null);
});

test('een kapotte of gemanipuleerde opgeslagen puzzel wordt geweigerd in plaats van te crashen', () => {
  const good = JSON.parse(JSON.stringify(newGame()));
  const broken = [
    { ...good, solution: undefined }, // zonder oplossing liep de app vroeger bij elke start vast
    { ...good, solution: good.solution.slice(0, 80) },
    { ...good, solution: good.solution.map((v, i) => (i === 3 ? 0 : v)) },
    { ...good, givens: 'x'.repeat(81) },
    { ...good, values: 'x'.repeat(81) },
    { ...good, values: good.values.map((v, i) => (i === 2 ? '<img>' : v)) },
    { ...good, values: good.values.map((v, i) => (good.givens[i] ? 0 : v)) }, // gegeven cijfers weg
    { ...good, givens: good.givens.map((v, i) => (v ? (v % 9) + 1 : 0)) }, // past niet bij de oplossing
    { ...good, notes: new Array(81).fill(1024) },
  ];
  for (const b of broken) assert.doesNotThrow(() => assert.equal(Game.fromJSON(b), null));

  // Onbekende extra's worden netjes opgeruimd, de puzzel zelf blijft.
  const g = Game.fromJSON({ ...good, levelId: '__proto__', daily: '<b>', special: 'iets', shape: '<svg>', elapsed: -5, hints: 'veel' });
  assert.equal(g.levelId, 'zondag');
  assert.equal(g.daily, null);
  assert.equal(g.special, null);
  assert.equal(g.shape, null);
  assert.equal(g.elapsed, 0);
  assert.equal(g.hints, 0);
  assert.equal(Game.fromJSON({ ...good, daily: '2026-10-22', special: 'verjaardag-2027', shape: 'heart' }).special, 'verjaardag-2027');
});
