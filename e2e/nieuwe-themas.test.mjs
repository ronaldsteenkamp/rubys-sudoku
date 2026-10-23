// De nieuwe thema's: Gitaar laat de gitaar klinken, het geheime Game Boy-thema,
// Beachvolleybal tijdens het WK, Dagverloop, de zonnebloem en de kiezer.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const theme = (page) => page.getAttribute('html', 'data-theme');
// Een gewone dag zonder dagthema (geen wedstrijd, feestdag of seizoensbegin).
const GEWOON = new Date(2026, 10, 3, 12);

// Telt welke geluidsbronnen de app maakt: buffers (de gitaar) of oscillators (Zacht en 8-bit).
async function countAudio(page) {
  await page.context().addInitScript(() => {
    window.__audio = { buffer: 0, osc: 0, types: [] };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const { createBufferSource, createOscillator } = AC.prototype;
    AC.prototype.createBufferSource = function (...a) { window.__audio.buffer++; return createBufferSource.apply(this, a); };
    AC.prototype.createOscillator = function (...a) {
      window.__audio.osc++;
      const o = createOscillator.apply(this, a);
      queueMicrotask(() => window.__audio.types.push(o.type));
      return o;
    };
  });
  await page.reload();
  await page.waitForSelector('#levels .level');
}
const resetAudio = (page) => page.evaluate(() => { window.__audio = { buffer: 0, osc: 0, types: [] }; });
const audio = (page) => page.evaluate(() => window.__audio);

