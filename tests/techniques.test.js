import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL, bit, parseGrid } from '../js/solver.js';
import { FINDERS, computeCandidates, findStep, logicalSolve, applyStep } from '../js/techniques.js';
import { EASY, EASY_SOLUTION, HARD_SOLUTION } from './fixtures.js';

const finder = (name) => FINDERS.find(([n]) => n === name)[1];
const cell = (r, c) => r * 9 + c;
const blank = () => ({ grid: new Array(81).fill(0), cands: new Array(81).fill(ALL) });
const without = (cands, cells, digits) => {
  for (const i of cells) for (const d of digits) cands[i] &= ~bit(d);
};
const only = (cands, i, digits) => { cands[i] = digits.reduce((m, d) => m | bit(d), 0); };
const elimSet = (s) => new Set(s.eliminations.map((e) => `${e.cell}:${e.digit}`));

test('laatste vakje (full house)', () => {
  const grid = parseGrid(HARD_SOLUTION);
  grid[cell(4, 4)] = 0;
  const s = finder('full-house')(grid, computeCandidates(grid));
  assert.deepEqual(s.place, { cell: cell(4, 4), digit: 8 });
});

test('verborgen single op een echte puzzel klopt met de oplossing', () => {
  const grid = parseGrid(EASY);
  const sol = parseGrid(EASY_SOLUTION);
  const s = finder('hidden-single')(grid, computeCandidates(grid));
  assert.ok(s.place);
  assert.equal(s.place.digit, sol[s.place.cell]);
  assert.ok(s.units[0] >= 18, 'eerst in blokken zoeken');
});

test('naakte single', () => {
  const { grid, cands } = blank();
  only(cands, 10, [7]);
  assert.deepEqual(finder('naked-single')(grid, cands).place, { cell: 10, digit: 7 });
});

test('wijzende cijfers (pointing)', () => {
  const { grid, cands } = blank();
  without(cands, [9, 10, 11, 18, 19, 20], [4]); // in blok 1 staat de 4 alleen nog in rij 1
  const s = finder('pointing')(grid, cands);
  assert.deepEqual([...elimSet(s)].sort(), [3, 4, 5, 6, 7, 8].map((c) => `${c}:4`).sort());
});

test('blok-lijn (box/line reduction)', () => {
  const { grid, cands } = blank();
  without(cands, [3, 4, 5, 6, 7, 8], [4]); // in rij 1 staat de 4 alleen nog in blok 1
  const s = finder('box-line')(grid, cands);
  assert.deepEqual([...elimSet(s)].sort(), [9, 10, 11, 18, 19, 20].map((c) => `${c}:4`).sort());
});

test('naakt paar', () => {
  const { grid, cands } = blank();
  only(cands, 0, [1, 2]); only(cands, 1, [1, 2]);
  const s = finder('naked-pair')(grid, cands);
  assert.deepEqual(s.cells, [0, 1]);
  assert.deepEqual(s.digits, [1, 2]);
  assert.ok(elimSet(s).has('5:1') && elimSet(s).has('8:2'));
  assert.ok(!elimSet(s).has('0:1'));
});

test('verborgen paar', () => {
  const { grid, cands } = blank();
  without(cands, [2, 3, 4, 5, 6, 7, 8], [1, 2]);
  const s = finder('hidden-pair')(grid, cands);
  assert.deepEqual(s.cells, [0, 1]);
  assert.equal(s.eliminations.length, 14); // 7 andere cijfers × 2 vakjes
});

test('naakt drietal', () => {
  const { grid, cands } = blank();
  only(cands, 0, [1, 2]); only(cands, 1, [2, 3]); only(cands, 2, [1, 3]);
  const s = finder('naked-triple')(grid, cands);
  assert.deepEqual(s.digits, [1, 2, 3]);
  assert.ok(elimSet(s).has('8:3'));
});

test('verborgen drietal', () => {
  const { grid, cands } = blank();
  without(cands, [3, 4, 5, 6, 7, 8], [1, 2, 3]);
  const s = finder('hidden-triple')(grid, cands);
  assert.deepEqual(s.cells, [0, 1, 2]);
  assert.ok(elimSet(s).has('0:9'));
});

test('X-wing', () => {
  const { grid, cands } = blank();
  const keep = new Set([cell(0, 1), cell(0, 7), cell(4, 1), cell(4, 7)]);
  without(cands, [...Array(9)].flatMap((_, c) => [cell(0, c), cell(4, c)]).filter((i) => !keep.has(i)), [5]);
  const s = finder('x-wing')(grid, cands);
  const e = elimSet(s);
  assert.ok(e.has(`${cell(2, 1)}:5`) && e.has(`${cell(8, 7)}:5`));
  assert.ok(!e.has(`${cell(0, 1)}:5`));
  assert.equal(e.size, 14);
});

test('Swordfish (en geen X-wing in hetzelfde patroon)', () => {
  const { grid, cands } = blank();
  const rows = { 0: [1, 4], 3: [4, 7], 6: [1, 7] };
  for (const [r, cols] of Object.entries(rows)) {
    for (let c = 0; c < 9; c++) if (!cols.includes(c)) cands[cell(+r, c)] &= ~bit(5);
  }
  assert.equal(finder('x-wing')(grid, cands), null);
  const s = finder('swordfish')(grid, cands);
  assert.ok(elimSet(s).has(`${cell(1, 4)}:5`));
  assert.ok(!elimSet(s).has(`${cell(3, 4)}:5`));
  assert.equal(s.eliminations.length, 18);
});

test('XY-wing', () => {
  const { grid, cands } = blank();
  only(cands, cell(0, 0), [1, 2]); // spil
  only(cands, cell(0, 4), [1, 3]);
  only(cands, cell(4, 0), [2, 3]);
  const s = finder('xy-wing')(grid, cands);
  assert.deepEqual([...elimSet(s)], [`${cell(4, 4)}:3`]);
});

test('XYZ-wing', () => {
  const { grid, cands } = blank();
  only(cands, cell(0, 0), [1, 2, 3]);
  only(cands, cell(0, 1), [1, 3]);
  only(cands, cell(2, 0), [2, 3]);
  const s = finder('xyz-wing')(grid, cands);
  assert.deepEqual([...elimSet(s)].sort(), [2, 9, 10, 11, 19, 20].map((c) => `${c}:3`).sort());
});

test('logische solver lost een makkelijke puzzel op met alleen singles', () => {
  const r = logicalSolve(parseGrid(EASY));
  assert.ok(r.solved);
  assert.equal(r.level, 1);
  assert.deepEqual(r.grid, parseGrid(EASY_SOLUTION));
});

test('findStep kiest de makkelijkste techniek en applyStep werkt kandidaten bij', () => {
  const grid = parseGrid(EASY);
  const cands = computeCandidates(grid);
  const s = findStep(grid, cands);
  assert.equal(s.level, 1);
  applyStep(grid, cands, s);
  assert.equal(grid[s.place.cell], s.place.digit);
  assert.equal(cands[s.place.cell], 0);
});
