// Logische oplostechnieken, van makkelijk naar moeilijk.
// Gebruikt door de generator (moeilijkheidsgraad) en door de slimme hints.
//
// Een "stap" ziet er zo uit:
// { technique, level, place: {cell, digit} | null, eliminations: [{cell, digit}],
//   cells: [...patroon-vakjes], units: [...unit-indexen], digits: [...] }

import { ALL, UNITS, PEERS, bit, popcount, digitsOf, rowOf, colOf, boxOf } from './solver.js';

export const TECHNIQUES = {
  'full-house': { level: 1, name: 'Laatste vakje' },
  'hidden-single': { level: 1, name: 'Enige plek' },
  'naked-single': { level: 1, name: 'Enige kandidaat' },
  pointing: { level: 2, name: 'Wijzende cijfers' },
  'box-line': { level: 2, name: 'Blok-lijn' },
  'naked-pair': { level: 2, name: 'Naakt paar' },
  'hidden-pair': { level: 3, name: 'Verborgen paar' },
  'naked-triple': { level: 3, name: 'Naakt drietal' },
  'hidden-triple': { level: 3, name: 'Verborgen drietal' },
  'x-wing': { level: 3, name: 'X-wing' },
  swordfish: { level: 4, name: 'Swordfish' },
  'xy-wing': { level: 4, name: 'XY-wing' },
  'xyz-wing': { level: 4, name: 'XYZ-wing' },
};

const PEER_SET = PEERS.map((p) => new Set(p));
const sees = (a, b) => PEER_SET[a].has(b);

export function computeCandidates(grid) {
  const cands = new Array(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    let m = ALL;
    for (const p of PEERS[i]) if (grid[p]) m &= ~bit(grid[p]);
    cands[i] = m;
  }
  return cands;
}

const step = (technique, props) => ({
  technique,
  level: TECHNIQUES[technique].level,
  place: null,
  eliminations: [],
  cells: [],
  units: [],
  digits: [],
  ...props,
});

// ---------- Singles ----------

function fullHouse(grid) {
  for (let u = 0; u < 27; u++) {
    const empties = UNITS[u].filter((i) => !grid[i]);
    if (empties.length !== 1) continue;
    let used = 0;
    for (const i of UNITS[u]) if (grid[i]) used |= bit(grid[i]);
    const missing = ALL & ~used;
    if (popcount(missing) !== 1) continue;
    const d = digitsOf(missing)[0];
    return step('full-house', { place: { cell: empties[0], digit: d }, cells: empties, units: [u], digits: [d] });
  }
  return null;
}

// Eerst blokken (het makkelijkst te zien), dan rijen, dan kolommen.
const SINGLE_ORDER = [...Array(9)].map((_, b) => 18 + b).concat([...Array(18)].map((_, k) => k));

function hiddenSingle(grid, cands) {
  for (const u of SINGLE_ORDER) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      let spot = -1, n = 0, placed = false;
      for (const i of UNITS[u]) {
        if (grid[i] === d) { placed = true; break; }
        if (cands[i] & b) { spot = i; n++; }
      }
      if (!placed && n === 1) {
        return step('hidden-single', { place: { cell: spot, digit: d }, cells: [spot], units: [u], digits: [d] });
      }
    }
  }
  return null;
}

function nakedSingle(grid, cands) {
  for (let i = 0; i < 81; i++) {
    if (!grid[i] && popcount(cands[i]) === 1) {
      const d = digitsOf(cands[i])[0];
      return step('naked-single', {
        place: { cell: i, digit: d }, cells: [i], units: [rowOf(i), 9 + colOf(i), 18 + boxOf(i)], digits: [d],
      });
    }
  }
  return null;
}

// ---------- Intersecties ----------

function pointing(grid, cands) {
  for (let b = 0; b < 9; b++) {
    const box = UNITS[18 + b];
    for (let d = 1; d <= 9; d++) {
      const spots = box.filter((i) => cands[i] & bit(d));
      if (spots.length < 2) continue;
      for (const [lineOf, base] of [[rowOf, 0], [colOf, 9]]) {
        const line = lineOf(spots[0]);
        if (!spots.every((i) => lineOf(i) === line)) continue;
        const elims = UNITS[base + line]
          .filter((i) => boxOf(i) !== b && cands[i] & bit(d))
          .map((cell) => ({ cell, digit: d }));
        if (elims.length) {
          return step('pointing', { eliminations: elims, cells: spots, units: [18 + b, base + line], digits: [d] });
        }
      }
    }
  }
  return null;
}

