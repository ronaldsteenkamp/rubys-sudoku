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

// Puzzels voor een wedstrijddag (zie matches.js). Ze tellen mee in de
// statistieken, maar staan niet als niveau op het startscherm: zo zet een
// supermakkelijke warming-up geen record op Zondagochtend.
export const MATCH_LEVELS = [
  { id: 'warmup', name: 'Warming-up', emoji: '🏐', tagline: 'Hersens opwarmen', level: 1, minClues: 46 },
  { id: 'herstel', name: 'Herstelpuzzel', emoji: '🛋️', tagline: 'Rustig bijkomen', level: 1, minClues: 34 },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || MATCH_LEVELS.find((l) => l.id === id) || LEVELS[0];

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
// puzzel uit de voorraad (bank.js) en husselen die onherkenbaar door elkaar;
// `bankIndex` kiest welke (anders een willekeurige).
// Niveaus zonder voorraad zijn snel te maken; daar gaan we door tot het niveau
// echt klopt, zodat Koffie erbij nooit stiekem een Zondagochtend wordt.
export function generate({
  levelId = 'zondag', seed = (Math.random() * 2 ** 32) >>> 0, maxAttempts = 400, timeBudget = Infinity, useBank = true, bankIndex = null,
} = {}) {
  const lvl = levelById(levelId);
  const rng = mulberry32(seed);
  const bank = useBank ? BANK[lvl.id] : null;
  const start = Date.now();
  let best = null;
  for (let n = 0; n < maxAttempts; n++) {
    const res = attempt(rng, lvl.level, lvl.minClues);
    if (res.level === lvl.level) return finish(res, lvl, seed, 'generator');
    if (!best || res.level > best.level) best = res;
    if (bank?.length && Date.now() - start > timeBudget) break;
  }
  if (bank?.length) {
    const k = bankIndex ?? Math.floor(rng() * bank.length);
    const base = parseGrid(bank[((k % bank.length) + bank.length) % bank.length]);
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

// Welke voorraadpuzzel een dag krijgt als de generator het niet redt: per
// niveau gewoon de volgende, zodat dezelfde puzzel pas terugkomt als de hele
// voorraad geweest is (bij 120 puzzels en twee dagen per week: ruim een jaar).
export function dailyBankIndex(date) {
  const day = Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const week = Math.floor((day + 4) / 7); // 1 januari 1970 was een donderdag; een week begint op zondag
  const slots = DAILY_LEVEL.flatMap((l, wd) => (l === dailyLevelFor(date) ? [wd] : []));
  const k = week * slots.length + slots.indexOf(date.getDay());
  // Een stap die geen deler gemeen heeft met de voorraad, zodat ze elkaar niet opvolgen in bank-volgorde.
  return k * 7919;
}

export function generateDaily(date = new Date()) {
  const key = dateKey(date);
  const levelId = dailyLevelFor(date);
  // Zonder voorraad (Zondagochtend, Koffie) mag de generator langer zoeken: dat gaat snel.
  const maxAttempts = BANK[levelId] ? 30 : 400;
  const p = generate({ levelId, seed: hashString('ruby-dagpuzzel-' + key), maxAttempts, bankIndex: dailyBankIndex(date) });
  return { ...p, daily: key };
}

// ---------- Wedstrijddag ----------

// Warming-up: kort en licht. Veel gegeven cijfers (±46) en alleen de
// eenvoudigste technieken, dus sneller dan een Zondagochtend.
// Deterministisch per wedstrijd, net als de dagpuzzel.
export function generateWarmup(matchDate) {
  const lvl = levelById('warmup');
  const seed = hashString('ruby-warmup-' + matchDate);
  return { ...finish(attempt(mulberry32(seed), lvl.level, lvl.minClues), lvl, seed, 'warmup'), match: matchDate, matchKind: 'warmup' };
}

// Herstel: een rustige puzzel op Zondagochtend-niveau, ook vast per wedstrijd.
export function generateRecovery(matchDate) {
  const seed = hashString('ruby-herstel-' + matchDate);
  const p = generate({ levelId: 'zondag', seed });
  return { ...p, levelId: 'herstel', source: 'herstel', match: matchDate, matchKind: 'herstel' };
}

export const generateMatchPuzzle = (matchDate, kind) => (kind === 'warmup' ? generateWarmup(matchDate) : generateRecovery(matchDate));

// ---------- Figuurpuzzels (speciale dagen) ----------

// Elke figuur: 9 regels van 9 tekens: 'X' = in de figuur, 'O' = ook in de figuur,
// maar een accent in een donkerdere tint (de pijl, het lint, de naden van een
// bal, het gezicht van de pompoen), '.' = erbuiten. `symmetric`: links
// en rechts gespiegeld, dan halen we ook gespiegeld cijfers weg (dat oogt rustig).
// `color`: de kleurfamilie in style.css (zie .board[data-color]); `heart` voor
// de harten, die de hartkleuren van het thema gebruiken.
// `given: 'left'`: de linkerhelft staat vol cijfers en rechts alleen de omtrek
// (het halve hart: "de andere helft ben ik").
// Eisen (zie tests/generator.test.js): minstens 40 vakjes, en binnen een band
// of stapel hooguit één rij of kolom zonder vakjes, anders kan de puzzel nooit
// maar één oplossing hebben.
export const SHAPES = {
  heart: { name: 'hart', symmetric: true, color: 'heart', rows: [
    '.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'] },
  'half-heart': { name: 'half hart', symmetric: false, color: 'heart', given: 'left', rows: [
    '.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'] },
  'heart-arrow': { name: 'hart met pijl', symmetric: false, color: 'heart', rows: [
    '.XX...XXO', 'XXXX.XXOX', 'XXXXXXOXX', 'XXXXXOXXX', 'XXXXOXXXX', '.XXOXXXX.', '..OXXXX..', '.O.XXX...', 'OO..X....'] },
  balloon: { name: 'ballon', symmetric: false, color: 'blue', rows: [
    '..XXXXX..', '.XOOXXXX.', 'XOXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '....O....', '...O.....'] },
  gift: { name: 'cadeautje', symmetric: true, color: 'lilac', rows: [
    '.OO...OO.', 'O..OOO..O', 'XXXXOXXXX', 'XXXXOXXXX', 'XXXXOXXXX', 'OOOOOOOOO', 'XXXXOXXXX', 'XXXXOXXXX', 'XXXXOXXXX'] },
  volleyball: { name: 'volleybal', symmetric: true, color: 'gold', rows: [
    '..XXOXX..', '.XXXOXXX.', 'XXXXOXXXX', 'XXXOXOXXX', 'XXOXXXOXX', 'XOXXXXXOX', 'OXXXXXXXO', '.XXXXXXX.', '..XXXXX..'] },
  egg: { name: 'paasei', symmetric: true, color: 'lilac', rows: [
    '...XXX...', '..XXXXX..', '.XXXXXXX.', '.XXXXXXX.', 'OXOXOXOXO', 'XOXOXOXOX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..'] },
  crown: { name: 'kroon', symmetric: true, color: 'orange', rows: [
    '.........', 'O...O...O', 'XX.XXX.XX', 'XXXXXXXXX', 'XOXXOXXOX', 'XXXXXXXXX', 'XXXXXXXXX', '.OOOOOOO.', '.........'] },
  pumpkin: { name: 'pompoen', symmetric: false, color: 'orange', rows: [
    '....OO...', '.XXXXXXX.', 'XXXXXXXXX', 'XOOXXXOOX', 'XXXXXXXXX', 'XOXXXXXOX', 'XXOOOOOXX', 'XXXXXXXXX', '.XXXXXXX.'] },
  'letter-r': { name: 'chocoladeletter R', symmetric: false, color: 'brown', rows: [
    'XXXXXXX..', 'XXXXXXXX.', 'XX....XX.', 'XX....XX.', 'XXXXXXXX.', 'XXXXXXX..', 'XX...XXX.', 'XX....XXX', 'XX.....XX'] },
  tree: { name: 'kerstboom', symmetric: false, color: 'green', rows: [
    '....O....', '...XXX...', '..XOXXX..', '.XXXXXOX.', '..XXOXX..', '.XOXXXXX.', 'XXXXXOXXX', '...OOO...', '...OOO...'] },
  star: { name: 'ster', symmetric: true, color: 'gold', rows: [
    '....X....', '...XXX...', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '.XXXXXXX.', '.XXX.XXX.', 'XX.....XX'] },
  fireworks: { name: 'vuurwerk', symmetric: true, color: 'gold', rows: [
    'O..XXX..O', '.O.XXX.O.', '..XXXXX..', 'XXXXOXXXX', 'XXXOOOXXX', 'XXXXOXXXX', '..XXXXX..', '.O.XXX.O.', 'O..XXX..O'] },
};

// Masker (in de figuur), omtrek (in de figuur, met een buur erbuiten) en
// accentvakjes per figuur.
function shapeCells(rows) {
  const chars = rows.join('').split('');
  const mask = chars.map((ch) => ch !== '.');
  const accent = chars.map((ch) => ch === 'O');
  const inside = (r, c) => r >= 0 && r < 9 && c >= 0 && c < 9 && mask[r * 9 + c];
  const outline = mask.map((m, i) => m && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => !inside(Math.floor(i / 9) + dr, (i % 9) + dc)));
  return { mask, outline, accent, hasAccent: accent.some(Boolean) };
}
export const SHAPE_CELLS = Object.fromEntries(Object.entries(SHAPES).map(([k, v]) => [k, shapeCells(v.rows)]));
export const HEART_MASK = SHAPE_CELLS.heart.mask;
export const HEART_OUTLINE = SHAPE_CELLS.heart.outline;
export const shapeColor = (name) => SHAPES[name]?.color || 'heart';

// Een figuurpuzzel: alle gegeven cijfers liggen in de figuur en de omtrek blijft
// altijd staan; binnenin halen we weg (bij een symmetrische figuur gespiegeld)
// zolang de puzzel uniek en logisch oplosbaar blijft. Van een paar kandidaten
// houden we de rustigste (minste cijfers). Deterministisch per seed.
export function generateShape(name, seed, cap = 3, tries = 12) {
  const shape = SHAPES[name];
  if (!shape) throw new Error(`Onbekende figuur: ${name}`);
  const { mask, outline } = SHAPE_CELLS[name];
  const allowed = mask.map((m, i) => m && (outline[i] || shape.given !== 'left' || i % 9 <= 4));
  // Bij het halve hart blijft de linkerhelft helemaal vol staan: daar halen we niets weg.
  const interior = shape.given === 'left' ? []
    : [...Array(81).keys()].filter((i) => allowed[i] && !outline[i] && (!shape.symmetric || i % 9 <= 4));
  const rng = mulberry32(seed);
  let best = null;
  for (let n = 0, found = 0; n < 500 && found < tries; n++) {
    const solution = randomSolvedGrid(rng);
    const g = solution.map((v, i) => (allowed[i] ? v : 0));
    if (countSolutions(g, 2) !== 1 || !logicalSolve(g, cap).solved) continue;
    found++;
    for (const i of shuffle(interior, rng)) {
      const j = shape.symmetric ? Math.floor(i / 9) * 9 + 8 - (i % 9) : i;
      const a = g[i], b = g[j];
      g[i] = 0; g[j] = 0;
      if (countSolutions(g, 2) !== 1 || !logicalSolve(g, cap).solved) { g[i] = a; g[j] = b; }
    }
    const clues = g.filter(Boolean).length;
    if (!best || clues < best.clues) best = { g, solution, clues };
  }
  if (!best) throw new Error(`Geen puzzel gevonden voor ${name}`);
  const r = logicalSolve(best.g, cap);
  return {
    levelId: r.level >= 3 ? 'nadenken' : r.level === 2 ? 'koffie' : 'zondag',
    seed, source: 'shape', givens: best.g, solution: best.solution, clues: best.clues,
    rating: r.level, techniques: Object.keys(r.used), shape: name,
  };
}

// Het hart van jubileum en verjaardag (precies zoals voorheen).
export const generateHeart = (seed, cap = 3, tries = 12) => ({ ...generateShape('heart', seed, cap, tries), source: 'heart' });
