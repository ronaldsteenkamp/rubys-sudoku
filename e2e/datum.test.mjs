// De 🔥-reeks en de datum: middernacht, testdatums en een app die dagen openblijft.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, savedGame, stored, solve, fill, backAndForth, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const stats = (extra) => ({ totalSolved: 5, streak: 5, bestStreak: 5, lastSolvedDay: '2026-10-21', levels: {}, ...extra });

test('dagpuzzel om 23:58 begonnen en om 00:03 af: de reeks blijft heel', async () => {
  const page = await open(base, { storage: { stats: stats() }, clock: new Date('2026-10-22T23:58:00+02:00') });
  await page.click('#daily-card');
  await page.waitForSelector('#play:not([hidden])');
  const game = await stored(page, 'game');
  assert.equal(game.daily, '2026-10-22');
  const empty = game.values.flatMap((v, i) => (v ? [] : [i]));
  const last = empty.pop();
  await fill(page, (i, g) => (i === last ? 0 : g.solution[i]));
  await page.clock.setSystemTime(new Date('2026-10-23T00:03:00+02:00'));
  await page.click(`#board .cell[data-i="${last}"]`);
  await page.click(`#numpad .num[data-d="${game.solution[last]}"]`);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  const st = await stored(page, 'stats');
  assert.equal(st.streak, 7);
  assert.ok(st.dailyDone.includes('2026-10-22'));
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('met ?vandaag= blijven de echte statistieken onaangeroerd', async () => {
  const page = await open(base, { query: '?vandaag=2027-09-26', storage: { stats: stats(), game: savedGame() }, prefix: TEST_PREFIX });
  assert.match(await page.textContent('.test-badge'), /Testdatum 2027-09-26/);
  assert.match(await page.textContent('#special-slot'), /Speciaal voor vandaag/);
  // Even een echte stand erbij zetten, alsof het Ruby's toestel is.
  await page.evaluate(() => localStorage.setItem('rubys-sudoku:stats', JSON.stringify({ totalSolved: 40, streak: 9, lastSolvedDay: '2026-10-21', levels: {} })));
  await page.click('#continue-slot .card');
  await solve(page, TEST_PREFIX);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  assert.equal((await stored(page, 'stats', TEST_PREFIX)).totalSolved, 6);
  const real = await stored(page, 'stats');
  assert.equal(real.totalSolved, 40);
  assert.equal(real.lastSolvedDay, '2026-10-21');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('na een nacht op de achtergrond toont het startscherm de nieuwe dag', async () => {
  const page = await open(base, { storage: { stats: stats({ lastSolvedDay: '2026-10-22', dailyDone: ['2026-10-22'] }) }, clock: new Date('2026-10-22T23:50:00+02:00') });
  assert.match(await page.textContent('#daily-title'), /22 oktober/);
  assert.match(await page.textContent('#daily-action'), /Opgelost/);
  await page.clock.setSystemTime(new Date('2026-10-23T08:00:00+02:00'));
  await backAndForth(page);
  assert.match(await page.textContent('#daily-title'), /23 oktober/);
  assert.match(await page.textContent('#daily-action'), /Speel/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