function boxLine(grid, cands) {
  for (let u = 0; u < 18; u++) {
    for (let d = 1; d <= 9; d++) {
      const spots = UNITS[u].filter((i) => cands[i] & bit(d));
      if (spots.length < 2) continue;
      const b = boxOf(spots[0]);
      if (!spots.every((i) => boxOf(i) === b)) continue;
      const elims = UNITS[18 + b]
        .filter((i) => !UNITS[u].includes(i) && cands[i] & bit(d))
        .map((cell) => ({ cell, digit: d }));
      if (elims.length) {
        return step('box-line', { eliminations: elims, cells: spots, units: [u, 18 + b], digits: [d] });
      }
    }
  }
  return null;
}

// ---------- Subsets (paren / drietallen) ----------

function* combinations(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= arr.length - (k - acc.length); i++) {
    acc.push(arr[i]);
    yield* combinations(arr, k, i + 1, acc);
    acc.pop();
  }
}

function nakedSubset(n, technique) {
  return (grid, cands) => {
    for (let u = 0; u < 27; u++) {
      const pool = UNITS[u].filter((i) => !grid[i] && popcount(cands[i]) >= 2 && popcount(cands[i]) <= n);
      if (pool.length < n) continue;
      for (const combo of combinations(pool, n)) {
        let union = 0;
        for (const i of combo) union |= cands[i];
        if (popcount(union) !== n) continue;
        const elims = [];
        for (const i of UNITS[u]) {
          if (grid[i] || combo.includes(i)) continue;
          for (const d of digitsOf(cands[i] & union)) elims.push({ cell: i, digit: d });
        }
        if (elims.length) return step(technique, { eliminations: elims, cells: combo, units: [u], digits: digitsOf(union) });
      }
    }
    return null;
  };
}

function hiddenSubset(n, technique) {
  return (grid, cands) => {
    for (let u = 0; u < 27; u++) {
      const empties = UNITS[u].filter((i) => !grid[i]);
      const digits = [];
      for (let d = 1; d <= 9; d++) {
        const c = empties.filter((i) => cands[i] & bit(d)).length;
        if (c >= 1 && c <= n) digits.push(d);
      }
      if (digits.length < n) continue;
      for (const combo of combinations(digits, n)) {
        const cells = empties.filter((i) => combo.some((d) => cands[i] & bit(d)));
        if (cells.length !== n) continue;
        let mask = 0;
        for (const d of combo) mask |= bit(d);
        const elims = [];
        for (const i of cells) for (const d of digitsOf(cands[i] & ~mask)) elims.push({ cell: i, digit: d });
        if (elims.length) return step(technique, { eliminations: elims, cells, units: [u], digits: combo });
      }
    }
    return null;
  };
}

// ---------- Fish (X-wing, Swordfish) ----------

function fish(n, technique) {
  return (grid, cands) => {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (const rowsAreBase of [true, false]) {
        const baseUnits = rowsAreBase ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 13, 14, 15, 16, 17];
        const crossOf = rowsAreBase ? colOf : rowOf;
        const crossBase = rowsAreBase ? 9 : 0;
        const lines = baseUnits
          .map((u) => ({ u, spots: UNITS[u].filter((i) => cands[i] & b) }))
          .filter((l) => l.spots.length >= 2 && l.spots.length <= n);
        if (lines.length < n) continue;
        for (const combo of combinations(lines, n)) {
          const cross = new Set();
          for (const l of combo) for (const i of l.spots) cross.add(crossOf(i));
          if (cross.size !== n) continue;
          const baseSet = new Set(combo.map((l) => l.u));
          const elims = [];
          for (const x of cross) {
            for (const i of UNITS[crossBase + x]) {
              const own = rowsAreBase ? rowOf(i) : 9 + colOf(i);
              if (!baseSet.has(own) && cands[i] & b) elims.push({ cell: i, digit: d });
            }
          }
          if (elims.length) {
            return step(technique, {
              eliminations: elims,
              cells: combo.flatMap((l) => l.spots),
              units: [...combo.map((l) => l.u), ...[...cross].map((x) => crossBase + x)],
              digits: [d],
            });
          }
        }
      }
    }
    return null;
  };
}

// ---------- Wings ----------

const boxesOf = (cells) => [...new Set(cells.map((i) => 18 + boxOf(i)))];

