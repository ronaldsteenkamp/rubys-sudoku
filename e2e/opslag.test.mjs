// Voortgang: oplossen, hervatten en een kapotte opslag of back-up.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { start, open, shutdown, savedGame, stored, solve, fill } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

test('een puzzel oplossen via de interface telt mee in de statistieken', async () => {
  const page = await open(base, { storage: { game: savedGame() } });
  await page.click('#continue-slot .card');
  await solve(page);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  assert.equal((await stored(page, 'stats')).totalSolved, 1);
  assert.equal(await stored(page, 'game'), null, 'opgeloste puzzel is opgeruimd');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('halverwege herladen: de puzzel staat er nog precies zo', async () => {
  const page = await open(base, { storage: { game: savedGame() } });
  await page.click('#continue-slot .card');
  let n = 0;
  await fill(page, (i, g) => (n++ < 3 ? g.solution[i] : 0));
  const before = (await stored(page, 'game')).values;
  await page.reload();
  await page.waitForSelector('#continue-slot .card');
  assert.match(await page.textContent('#continue-slot'), /Verder puzzelen/);
  assert.deepEqual((await stored(page, 'game')).values, before);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('een kapotte puzzel in de opslag laat de app niet meer vastlopen', async () => {
  const broken = { ...savedGame(), solution: undefined };
  const page = await open(base, { storage: { game: broken, unlocked: { kapot: true }, stats: { totalSolved: 3, levels: { zondag: 5 } } } });
  assert.equal(await page.locator('#levels .level').count(), 4);
  // Ook het niveau met kapotte statistieken start gewoon.
  await page.click('#levels .level[data-level="zondag"]');
  await page.waitForSelector('#play:not([hidden])');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('een back-up met een kapotte puzzel wordt geweigerd en verandert niets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rs-'));
  const file = join(dir, 'kapot.json');
  await writeFile(file, JSON.stringify({ app: 'rubys-sudoku', version: 1, created: new Date().toISOString(),
    data: { settings: {}, stats: { totalSolved: 99, levels: {} }, unlocked: [], recentNotes: [], game: { v: 1, givens: new Array(81).fill(0) } } }));
  const page = await open(base, { storage: { stats: { totalSolved: 7, levels: {} } } });
  await page.click('[data-open="settings-dialog"]');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#backup-restore')]);
  await chooser.setFiles(file);
  await page.waitForSelector('#toast:not([hidden])');
  assert.match(await page.textContent('#toast'), /geen goede back-up/);
  assert.equal((await stored(page, 'stats')).totalSolved, 7);
  await page.reload();
  assert.equal(await page.locator('#levels .level').count(), 4);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('terugzetten vergelijkt met wat er nu staat en is terug te draaien', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rs-'));
  const file = join(dir, 'oud.json');
  await writeFile(file, JSON.stringify({ app: 'rubys-sudoku', version: 1, created: '2026-01-01T10:00:00Z',
    data: { settings: {}, stats: { totalSolved: 2, bestStreak: 1, levels: {} }, unlocked: [], recentNotes: [], game: null } }));
  const page = await open(base, { storage: { stats: { totalSolved: 150, bestStreak: 40, levels: {} }, unlocked: ['eerste'] } });
  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.isHidden('#backup-undo'), true);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#backup-restore')]);
  await chooser.setFiles(file);
  await page.waitForSelector('#confirm-dialog[open]');
  assert.match(await page.textContent('#confirm-title'), /minder/);
  assert.match(await page.textContent('#confirm-text'), /150 opgeloste puzzels.*2 opgeloste puzzels/);
  await page.click('#confirm-yes');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('rubys-sudoku:stats')).totalSolved === 2);

  await page.click('[data-open="settings-dialog"]');
  await page.click('#backup-undo');
  await page.click('#confirm-yes');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('rubys-sudoku:stats')).totalSolved === 150);
  assert.deepEqual(await stored(page, 'unlocked'), ['eerste']);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
