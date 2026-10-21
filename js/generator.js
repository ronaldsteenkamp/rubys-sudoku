// Puzzelgenerator: begin met een willekeurig opgelost grid en haal cijfers weg
// zolang de oplossing uniek blijft én de puzzel met de technieken van het
// gekozen niveau op te lossen is.

import { randomSolvedGrid, countSolutions, shuffle, solve, parseGrid } from './solver.js';
import { logicalSolve } from './techniques.js';
import { BANK } from './bank.js';

export const LEVELS = [
  { id: 'zondag', name: 'Zondagochtend', emoji: '☀️', tagline: 'Rustig wakker worden', level: 1, minClues: 34 },
  { id: 'koffie', name: 'Koffie erbij', emoji: '☕', tagline: 'Lekker puzzelen', level: 2, minClues: 26 },
  { id: 'nadenken', name: 'Even nadenken', emoji: '🤔', tagline: 'Hier gaan de hersentjes kraken', level: 3, minClues: 22 },
  { id: 'ruby', name: 'Ruby-modus', emoji: '🔥', tagline: 'Voor echte kampioenen', level: 4, minClues: 20 },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];

// Kleine, snelle seeded random-generator.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Eén poging: geeft altijd een unieke puzzel terug, met de bereikte moeilijkheid.
function attempt(rng, cap, minClues) {
  const solution = randomSolvedGrid(rng);
  const puzzle = solution.slice();
  let clues = 81;
  // Symmetrisch weghalen (180° draaiing) oogt rustig en klassiek.
  const order = shuffle([...Array(41)].map((_, i) => i), rng);
  for (const i of order) {
    const j = 80 - i;
    const n = i === j ? 1 : 2;
    if (clues - n < minClues) continue;
    const a = puzzle[i], b = puzzle[j];
    puzzle[i] = 0; puzzle[j] = 0;
    if (countSolutions(puzzle, 2) !== 1 || !logicalSolve(puzzle, cap).solved) {
      puzzle[i] = a; puzzle[j] = b;
    } else clues -= n;
  }
  const r = logicalSolve(puzzle, cap);
  return { puzzle, solution, clues, level: r.level, used: r.used };
}

// Genereert een puzzel van het gevraagde niveau. Met `maxAttempts` blijft het
// deterministisch voor een gegeven seed (nodig voor de dagpuzzel); `timeBudget`
// (ms) houdt het snel op een telefoon. Lukt het niet op tijd, dan pakken we een
// puzzel uit de voorraad (bank.js) en husselen die onherkenbaar door elkaar.
export function generate({
  levelId = 'zondag', seed = (Math.random() * 2 ** 32) >>> 0, maxAttempts = 400, timeBudget = Infinity, useBank = true,
} = {}) {
  const lvl = levelById(levelId);
  const rng = mulberry32(seed);
  const start = Date.now();
  let best = null;
  for (let n = 0; n < maxAttempts; n++) {
    const res = attempt(rng, lvl.level, lvl.minClues);
    if (res.level === lvl.level) return finish(res, lvl, seed, 'generator');
    if (!best || res.level > best.level) best = res;
    if (Date.now() - start > timeBudget) break;
  }
  const bank = BANK[lvl.id];
  if (useBank && bank && bank.length) {
    const base = parseGrid(bank[Math.floor(rng() * bank.length)]);
    const givens = transform(base, rng);
    const r = logicalSolve(givens, lvl.level);
    return finish({ puzzle: givens, solution: solve(givens), clues: givens.filter(Boolean).length, level: r.level, used: r.used }, lvl, seed, 'bank');
  }
  return finish(best, lvl, seed, 'generator');
}

function finish(res, lvl, seed, source) {
  return {
    levelId: lvl.id,
    seed,
    source,
    givens: res.puzzle,
    solution: res.solution,
    clues: res.clues,
    rating: res.level,
    techniques: Object.keys(res.used),
  };
}

// Husselt een puzzel zonder de logica (en dus de moeilijkheid) te veranderen:
// cijfers hernummeren, spiegelen/draaien en rijen/kolommen binnen banden wisselen.
// Alle stappen behouden de 180°-symmetrie van het patroon.
export function transform(grid, rng) {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const axis = () => {
    const p = shuffle([0, 1, 2], rng);
    const map = new Array(9);
    for (let i = 0; i < 3; i++) { map[i] = p[i]; map[8 - i] = 8 - p[i]; }
    const swapMid = rng() < 0.5;
    map[3] = swapMid ? 5 : 3; map[4] = 4; map[5] = swapMid ? 3 : 5;
    return map;
  };
  const rows = axis(), cols = axis();
  const transpose = rng() < 0.5;
  const out = new Array(81).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r * 9 + c];
      if (!v) continue;
      let nr = rows[r], nc = cols[c];
      if (transpose) [nr, nc] = [nc, nr];
      out[nr * 9 + nc] = digits[v - 1];
    }
  }
  return out;
}

// ---------- Dagpuzzel ----------

// Zondag is natuurlijk Zondagochtend; zaterdag mag het pittig.
const DAILY_LEVEL = ['zondag', 'koffie', 'koffie', 'nadenken', 'koffie', 'nadenken', 'ruby'];

export function dateKey(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dailyLevelFor(date) {
  return DAILY_LEVEL[date.getDay()];
}

export function generateDaily(date = new Date()) {
  const key = dateKey(date);
  const p = generate({ levelId: dailyLevelFor(date), seed: hashString('ruby-dagpuzzel-' + key), maxAttempts: 30 });
  return { ...p, daily: key };
}

// ---------- Hartjespuzzel (jubileum & verjaardag) ----------

const HEART_ROWS = [
  '.XX...XX.',
  'XXXX.XXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....',
];
export const HEART_MASK = HEART_ROWS.join('').split('').map((ch) => ch === 'X');

const inHeart = (r, c) => r >= 0 && r < 9 && c >= 0 && c < 9 && HEART_MASK[r * 9 + c];
export const HEART_OUTLINE = HEART_MASK.map((m, i) => m &&
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => !inHeart(Math.floor(i / 9) + dr, (i % 9) + dc)));

// Alle gegeven cijfers liggen binnen het hart; de omtrek blijft altijd staan,
// binnenin halen we (gespiegeld) weg zolang het uniek en logisch oplosbaar blijft.
export function generateHeart(seed, cap = 3) {
  const rng = mulberry32(seed);
  const interior = [...Array(81).keys()].filter((i) => HEART_MASK[i] && !HEART_OUTLINE[i] && i % 9 <= 4);
  for (let n = 0; n < 500; n++) {
    const solution = randomSolvedGrid(rng);
    const g = solution.map((v, i) => (HEART_MASK[i] ? v : 0));
    if (countSolutions(g, 2) !== 1 || !logicalSolve(g, cap).solved) continue;
    for (const i of shuffle(interior, rng)) {
      const j = Math.floor(i / 9) * 9 + 8 - (i % 9);
      const a = g[i], b = g[j];
      g[i] = 0; g[j] = 0;
      if (countSolutions(g, 2) !== 1 || !logicalSolve(g, cap).solved) { g[i] = a; g[j] = b; }
    }
    const r = logicalSolve(g, cap);
    return {
      levelId: r.level >= 3 ? 'nadenken' : r.level === 2 ? 'koffie' : 'zondag',
      seed, source: 'heart', givens: g, solution, clues: g.filter(Boolean).length,
      rating: r.level, techniques: Object.keys(r.used), shape: 'heart',
    };
  }
  throw new Error('Geen hartjespuzzel gevonden');
}
