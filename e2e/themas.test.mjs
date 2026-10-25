// Thema's: 'Automatisch' (licht/donker) bestaat niet meer, 'Seizoen' wel.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

for (const [colorScheme, want] of [['light', 'zonnig'], ['dark', 'nacht']]) {
  test(`wie 'Automatisch' had, houdt op een ${colorScheme === 'dark' ? 'donker' : 'licht'} toestel het thema dat ze zag (${want})`, async () => {
    // Op een gewone dag (geen wedstrijd of feestdag, dan kiest de app het thema).
    const page = await open(base, { colorScheme, clock: new Date(2026, 10, 3, 12), storage: { settings: { theme: 'auto' }, stats: { unlockedThemes: ['herfst'], levels: {} } } });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), want);
    assert.equal((await stored(page, 'settings')).theme, want);
    await page.click('[data-open="settings-dialog"]');
    const themes = await page.$$eval('#theme-options-sfeer .theme-name', (els) => els.map((e) => e.textContent));
    assert.ok(!themes.includes('Automatisch'));
    assert.ok(themes.includes('Zonnig') && themes.includes('Nacht'));
    const seasons = await page.$$eval('#theme-options-seizoen .theme-name', (els) => els.map((e) => e.textContent));
    assert.ok(seasons.includes('Seizoen'), 'Seizoen (automatisch) blijft');
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test('een vrijgespeeld thema heeft in de kiezer geen ondertitel (geen hint en zeker geen code)', async () => {
  const page = await open(base, { clock: new Date(2026, 10, 3, 12), storage: { settings: { theme: 'zonnig' }, stats: { unlockedThemes: ['robijn', 'bos', 'herfst'] } } });
  await page.click('[data-open="settings-dialog"]');
  for (const id of ['robijn', 'bos', 'herfst']) {
    assert.equal(await page.locator(`label.theme-opt:has(input[value="${id}"]) .theme-hint`).count(), 0, id);
  }
  // Een vergrendeld thema houdt zijn hint.
  assert.match(await page.textContent('.theme-opt.locked .theme-hint'), /\S/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
