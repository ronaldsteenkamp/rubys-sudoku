// Spelen zonder frustratie: een vol bord met een fout, de hintkaart, de
// foutcontrole-standen en het hart op een speciale dag.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, savedGame, stored, fill, settled, TEST_PREFIX } from './helpers.mjs';
import { generateHeart } from '../js/generator.js';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

// Vult het hele bord, met in twee vakjes van dezelfde rij de cijfers omgewisseld.
async function fillWithSwap(page) {
  const game = await stored(page, 'game');
  const row = Math.floor(game.values.findIndex((v) => !v) / 9);
  const [a, b] = [...Array(9).keys()].map((c) => row * 9 + c).filter((i) => !game.values[i]);
  await fill(page, (i, g) => (i === a ? g.solution[b] : i === b ? g.solution[a] : g.solution[i]));
}

for (const errors of ['uit', 'verzoek', 'direct']) {
  test(`foutcontrole '${errors}': een vol bord met een fout geeft een zacht seintje`, async () => {
    const page = await open(base, { storage: { game: savedGame(), settings: { errors } } });
    await page.click('#continue-slot .card');
    await fillWithSwap(page);
    await page.waitForSelector('#toast:not([hidden])');
    assert.match(await page.textContent('#toast'), /Bijna! Alles staat vol/);
    assert.equal(await page.locator('#solved-dialog[open]').count(), 0);
    await page.click('#menu-btn');
    assert.equal(await page.isVisible('#check-btn'), errors !== 'direct', 'controleren kan altijd als fouten niet direct rood worden');
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("foutcontrole 'op verzoek': alleen fouten die ze te zien kreeg tellen mee", async () => {
  const page = await open(base, { storage: { game: savedGame(), settings: { errors: 'verzoek' } } });
  await page.click('#continue-slot .card');
  const game = await stored(page, 'game');
  const i = game.values.findIndex((v) => !v);
  await page.click(`#board .cell[data-i="${i}"]`);
  await page.click(`#numpad .num[data-d="${(game.solution[i] % 9) + 1}"]`);
  assert.equal((await stored(page, 'game')).mistakes, 0, 'nog niet gezien');
  await page.click('#menu-btn');
  await page.click('#check-btn');
  assert.equal((await stored(page, 'game')).mistakes, 1, 'na controleren wel');
  await page.context().close();
});

test('de foutcontrole-standen worden uitgelegd', async () => {
  const page = await open(base);
  await page.click('[data-open="settings-dialog"]');
  assert.match(await page.textContent('#errors-explain'), /meteen rood/);
  await page.click('#errors-options label:has(input[value="verzoek"])');
  assert.match(await page.textContent('#errors-explain'), /Controleer mijn puzzel/);
  await page.context().close();
});

for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`de hintkaart bedekt het bord niet (${viewport.width}×${viewport.height})`, async () => {
    // Een fout cijfer in de onderste rij: precies het vakje dat de hint moet laten zien.
    const g = savedGame();
    const i = g.values.findLastIndex((v) => !v);
    g.values[i] = (g.solution[i] % 9) + 1;
    const page = await open(base, { viewport, storage: { game: g } });
    await page.click('#continue-slot .card');
    for (let stage = 0; stage < 3; stage++) {
      if (stage === 0) await page.click('#tool-hint'); else await page.click('#hint-next');
      await settled(page);
      const board = await page.locator('#board').boundingBox();
      const card = await page.locator('#hint-card').boundingBox();
      assert.ok(card.y >= board.y + board.height - 1, `stap ${stage + 1}: kaart begint op ${card.y}, bord eindigt op ${board.y + board.height}`);
      assert.ok(card.y + card.height <= viewport.height, `stap ${stage + 1}: kaart valt van het scherm`);
    }
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test('op haar verjaardag gaat een tik op de kaart verder met het halve hart, in plaats van het te vervangen', async () => {
  const heart = generateHeart(121000 + 2027);
  const values = heart.givens.slice();
  let n = 0;
  for (let i = 0; i < 81; i++) if (!values[i] && n++ < 5) values[i] = heart.solution[i];
  const game = { v: 1, id: 'hart', givens: heart.givens, solution: heart.solution, levelId: heart.levelId, special: 'verjaardag-2027', shape: 'heart',
    values, notes: new Array(81).fill(0), elapsed: 90000, mistakes: 0, hints: 0, solved: false, startedAt: 0 };
  const page = await open(base, { query: '?vandaag=2027-10-12', prefix: TEST_PREFIX, storage: { game } });
  assert.match(await page.textContent('#special-slot'), /Verder/);
  assert.equal(await page.locator('#continue-slot .card').count(), 0, 'geen dubbele Verder puzzelen-kaart');
  await page.click('#special-slot .card');
  await page.waitForSelector('#play:not([hidden])');
  assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
  assert.deepEqual((await stored(page, 'game', TEST_PREFIX)).values, values);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('lang drukken op tekst selecteert niets: geen tekstselectie en geen kopieermenu', async () => {
  const page = await open(base);
  for (const sel of ['#greeting', '#subtitle', '#daily-card', '#levels .level']) {
    assert.equal(await page.$eval(sel, (el) => getComputedStyle(el).webkitUserSelect || getComputedStyle(el).userSelect), 'none', sel);
  }
  // Ook een dubbeltik (zoals lang drukken: een woord kiezen) laat niets geselecteerd achter.
  await page.dblclick('#subtitle');
  assert.equal(await page.evaluate(() => String(getSelection())), '');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