function xyWing(grid, cands) {
  const bivalue = [];
  for (let i = 0; i < 81; i++) if (!grid[i] && popcount(cands[i]) === 2) bivalue.push(i);
  for (const pivot of bivalue) {
    const pm = cands[pivot];
    const wings = bivalue.filter((w) => w !== pivot && sees(pivot, w) && popcount(cands[w] & pm) === 1);
    for (let a = 0; a < wings.length; a++) {
      for (let c = a + 1; c < wings.length; c++) {
        const w1 = wings[a], w2 = wings[c];
        const z = cands[w1] & cands[w2] & ~pm;
        if (popcount(z) !== 1) continue;
        if ((cands[w1] & pm) === (cands[w2] & pm)) continue; // moeten x én y dekken
        const elims = [];
        for (let i = 0; i < 81; i++) {
          if (i === pivot || i === w1 || i === w2 || grid[i]) continue;
          if (cands[i] & z && sees(i, w1) && sees(i, w2)) elims.push({ cell: i, digit: digitsOf(z)[0] });
        }
        if (elims.length) {
          return step('xy-wing', { eliminations: elims, cells: [pivot, w1, w2], units: boxesOf([pivot, w1, w2]), digits: digitsOf(pm | z) });
        }
      }
    }
  }
  return null;
}

function xyzWing(grid, cands) {
  for (let pivot = 0; pivot < 81; pivot++) {
    const pm = cands[pivot];
    if (grid[pivot] || popcount(pm) !== 3) continue;
    const wings = PEERS[pivot].filter((w) => !grid[w] && popcount(cands[w]) === 2 && (cands[w] & ~pm) === 0);
    for (let a = 0; a < wings.length; a++) {
      for (let c = a + 1; c < wings.length; c++) {
        const w1 = wings[a], w2 = wings[c];
        if ((cands[w1] | cands[w2]) !== pm) continue;
        const z = cands[w1] & cands[w2];
        if (popcount(z) !== 1) continue;
        const elims = [];
        for (let i = 0; i < 81; i++) {
          if (i === pivot || i === w1 || i === w2 || grid[i]) continue;
          if (cands[i] & z && sees(i, pivot) && sees(i, w1) && sees(i, w2)) {
            elims.push({ cell: i, digit: digitsOf(z)[0] });
          }
        }
        if (elims.length) return step('xyz-wing', { eliminations: elims, cells: [pivot, w1, w2], units: boxesOf([pivot, w1, w2]), digits: digitsOf(pm) });
      }
    }
  }
  return null;
}

export const FINDERS = [
  ['full-house', fullHouse],
  ['hidden-single', hiddenSingle],
  ['naked-single', nakedSingle],
  ['pointing', pointing],
  ['box-line', boxLine],
  ['naked-pair', nakedSubset(2, 'naked-pair')],
  ['hidden-pair', hiddenSubset(2, 'hidden-pair')],
  ['naked-triple', nakedSubset(3, 'naked-triple')],
  ['hidden-triple', hiddenSubset(3, 'hidden-triple')],
  ['x-wing', fish(2, 'x-wing')],
  ['swordfish', fish(3, 'swordfish')],
  ['xy-wing', xyWing],
  ['xyz-wing', xyzWing],
];

export function findStep(grid, cands, maxLevel = 4) {
  for (const [name, finder] of FINDERS) {
    if (TECHNIQUES[name].level > maxLevel) continue;
    const s = finder(grid, cands);
    if (s) return s;
  }
  return null;
}

export function applyStep(grid, cands, s) {
  if (s.place) {
    const { cell, digit } = s.place;
    grid[cell] = digit;
    cands[cell] = 0;
    for (const p of PEERS[cell]) cands[p] &= ~bit(digit);
  }
  for (const { cell, digit } of s.eliminations) cands[cell] &= ~bit(digit);
}

// Lost zo ver mogelijk logisch op. `level` is de zwaarste techniek die nodig was;
// 5 betekent: met deze technieken kom je er niet uit.
export function logicalSolve(input, maxLevel = 4) {
  const grid = input.slice();
  const cands = computeCandidates(grid);
  const used = {};
  let level = 0, steps = 0;
  for (;;) {
    if (grid.every((v) => v)) break;
    const s = findStep(grid, cands, maxLevel);
    if (!s) return { solved: false, level: 5, used, steps, grid };
    applyStep(grid, cands, s);
    used[s.technique] = (used[s.technique] || 0) + 1;
    level = Math.max(level, s.level);
    steps++;
  }
  return { solved: true, level: Math.max(level, 1), used, steps, grid };
}

export const rate = (grid, maxLevel = 4) => logicalSolve(grid, maxLevel);
