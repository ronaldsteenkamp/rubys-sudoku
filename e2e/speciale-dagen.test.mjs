// Speciale dagen met figuurpuzzels: kerst, de maandversary (geen spel) en een oud lopend hart.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, solve, TEST_PREFIX } from './helpers.mjs';
import { specialDay } from '../js/messages.js';
import { generateHeart, SHAPE_CELLS } from '../js/generator.js';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

test('kerst: de kerstboom oplossen, met het eigen berichtje en feest, en daarna gedaan', async () => {
  const kerst = specialDay(new Date(2026, 11, 25, 12));
  const page = await open(base, { query: '?vandaag=2026-12-25T10:00', prefix: TEST_PREFIX });
  assert.match(await page.textContent('#special-slot'), /Vrolijk kerstfeest 🎄/);
  await page.click('#special-slot .card');
  await page.waitForSelector('#message-dialog[open]');
  assert.equal(await page.textContent('#message-icon'), '🎄');
  await page.click('#message-ok');
  await page.waitForSelector('#play:not([hidden])');
  assert.equal(await page.getAttribute('#board', 'data-color'), 'green');
  assert.equal(await page.locator('#board .cell.in-shape').count(), SHAPE_CELLS.tree.mask.filter(Boolean).length);
  assert.match(await page.textContent('#play-title'), /🎄/);
  const game = await stored(page, 'game', TEST_PREFIX);
  assert.deepEqual([game.shape, game.special], ['tree', 'kerst-2026']);
  // Alle gegeven cijfers liggen in de boom.
  game.givens.forEach((v, i) => { if (v) assert.ok(SHAPE_CELLS.tree.mask[i]); });

  await solve(page, TEST_PREFIX);
  await page.waitForSelector('#board.reveal');
  const confetti = await page.$$eval('#confetti span', (els) => els.map((e) => e.textContent));
  assert.ok(confetti.length > 0 && confetti.every((c) => kerst.celebrate.includes(c)), `feest: ${confetti.join('')}`);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  assert.equal(await page.textContent('#solved-note'), kerst.solvedText);
  assert.equal(await page.textContent('.solved-emoji'), '🎄');
  assert.ok((await stored(page, 'stats', TEST_PREFIX)).specialDone.includes('kerst-2026'));

  await page.reload();
  await page.waitForSelector('#levels .level');
  assert.match(await page.textContent('#special-slot'), /Opgelost/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('maandversary: alleen een lief kaartje, geen spel', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-26T09:00', prefix: TEST_PREFIX });
  const card = page.locator('#special-slot .card.special.small');
  assert.equal(await card.count(), 1);
  assert.match(await card.textContent(), /Maandversary 💛/);
  assert.match(await card.textContent(), /2 maanden/);
  assert.equal(await card.getAttribute('aria-label'), '2 maanden samen 💛');
  assert.equal(await page.locator('#special-slot button').count(), 0, 'niets om op te tikken');
  await card.click();
  assert.equal(await page.locator('dialog[open]').count(), 0);
  assert.equal(await page.isHidden('#play'), true);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('een lopende hartjespuzzel uit de oude opslag hervat gewoon', async () => {
  const heart = generateHeart(290900 + 2026);
  const values = heart.givens.slice();
  let n = 0;
  for (let i = 0; i < 81; i++) if (!values[i] && n++ < 4) values[i] = heart.solution[i];
  // Precies zoals de vorige versie hem opsloeg.
  const game = { v: 1, id: 'oud-hart', givens: heart.givens, solution: heart.solution, levelId: heart.levelId, daily: null, special: 'jubileum-2026', shape: 'heart',
    values, notes: new Array(81).fill(0), elapsed: 120000, mistakes: 0, hints: 0, solved: false, startedAt: 0 };
  const page = await open(base, { storage: { game } });
  await page.click('#continue-slot .card');
  await page.waitForSelector('#play:not([hidden])');
  assert.equal(await page.getAttribute('#board', 'data-color'), 'heart');
  assert.equal(await page.locator('#board .cell.in-shape').count(), 55);
  assert.equal(await page.locator('#board .cell.shape-edge').count(), SHAPE_CELLS.heart.outline.filter(Boolean).length);
  assert.deepEqual((await stored(page, 'game')).values, values);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