test('Gitaar: zolang het thema aan staat klinkt de gitaar, ook met de instelling Zacht (die blijft Zacht)', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig', sound: 'zacht' }, game: savedGame() } });
  await countAudio(page);
  await page.click('[data-open="settings-dialog"]');
  await page.click('label.theme-opt:has(input[value="gitaar"])');
  assert.equal(await theme(page), 'gitaar');
  await page.keyboard.press('Escape');
  await page.click('.card.continue');
  const game = await stored(page, 'game');
  const empty = game.values.findIndex((v) => !v);
  await resetAudio(page);
  await page.click(`#board .cell[data-i="${empty}"]`);
  await page.click(`#numpad .num[data-d="${game.solution[empty]}"]`);
  await page.waitForFunction(() => window.__audio.buffer > 0);
  const a = await audio(page);
  assert.ok(a.buffer >= 1, 'een getokkelde snaar');
  assert.equal(a.osc, 0, 'geen piepje van Zacht');
  assert.equal((await stored(page, 'settings')).sound, 'zacht', 'de instelling verandert niet');

  // Geluid uit = ook in Gitaar stil.
  await page.click('#menu-btn');
  await page.click('#menu-dialog [data-open="settings-dialog"]');
  await page.click('#sound-options label:has(input[value="uit"])');
  await page.keyboard.press('Escape');
  await resetAudio(page);
  await page.click(`#board .cell[data-i="${empty}"]`);
  await page.click('#tool-erase');
  await page.click(`#numpad .num[data-d="${game.solution[empty]}"]`);
  await page.waitForTimeout(150);
  assert.deepEqual(await audio(page), { buffer: 0, osc: 0, types: [] });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Game Boy: 8 keer snel op het logo tikken speelt het geheime thema vrij', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig' } } });
  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.locator('.theme-opt:has-text("Game Boy")').count(), 0, 'geheim: nog nergens te zien');
  await page.keyboard.press('Escape');

  // Langzaam tikken telt niet.
  for (let k = 0; k < 8; k++) { await page.click('.brand'); await page.clock.runFor(500); }
  assert.equal(await page.isVisible('#confirm-dialog'), false);
  await page.clock.runFor(4000);

  for (let k = 0; k < 8; k++) await page.click('.brand');
  await page.waitForSelector('#confirm-dialog[open]');
  assert.match(await page.textContent('#confirm-title'), /Game Boy/);
  assert.ok((await stored(page, 'stats')).unlockedThemes.includes('gameboy'));
  await page.click('#confirm-yes');
  assert.equal(await theme(page), 'gameboy');
  assert.equal((await stored(page, 'settings')).theme, 'gameboy');

  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.isVisible('#theme-group-geheim'), true);
  assert.equal(await page.isChecked('input[name="theme"][value="gameboy"]'), true);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Game Boy: pixelcijfers op het bord en een 8-bit-deuntje bij het oplossen', async () => {
  const g = savedGame();
  const last = g.values.findIndex((v) => !v);
  const almost = { ...g, values: g.solution.map((v, i) => (i === last ? 0 : v)) };
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'gameboy', sound: 'zacht' }, stats: { unlockedThemes: ['gameboy'], levels: {} }, game: almost } });
  await countAudio(page);
  await page.click('.card.continue');
  assert.ok(await page.locator('#board .cell.given .v.pixel').count() > 20);
  // Het cijfer is een masker (geen tekst te zien), maar wel voorlezen.
  assert.equal(await page.$eval('#board .cell.given .v.pixel', (el) => getComputedStyle(el).fontSize), '0px');
  await page.click(`#board .cell[data-i="${last}"]`);
  await resetAudio(page);
  await page.click(`#numpad .num[data-d="${g.solution[last]}"]`);
  await page.waitForFunction(() => window.__audio.types.filter((t) => t === 'square').length >= 7);
  // Het laatste cijfer piept nog gewoon (Zacht); het opgelost-geluid is het deuntje.
  const a = await audio(page);
  assert.equal(a.types.filter((t) => t === 'square').length, 7, a.types.join(','));
  assert.equal(a.buffer, 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const [day, free] of [['2027-08-12', false], ['2027-08-13', true], ['2027-08-15', true], ['2027-08-22', true], ['2027-08-23', false]]) {
  test(`Beachvolleybal: de app openen op ${day} ${free ? 'speelt hem vrij' : 'doet niets'}`, async () => {
    const page = await open(base, { query: `?vandaag=${day}`, prefix: TEST_PREFIX, storage: { settings: { theme: 'zonnig' } } });
    if (free) {
      await page.waitForSelector('#confirm-dialog[open]');
      assert.match(await page.textContent('#confirm-title'), /Beachvolleybal/);
      assert.match(await page.textContent('#confirm-text'), /WK Beachvolleybal/);
      await page.click('#confirm-no');
    } else {
      await page.waitForTimeout(300);
      assert.equal(await page.isVisible('#confirm-dialog'), false);
    }
    assert.equal(((await stored(page, 'stats', TEST_PREFIX))?.unlockedThemes ?? []).includes('beachvolleybal'), free);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test('Beachvolleybal blijft vrij na het WK, en is dan gewoon te kiezen', async () => {
  const page = await open(base, { query: '?vandaag=2027-08-15', prefix: TEST_PREFIX, storage: { settings: { theme: 'zonnig' } } });
  await page.click('#confirm-yes');
  assert.equal(await theme(page), 'beachvolleybal');
  await page.goto(`${base}?vandaag=2027-09-20`);
  await page.waitForSelector('#levels .level');
  assert.equal(await theme(page), 'beachvolleybal');
  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.isDisabled('input[name="theme"][value="beachvolleybal"]'), false);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Dagverloop: de kleuren volgen de klok (licht overdag, donker in de avond)', async () => {
  const page = await open(base, { query: '?vandaag=2027-03-03T13:00&dagthema=uit', prefix: TEST_PREFIX, storage: { settings: { theme: 'dagverloop' } } });
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--bg') !== '');
  assert.equal(await page.getAttribute('html', 'data-scheme'), 'light');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()), '#eef5ff');
  await page.goto(`${base}?vandaag=2027-03-03T22:15&dagthema=uit`);
  await page.waitForFunction(() => document.documentElement.dataset.scheme === 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  assert.notEqual(bg, '#eef5ff');
  assert.equal(await page.getAttribute('meta[name="theme-color"]', 'content'), bg);
  // Een ander thema kiezen haalt de kleuren van de klok weer weg.
  await page.click('[data-open="settings-dialog"]');
  await page.click('label.theme-opt:has(input[value="zonnig"])');
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--bg')), '');
  assert.equal(await page.getAttribute('html', 'data-scheme'), 'light');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Zonnebloem: een bloem op het startscherm die groeit met de gespeelde dagen', async () => {
  const log = Array.from({ length: 31 }, (_, k) => [`2026-10-${String(k + 1).padStart(2, '0')}`, 'koffie', 300, 0, 0]);
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnebloem' }, stats: { totalSolved: 31, unlockedThemes: ['zonnebloem'], log, levels: {} } } });
  await page.waitForSelector('.home-head .sunflower');
  assert.equal(await page.getAttribute('.sunflower', 'data-stage'), 'bloem');
  assert.match(await page.getAttribute('.sunflower', 'aria-label'), /31 dagen/);
  // In een ander thema is hij weg.
  await page.click('[data-open="settings-dialog"]');
  await page.click('label.theme-opt:has(input[value="krant"])');
  assert.equal(await page.locator('.sunflower').count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('de kiezer: groepjes, vergrendelde thema\'s met een slotje en een hint', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig' }, stats: { totalSolved: 20, levels: { ruby: { played: 4, solved: 4 } } } } });
  await page.click('[data-open="settings-dialog"]');
  const groups = await page.$$eval('.theme-group-title', (els) => els.map((e) => e.textContent));
  assert.deepEqual(groups, ['Van jou', 'Sfeer', 'Seizoenen']);
  const names = await page.$$eval('#theme-picker .theme-name', (els) => els.map((e) => e.textContent));
  assert.equal(names.length, 22, 'alles behalve het geheime thema');
  assert.ok(!names.includes('Game Boy'));
  for (const name of ['Robijn', 'RubyxCube', 'Koffiemonster', 'Beachvolleybal', 'Zonnebloem']) {
    const card = page.locator('.theme-opt.locked', { hasText: name });
    assert.equal(await card.count(), 1, `${name} op slot`);
  }
  assert.match(await page.textContent('.theme-opt.locked:has-text("Robijn") .theme-hint'), /Nog 6× Ruby-modus/);
  assert.match(await page.textContent('.theme-opt.locked:has-text("Zonnebloem") .theme-hint'), /Nog 5 puzzels/);
  assert.match(await page.textContent('.theme-opt.locked:has-text("RubyxCube") .theme-hint'), /Zes kanten, zes dagen/);
  for (const name of ['Gitaar', 'Dagverloop', 'Krant', 'Krijtbord', 'Hoog contrast']) {
    assert.equal(await page.locator('label.theme-opt', { hasText: name }).count(), 1, `${name} meteen vrij`);
  }
  // Op 390 px breed past het: geen horizontale scrollbalk op de pagina.
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("een oud 'auto'-thema wordt Hoog contrast op een toestel dat om meer contrast vraagt", async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig' } } });
  const ctx = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', contrast: 'more' });
  await ctx.addInitScript(() => localStorage.setItem('rubys-sudoku:settings', JSON.stringify({ theme: 'auto' })));
  const p2 = await ctx.newPage();
  await p2.goto(base);
  await p2.waitForSelector('#levels .level');
  assert.equal(await p2.evaluate(() => matchMedia('(prefers-contrast: more)').matches), true);
  assert.equal(await theme(p2), 'hoog-contrast');
  await ctx.close();
  await page.context().close();
});
