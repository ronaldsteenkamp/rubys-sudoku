// Slaapstand ('s avonds laat rustiger) en Ruby Wrapped (haar jaar in puzzels).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, solve, savedGame, settled, TEST_PREFIX } from './helpers.mjs';
import { SLEEP_NOTES } from '../js/messages.js';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

// Een logboek met wat puzzels in 2026 (sinds 21 oktober), allemaal 's avonds.
function seededStats() {
  const log = [];
  for (let d = 21; d <= 31; d++) log.push([`2026-10-${d}`, 'koffie', 300 + d, 0, 1, null, 21]);
  log.push(['2026-11-03', 'nadenken', 640, 1, 0, null, 22], ['2026-12-24', 'zondag', 280, 0, 0, null, 20]);
  return { log };
}

test('oudjaarsavond 23:30: slaapstand, slaapberichtje, scherm mag uit; daarna Wrapped tot het einde', async () => {
  const page = await open(base, { query: '?vandaag=2026-12-31T23:30', prefix: TEST_PREFIX, storage: { game: savedGame(), stats: seededStats() } });
  assert.notEqual(await page.getAttribute('html', 'data-sleep'), null, 'slaapstand staat aan');
  assert.match(await page.evaluate(() => getComputedStyle(document.documentElement).filter), /sepia/);

  // Nep-wake lock, zodat we zien dat hij losgelaten wordt.
  await page.evaluate(() => {
    window.__locks = { requested: 0, released: 0 };
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
      window.__locks.requested++;
      const t = new EventTarget();
      t.release = async () => { window.__locks.released++; t.dispatchEvent(new Event('release')); };
      return t;
    } } });
  });
  await page.click('#continue-slot .card');
  await page.waitForSelector('#play:not([hidden])');
  await solve(page, TEST_PREFIX);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  const note = (await page.textContent('#solved-note')).trim();
  assert.ok(SLEEP_NOTES.includes(note), `slaapberichtje: ${note}`);
  assert.equal(await page.isVisible('#solved-again'), false, 'geen grote "nog eentje"-knop');
  assert.equal(await page.isVisible('#solved-again-small'), true, 'wel een klein "toch nog eentje"');
  const locks = await page.evaluate(() => window.__locks);
  assert.ok(locks.requested >= 1 && locks.released >= 1, `wake lock losgelaten: ${JSON.stringify(locks)}`);
  assert.equal((await stored(page, 'stats', TEST_PREFIX)).log.at(-1)[6], 23, 'het uur staat in het logboek');

  // Terug naar het startscherm: daar staat Wrapped.
  await page.click('#solved-dialog [data-close], #solved-home').catch(() => {});
  await page.goto(`${base}?vandaag=2026-12-31T23:35`);
  await page.waitForSelector('#wrapped-slot .card');
  assert.match(await page.textContent('#wrapped-slot'), /Jouw jaar in puzzels ✨/);
  await page.click('#wrapped-slot .card');
  await page.waitForSelector('#wrapped-dialog[open]');
  const bars = await page.locator('#wr-progress span').count();
  assert.ok(bars >= 6, `genoeg kaarten (${bars})`);
  assert.match(await page.textContent('#wr-card'), /sinds 21 oktober/);

  // Op de eerste kaart kan niet terug; vooruit tot het einde.
  assert.equal(await page.isDisabled('#wr-prev'), true);
  assert.equal(await page.locator('#wr-progress span.now').count(), 1);
  for (let k = 1; k < bars; k++) {
    await page.click('#wr-next');
    assert.equal(await page.locator('#wr-progress span.done').count(), k, `voortgang na ${k} tikken`);
  }
  await settled(page);
  assert.match(await page.textContent('#wr-card'), /Op naar 2027 💛/);
  // Terug kan ook, met het toetsenbord.
  await page.keyboard.press('ArrowLeft');
  assert.doesNotMatch(await page.textContent('#wr-card'), /Op naar 2027/);
  await page.keyboard.press('End');
  assert.match(await page.textContent('#wr-card'), /Op naar 2027 💛/);
  await page.click('#wr-next');
  assert.equal(await page.locator('#wrapped-dialog[open]').count(), 0, 'na de laatste kaart dicht');

  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('slaapstand uit in de instellingen: ook om 23:30 geen filter; overdag automatisch ook niet', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-02T23:30', prefix: TEST_PREFIX, storage: { settings: { sleep: 'uit' } } });
  assert.equal(await page.getAttribute('html', 'data-sleep'), null);
  await page.goto(`${base}?vandaag=2026-11-02T14:00`);
  await page.waitForSelector('#levels .level');
  assert.equal(await page.getAttribute('html', 'data-sleep'), null);
  // Geen Wrapped-kaartje in november.
  assert.equal(await page.locator('#wrapped-slot .card').count(), 0);
  await page.context().close();
});
