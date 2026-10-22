// Dagthema's: op sommige dagen kiest de app het thema, niet Ruby.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const html = (page, attr) => page.getAttribute('html', attr);

test('Halloween op een wedstrijddag: Volleybal met Nacht-accent, kiezer dicht; de dag erna weer haar eigen thema', async () => {
  const page = await open(base, { query: '?vandaag=2026-10-31', prefix: TEST_PREFIX, storage: { settings: { theme: 'lelie' } } });
  assert.equal(await html(page, 'data-theme'), 'volleybal');
  assert.equal(await html(page, 'data-accent'), 'nacht');
  assert.equal(await html(page, 'data-theme-pending'), null, 'pagina is zichtbaar');
  // De accentkleur is echt die van Nacht.
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#f5c451');

  await page.click('[data-open="settings-dialog"]');
  const note = await page.textContent('#day-theme-note');
  assert.match(note, /Volleybal met Nacht/);
  assert.match(note, /[Mm]orgen/);
  assert.equal(await page.isVisible('#day-theme-note'), true);
  const radios = page.locator('#settings-dialog input[name="theme"]');
  assert.ok(await radios.count() >= 8);
  for (let k = 0; k < await radios.count(); k++) assert.equal(await radios.nth(k).isDisabled(), true);
  assert.equal(await page.isChecked('#settings-dialog input[name="theme"][value="lelie"]'), true, 'haar eigen keuze blijft aangevinkt');
  assert.equal((await stored(page, 'settings', TEST_PREFIX)).theme, 'lelie');
  await page.keyboard.press('Escape');

  await page.goto(`${base}?vandaag=2026-11-01`);
  await page.waitForSelector('#levels .level');
  assert.equal(await html(page, 'data-theme'), 'lelie');
  assert.equal(await html(page, 'data-accent'), null);
  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.isVisible('#day-theme-note'), false);
  assert.equal(await page.isDisabled('#settings-dialog input[name="theme"][value="zonnig"]'), false);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('geen flits: het thema van vandaag staat er al vóór de rest van de app', async () => {
  const page = await open(base, { query: '?vandaag=2026-10-31', prefix: TEST_PREFIX, storage: { settings: { theme: 'lelie' } } });
  // Nu zonder ui.js: alleen het vroege script draait.
  await page.route('**/js/ui.js', (r) => r.abort());
  await page.goto(`${base}?vandaag=2026-10-31`);
  assert.equal(await html(page, 'data-theme'), 'volleybal');
  assert.equal(await html(page, 'data-accent'), 'nacht');
  assert.equal(await html(page, 'data-theme-pending'), null);
  // Een nieuwe dag die de app nog niet kent: even onzichtbaar in plaats van het verkeerde thema.
  await page.goto(`${base}?vandaag=2026-11-14`);
  assert.equal(await html(page, 'data-theme-pending'), '');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).visibility), 'hidden');
  await page.context().close();
});
