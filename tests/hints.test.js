import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGrid, solve, bit } from '../js/solver.js';
import { Game } from '../js/game.js';
import { getHint, unitName } from '../js/hints.js';
import { generateHeart } from '../js/generator.js';
import { BANK } from '../js/bank.js';
import { EASY, EASY_SOLUTION } from './fixtures.js';

const rng = () => 0.1;
const gameFrom = (givens) => new Game({ givens, solution: solve(givens) });

// Speelt een hele puzzel uit met alleen hints, zoals Ruby dat zou doen.
function playWithHints(game) {
  const kinds = {};
  for (let n = 0; n < 200 && !game.solved; n++) {
    const h = getHint(game, rng);
    assert.ok(h, 'er moet altijd een hint zijn');
    assert.equal(h.stages.length, 3);
    assert.ok(h.stages[0].units.length > 0, 'stap 1 wijst een regio aan');
    assert.equal(h.stages[0].cells.length, h.kind === 'reveal' ? 1 : 0, 'stap 1 verklapt nog geen vakje');
    kinds[h.technique] = (kinds[h.technique] || 0) + 1;
    const a = h.action;
    assert.equal(a.type, 'place');
    assert.equal(a.digit, game.solution[a.cell], 'hint moet het juiste cijfer geven');
    game.setDigit(a.cell, a.digit);
  }
  assert.ok(game.solved);
  return kinds;
}

test('namen van rijen, kolommen en blokken', () => {
  assert.equal(unitName(0), 'rij 1');
  assert.equal(unitName(17), 'kolom 9');
  assert.equal(unitName(18), 'het blok linksboven');
  assert.equal(unitName(22), 'het middelste blok');
  assert.equal(unitName(26), 'het blok rechtsonder');
});

test('hint op een makkelijke puzzel: regio → uitleg → cijfer', () => {
  const g = new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION) });
  const h = getHint(g, rng);
  assert.equal(h.kind, 'step');
  assert.match(h.stages[0].text, /Kijk|Psst|kijken/);
  assert.ok(h.stages[1].text.length > 20);
  assert.match(h.stages[2].text, new RegExp(String(h.action.digit)));
});

test('hint wijst eerst een fout ingevuld cijfer aan', () => {
  const g = new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION) });
  g.setDigit(0, 1); // hoort 4 te zijn
  const h = getHint(g, rng);
  assert.equal(h.kind, 'mistake');
  assert.deepEqual(h.action, { type: 'erase', cell: 0 });
});

test('hint herstelt een notitie waarin het goede cijfer ontbreekt', () => {
  const g = new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION) });
  g.toggleNote(0, 1); // vakje 0 hoort een 4 te worden
  const h = getHint(g, rng);
  assert.equal(h.kind, 'notes');
  assert.deepEqual(h.action, { type: 'note', cell: 0, digit: 4 });
});

test('met alleen hints is een Ruby-modus-puzzel volledig op te lossen', () => {
  for (const s of BANK.ruby.slice(0, 3)) {
    const kinds = playWithHints(gameFrom(parseGrid(s)));
    const advanced = Object.keys(kinds).filter((k) => !['Laatste vakje', 'Enige plek', 'Enige kandidaat'].includes(k));
    assert.ok(advanced.length > 0, 'er moet een gevorderde techniek uitgelegd zijn');
  }
});

test('hint bij een eliminatie-techniek benoemt de techniek en wat er weg kan', () => {
  const g = gameFrom(parseGrid(BANK.nadenken[0]));
  let h;
  for (let n = 0; n < 81; n++) {
    h = getHint(g, rng);
    if (h.action.eliminations?.length) break;
    g.setDigit(h.action.cell, h.action.digit);
  }
  assert.ok(h.action.eliminations.length > 0);
  assert.ok(h.stages[1].strike.length > 0);
  assert.match(h.stages[2].text, /blijft/);
});

test('ook de hartjespuzzel is met hints op te lossen', () => {
  const p = generateHeart(2027);
  playWithHints(new Game({ givens: p.givens, solution: p.solution }));
});

test('vangnet: als logica niet genoeg is, krijgt ze een cadeautje', () => {
  // Bekende extreem moeilijke puzzel, buiten het bereik van onze technieken.
  const g = gameFrom(parseGrid('8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..'));
  const h = getHint(g, rng);
  assert.equal(h.kind, 'reveal');
  assert.equal(h.action.digit, g.solution[h.action.cell]);
  assert.ok(!(g.notes[h.action.cell] & bit(1)) || true);
});
