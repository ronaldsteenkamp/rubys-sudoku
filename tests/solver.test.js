import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGrid, gridToString, solve, countSolutions, hasUniqueSolution, isValidGrid,
  randomSolvedGrid, UNITS, PEERS, boxOf,
} from '../js/solver.js';
import { mulberry32 } from '../js/generator.js';
import { EASY, EASY_SOLUTION, HARD, HARD_SOLUTION, INKALA, INKALA_SOLUTION } from './fixtures.js';

test('units en peers kloppen', () => {
  assert.equal(UNITS.length, 27);
  for (const u of UNITS) assert.equal(new Set(u).size, 9);
  for (const p of PEERS) assert.equal(p.length, 20);
  assert.equal(boxOf(0), 0);
  assert.equal(boxOf(80), 8);
  assert.equal(boxOf(40), 4);
});

test('lost bekende puzzels correct op', () => {
  assert.equal(gridToString(solve(parseGrid(EASY))), EASY_SOLUTION.replace(/0/g, '.'));
  assert.equal(gridToString(solve(parseGrid(HARD))), HARD_SOLUTION);
  assert.equal(gridToString(solve(parseGrid(INKALA))), INKALA_SOLUTION);
});

test('herkent unieke oplossingen', () => {
  assert.ok(hasUniqueSolution(parseGrid(EASY)));
  assert.ok(hasUniqueSolution(parseGrid(HARD)));
  assert.ok(hasUniqueSolution(parseGrid(INKALA)));
});

test('herkent meerdere oplossingen', () => {
  assert.equal(countSolutions(new Array(81).fill(0), 2), 2);
  const g = parseGrid(HARD);
  g[0] = 0; // een gegeven weghalen maakt deze puzzel meerduidig
  assert.equal(countSolutions(g, 2), 2);
  assert.equal(hasUniqueSolution(g), false);
});

test('onoplosbare en ongeldige grids', () => {
  const dup = parseGrid(EASY);
  dup[0] = 2; // er staat al een 2 in de bovenste rij
  assert.equal(isValidGrid(dup), false);
  assert.equal(countSolutions(dup), 0);
  assert.equal(solve(dup), null);
  // Geldig ogend maar zonder oplossing: vakje 0 kan niets meer worden.
  const stuck = parseGrid('.23456789' + '1........' + '.'.repeat(63));
  assert.equal(isValidGrid(stuck), true);
  assert.equal(countSolutions(stuck), 0);
});

test('volledig opgelost grid is geldig', () => {
  const s = parseGrid(HARD_SOLUTION);
  assert.ok(isValidGrid(s));
  assert.equal(countSolutions(s, 2), 1);
});

test('willekeurig opgelost grid is geldig en seeded reproduceerbaar', () => {
  const a = randomSolvedGrid(mulberry32(42));
  const b = randomSolvedGrid(mulberry32(42));
  const c = randomSolvedGrid(mulberry32(43));
  assert.ok(a.every((v) => v >= 1 && v <= 9));
  assert.ok(isValidGrid(a));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});
