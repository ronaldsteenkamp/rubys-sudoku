// De natuurthema's: elk een eigen effectlaag achter het bord, dieren die om de
// hoek kijken zonder iets te bedekken, alles stil als de app niet in beeld is
// of met minder beweging, en de zachte regen in Regenachtige dag.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const GEWOON = new Date(2026, 10, 3, 12); // geen dagthema, geen slaapstand
const STATS = { totalSolved: 40, noHintSolved: 10, levels: {}, unlockedThemes: ['bos', 'noorderlicht', 'onderwater'] };
const NATUUR = ['waddenzee', 'bos', 'noorderlicht', 'regen', 'onderwater'];
const ANIMAL = { waddenzee: 'zeehondje', bos: 'eekhoorntje' };

const fxAnimations = (page) => page.evaluate(() => document.getAnimations()
  .filter((a) => a.effect?.target?.closest?.('.fx-layer, .fx-animal'))
  .map((a) => a.playState));
const rect = (page, sel) => page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; });
const overlaps = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

for (const id of NATUUR) {
  test(`${id}: de effectlaag staat achter het bord en klikken op het bord werkt gewoon`, async () => {
    const page = await open(base, { clock: GEWOON, query: '?dier=1', storage: { settings: { theme: id }, stats: STATS, game: savedGame() } });
    assert.equal(await page.getAttribute('html', 'data-theme'), id);
    await page.waitForSelector(`.fx-layer.fx-${id}`, { state: 'attached' });
    // Achter alles en nooit klikbaar.
    assert.deepEqual(await page.$eval('.fx-layer', (el) => [getComputedStyle(el).zIndex, getComputedStyle(el).pointerEvents]), ['-1', 'none']);
    assert.ok((await fxAnimations(page)).some((s) => s === 'running'), 'er beweegt iets');

    await page.click('.card.continue');
    // Met ?dier=1 komt het dier vanzelf opnieuw kijken (op het speelscherm).
    if (ANIMAL[id]) {
      await page.clock.runFor(9000);
      await page.waitForSelector(`.fx-animal.fx-${ANIMAL[id]}.in`);
      await page.waitForTimeout(900); // naar binnen geschoven
      const animal = await rect(page, '.fx-animal');
      const visible = { ...animal, l: Math.max(0, animal.l), r: Math.min(390, animal.r) };
      for (const sel of ['#board', '.controls', '#back-btn', '#pause-btn', '#menu-btn']) {
        assert.ok(!overlaps(visible, await rect(page, sel)), `het ${ANIMAL[id]} bedekt ${sel} niet`);
      }
    } else {
      assert.ok(await page.locator('.fx-layer > i').count() > 0, 'druppels, belletjes of lichtbanen');
    }
    const game = await stored(page, 'game');
    const empty = game.values.findIndex((v) => !v);
    await page.click(`#board .cell[data-i="${empty}"]`);
    await page.click(`#numpad .num[data-d="${game.solution[empty]}"]`);
    assert.equal((await stored(page, 'game')).values[empty], game.solution[empty], 'het cijfer staat erin');
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test('de animaties pauzeren als de app niet in beeld is, en lopen daarna weer', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'onderwater' }, stats: STATS } });
  await page.waitForSelector('.fx-layer.fx-onderwater', { state: 'attached' });
  const visibility = (state) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await visibility('hidden');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('fx-paused')), true);
  const paused = await fxAnimations(page);
  assert.ok(paused.length > 5 && paused.every((s) => s === 'paused'), paused.join(','));
  await visibility('visible');
  assert.ok((await fxAnimations(page)).every((s) => s === 'running'));
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('met minder beweging staat alles stil: een stilstaand beeld, geen dieren', async () => {
  for (const id of NATUUR) {
    const page = await open(base, { clock: GEWOON, query: '?dier=1', reducedMotion: 'reduce', storage: { settings: { theme: id }, stats: STATS } });
    await page.waitForSelector(`.fx-layer.fx-${id}`, { state: 'attached' });
    await page.clock.runFor(10000);
    assert.deepEqual(await fxAnimations(page), [], `${id}: niets beweegt`);
    assert.equal(await page.locator('.fx-animal').count(), 0, `${id}: geen dier`);
    assert.ok(await page.locator('.fx-layer > i').count() > 0 || id === 'waddenzee', `${id}: wel een mooi stilstaand beeld`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  }
});

test('het zeehondje zwaait met een flipper als je erop tikt', async () => {
  const page = await open(base, { clock: GEWOON, query: '?dier=1', storage: { settings: { theme: 'waddenzee' } } });
  await page.waitForSelector('.fx-layer.fx-waddenzee', { state: 'attached' });
  await page.clock.runFor(1000);
  await page.waitForSelector('.fx-zeehondje.in');
  await page.waitForTimeout(900);
  await page.click('.fx-zeehondje');
  assert.equal(await page.$eval('.fx-zeehondje', (el) => el.classList.contains('zwaai')), true);
  assert.ok((await page.evaluate(() => document.querySelector('.fx-zeehondje .flipper').getAnimations().length)) > 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('zonder ?dier=1: overdag komt het eekhoorntje na een paar minuten, in de slaapstand niet (en alles op half tempo)', async () => {
  for (const [hour, expectAnimal] of [[12, true], [23, false]]) {
    const page = await open(base, { clock: new Date(2026, 10, 3, hour, 30), storage: { settings: { theme: 'bos', sleep: 'auto' }, stats: STATS } });
    assert.equal(await page.getAttribute('html', 'data-sleep'), expectAnimal ? null : '1');
    // Eerst moet het effect van Bos geladen zijn (een losse module), anders loopt de klok al voor de timer er is.
    await page.waitForSelector('.fx-layer.fx-bos', { state: 'attached' });
    // Tel elk dier dat verschijnt (hij blijft maar even, dus achteraf kijken is niet genoeg).
    await page.evaluate(() => {
      window.__dieren = 0;
      new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) if (n.classList?.contains('fx-animal')) window.__dieren++; })
        .observe(document.body, { childList: true });
    });
    const seen = () => page.evaluate(() => window.__dieren);
    // Niet meteen: pas na een paar minuten.
    await page.clock.runFor(30000);
    assert.equal(await seen(), 0, 'niet meteen');
    await page.clock.runFor(5 * 60000);
    if (expectAnimal) assert.ok(await seen() >= 1, 'het eekhoorntje kwam even kijken');
    else assert.equal(await seen(), 0, 'geen dier in de slaapstand');
    // Hooguit één keer per paar minuten.
    assert.ok(await seen() <= 3, `niet te vaak (${await seen()}×)`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fx-tempo').trim()), expectAnimal ? '1' : '2');
    assert.deepEqual(page.errors, []);
    await page.context().close();
  }
});

test('Regenachtige dag: de regen-schakelaar staat er alleen in dit thema, en respecteert het geluid', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig', sound: 'zacht' } } });
  await page.click('[data-open="settings-dialog"]');
  assert.equal(await page.isVisible('#rain-row'), false, 'niet in Zonnig');
  await page.click('label.theme-opt:has(input[value="regen"])');
  assert.equal(await page.isVisible('#rain-row'), true);
  assert.equal(await page.isChecked('input[name="rainSound"]'), false, 'standaard uit');
  await page.waitForFunction(() => document.querySelector('.fx-layer.fx-regen'));
  const raining = () => page.evaluate(async () => (await import('./js/fx/regen.js')).raining());
  assert.equal(await raining(), false);
  await page.click('#rain-row');
  assert.equal((await stored(page, 'settings')).rainSound, true);
  assert.equal(await raining(), true);
  // Geluid uit: dan ook geen regen (de schakelaar blijft wel aan).
  await page.click('#sound-options label:has(input[value="uit"])');
  assert.equal(await raining(), false);
  assert.equal((await stored(page, 'settings')).rainSound, true);
  await page.click('#sound-options label:has(input[value="zacht"])');
  assert.equal(await raining(), true);
  // Een ander thema: de regen stopt.
  await page.click('label.theme-opt:has(input[value="zonnig"])');
  assert.equal(await raining(), false);
  assert.equal(await page.isVisible('#rain-row'), false);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
