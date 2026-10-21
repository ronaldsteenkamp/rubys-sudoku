// Snelle backtracking-solver op basis van bitmaskers.
// Een grid is een array van 81 getallen: 0 = leeg, 1–9 = cijfer.

export const ALL = 0x1ff; // bits 0..8 → cijfers 1..9

export const rowOf = (i) => Math.floor(i / 9);
export const colOf = (i) => i % 9;
export const boxOf = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);

// Units: 0–8 rijen, 9–17 kolommen, 18–26 blokken.
export const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9)].map((_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9)].map((_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) {
  const r0 = Math.floor(b / 3) * 3, c0 = (b % 3) * 3;
  UNITS.push([...Array(9)].map((_, k) => (r0 + Math.floor(k / 3)) * 9 + c0 + (k % 3)));
}

export const PEERS = [...Array(81)].map((_, i) => {
  const s = new Set([...UNITS[rowOf(i)], ...UNITS[9 + colOf(i)], ...UNITS[18 + boxOf(i)]]);
  s.delete(i);
  return [...s];
});

export const bit = (d) => 1 << (d - 1);

export function popcount(m) {
  let n = 0;
  while (m) { m &= m - 1; n++; }
  return n;
}

export function digitsOf(mask) {
  const out = [];
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
  return out;
}

export function parseGrid(str) {
  const clean = str.replace(/[^0-9.]/g, '');
  if (clean.length !== 81) throw new Error('Grid moet 81 vakjes hebben');
  return [...clean].map((ch) => (ch === '.' ? 0 : Number(ch)));
}

export const gridToString = (g) => g.map((v) => (v ? String(v) : '.')).join('');

// Controleert of de ingevulde cijfers elkaar niet tegenspreken.
export function isValidGrid(grid) {
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (!v) continue;
    const b = bit(v), r = rowOf(i), c = colOf(i), x = boxOf(i);
    if ((rows[r] | cols[c] | boxes[x]) & b) return false;
    rows[r] |= b; cols[c] |= b; boxes[x] |= b;
  }
  return true;
}

// Telt oplossingen tot `limit`. Met `onSolution` kun je een oplossing opvangen.
// Optioneel `rng` voor een willekeurige cijfervolgorde (gebruikt door de generator).
export function countSolutions(grid, limit = 2, { onSolution, rng } = {}) {
  if (!isValidGrid(grid)) return 0;
  const g = grid.slice();
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  const empty = [];
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v) {
      const b = bit(v);
      rows[rowOf(i)] |= b; cols[colOf(i)] |= b; boxes[boxOf(i)] |= b;
    } else empty.push(i);
  }
  const R = empty.map(rowOf), C = empty.map(colOf), B = empty.map(boxOf);
  let count = 0;

  function search(depth) {
    if (depth === empty.length) {
      count++;
      if (onSolution) onSolution(g.slice());
      return count >= limit;
    }
    // Kies het lege vakje met de minste mogelijkheden (MRV).
    let best = -1, bestMask = 0, bestN = 10;
    for (let k = depth; k < empty.length; k++) {
      const m = ALL & ~(rows[R[k]] | cols[C[k]] | boxes[B[k]]);
      const n = popcount(m);
      if (n < bestN) {
        best = k; bestMask = m; bestN = n;
        if (n <= 1) break;
      }
    }
    if (bestN === 0) return false;
    swap(depth, best);
    const i = empty[depth], r = R[depth], c = C[depth], x = B[depth];
    let ds = digitsOf(bestMask);
    if (rng) ds = shuffle(ds, rng);
    for (const d of ds) {
      const b = bit(d);
      g[i] = d; rows[r] |= b; cols[c] |= b; boxes[x] |= b;
      if (search(depth + 1)) return true;
      rows[r] &= ~b; cols[c] &= ~b; boxes[x] &= ~b;
    }
    g[i] = 0;
    swap(depth, best);
    return false;
  }

  function swap(a, b) {
    if (a === b) return;
    [empty[a], empty[b]] = [empty[b], empty[a]];
    [R[a], R[b]] = [R[b], R[a]];
    [C[a], C[b]] = [C[b], C[a]];
    [B[a], B[b]] = [B[b], B[a]];
  }

  search(0);
  return count;
}

export function solve(grid) {
  let solution = null;
  countSolutions(grid, 1, { onSolution: (s) => { solution = s; } });
  return solution;
}

export const hasUniqueSolution = (grid) => countSolutions(grid, 2) === 1;

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Een volledig, willekeurig ingevuld geldig grid.
export function randomSolvedGrid(rng) {
  let solution = null;
  countSolutions(new Array(81).fill(0), 1, { rng, onSolution: (s) => { solution = s; } });
  return solution;
}
