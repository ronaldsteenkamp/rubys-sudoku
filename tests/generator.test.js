import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countSolutions, isValidGrid, parseGrid, solve } from '../js/solver.js';
import { logicalSolve } from '../js/techniques.js';
import { generate, generateDaily, LEVELS, mulberry32, transform, dailyLevelFor, hashString } from '../js/generator.js';
import { BANK } from '../js/bank.js';

function assertGoodPuzzle(p) {
  assert.equal(p.givens.length, 81);
  assert.equal(countSolutions(p.givens, 2), 1, 'oplossing moet uniek zijn');
  assert.ok(isValidGrid(p.solution));
  assert.ok(p.solution.every(Boolean));
  p.givens.forEach((v, i) => { if (v) assert.equal(v, p.solution[i]); });
  for (let i = 0; i < 81; i++) assert.equal(Boolean(p.givens[i]), Boolean(p.givens[80 - i]), 'symmetrisch patroon');
}

for (const lvl of LEVELS) {
  test(`genereert een unieke puzzel op niveau "${lvl.name}"`, () => {
    for (const seed of [1, 2, 3]) {
      const p = generate({ levelId: lvl.id, seed, timeBudget: 400 });
      assertGoodPuzzle(p);
      assert.equal(p.rating, lvl.level, `niveau ${p.rating} via ${p.source}`);
      assert.ok(logicalSolve(p.givens, lvl.level).solved, 'logisch oplosbaar met de technieken van dit niveau');
      assert.ok(p.clues >= lvl.minClues);
    }
  });
}

test('makkelijkste niveau heeft alleen singles nodig', () => {
  const p = generate({ levelId: 'zondag', seed: 99 });
  assert.ok(p.techniques.every((t) => ['full-house', 'hidden-single', 'naked-single'].includes(t)));
});

test('generator is deterministisch per seed', () => {
  const a = generate({ levelId: 'koffie', seed: 1234 });
  const b = generate({ levelId: 'koffie', seed: 1234 });
  assert.deepEqual(a.givens, b.givens);
});

test('dagpuzzel is per datum altijd hetzelfde en verschilt per dag', () => {
  const d1 = new Date(2026, 9, 21), d2 = new Date(2026, 9, 22);
  const a = generateDaily(d1), b = generateDaily(new Date(2026, 9, 21, 18, 30)), c = generateDaily(d2);
  assert.deepEqual(a.givens, b.givens);
  assert.notDeepEqual(a.givens, c.givens);
  assert.equal(a.daily, '2026-10-21');
  assert.equal(a.levelId, dailyLevelFor(d1));
  assertGoodPuzzle(a);
});

test('dagpuzzel op zondag is Zondagochtend', () => {
  assert.equal(dailyLevelFor(new Date(2026, 9, 25)), 'zondag');
});

test('transform behoudt uniciteit, moeilijkheid en symmetrie', () => {
  const base = parseGrid(BANK.ruby[0]);
  const before = logicalSolve(base);
  const rng = mulberry32(7);
  for (let k = 0; k < 10; k++) {
    const t = transform(base, rng);
    assertGoodPuzzle({ givens: t, solution: solve(t) });
    assert.equal(logicalSolve(t).level, before.level);
  }
});

test('voorraadpuzzels zijn geldig en van het juiste niveau', () => {
  for (const [id, want] of [['nadenken', 3], ['ruby', 4]]) {
    assert.ok(BANK[id].length >= 50);
    for (const s of BANK[id].slice(0, 15)) {
      const g = parseGrid(s);
      assert.equal(countSolutions(g, 2), 1);
      assert.equal(logicalSolve(g).level, want);
    }
  }
});

test('generatie blijft snel (ruim onder 1 seconde, ook voor Ruby-modus)', () => {
  for (const lvl of LEVELS) {
    for (let s = 0; s < 5; s++) {
      const t = performance.now();
      generate({ levelId: lvl.id, seed: hashString(lvl.id + s), timeBudget: 250 });
      const ms = performance.now() - t;
      // Een telefoon is grofweg 3–4× trager dan deze machine.
      assert.ok(ms < 300, `${lvl.id} duurde ${ms.toFixed(0)}ms`);
    }
  }
});

test('hartjespuzzel: uniek, binnen het hart, met volledige omtrek', async () => {
  const { generateHeart, HEART_MASK, HEART_OUTLINE } = await import('../js/generator.js');
  for (const seed of [2026, 2027, 2028]) {
    const t = performance.now();
    const p = generateHeart(seed);
    assert.ok(performance.now() - t < 500);
    assert.equal(countSolutions(p.givens, 2), 1);
    p.givens.forEach((v, i) => {
      if (v) assert.ok(HEART_MASK[i], 'gegeven buiten het hart');
      if (HEART_OUTLINE[i]) assert.ok(v, 'omtrek moet compleet zijn');
    });
    assert.ok(logicalSolve(p.givens, 3).solved);
    assert.deepEqual(generateHeart(seed).givens, p.givens);
  }
});

test('Koffie erbij is altijd echt Koffie, ook als de tijd op is en op dagen die vroeger te makkelijk waren', async () => {
  const { generateDaily } = await import('../js/generator.js');
  for (const s of [1, 2, 3, 4, 5]) assert.equal(generate({ levelId: 'koffie', seed: s, timeBudget: 0 }).rating, 2);
  for (const day of ['2027-02-15', '2027-04-05', '2027-06-24', '2027-08-02', '2027-08-26', '2027-11-30']) {
    const [y, m, d] = day.split('-').map(Number);
    const p = generateDaily(new Date(y, m - 1, d));
    assert.equal(p.levelId, 'koffie');
    assert.equal(p.rating, 2, day);
  }
});

test('dagpuzzels uit de voorraad komen pas terug als de hele voorraad geweest is', async () => {
  const { dailyBankIndex, dailyLevelFor } = await import('../js/generator.js');
  for (const level of ['nadenken', 'ruby']) {
    const n = BANK[level].length;
    const used = new Map();
    for (let d = 0; used.size < n; d++) {
      const date = new Date(2026, 9, 22 + d);
      if (dailyLevelFor(date) !== level) continue;
      const k = dailyBankIndex(date) % n;
      assert.ok(!used.has(k), `${level}: voorraadpuzzel ${k} komt al terug op dag ${d} (eerder op dag ${used.get(k)})`);
      used.set(k, d);
    }
  }
});
