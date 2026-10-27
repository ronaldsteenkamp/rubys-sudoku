// De geheime thema's: elke trigger echt in de browser, en daarna staat het thema
// in het groepje Geheim. Vóór het vinden staan ze nergens in de kiezer.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const theme = (page) => page.getAttribute('html', 'data-theme');
// Een gewone dag zonder dagthema (geen wedstrijd, feestdag of seizoensbegin).
const GEWOON = new Date(2026, 10, 3, 12);
const SECRET_NAMES = ['Game Boy', 'Sporthal', 'Kampvuur', 'Preitaart'];

// Na het vinden: "Probeer maar!", dan staat het thema aan en in het groepje Geheim.
async function acceptAndCheck(page, id, name) {
  await page.waitForSelector('#confirm-dialog[open]');
  assert.match(await page.textContent('#confirm-title'), new RegExp(`Nieuw thema: ${name}`));
  assert.ok((await stored(page, 'stats')).unlockedThemes.includes(id));
  await page.click('#confirm-yes');
  assert.equal(await theme(page), id);
  await openSettings(page);
  assert.equal(await page.isVisible(`#theme-options-geheim input[value="${id}"]`), true, `${name} in Geheim`);
  assert.equal(await page.isChecked(`input[name="theme"][value="${id}"]`), true);
  await page.keyboard.press('Escape');
}

// Instellingen openen, vanaf het startscherm of tijdens het spelen (via het menu).
async function openSettings(page) {
  if (await page.isVisible('#play')) { await page.click('#menu-btn'); await page.click('#menu-dialog [data-open="settings-dialog"]'); }
  else await page.click('#home [data-open="settings-dialog"]');
}

// Ligt `sel` nergens over een knop of het bord?
const coversNothing = (page, sel) => page.$eval(sel, (el) => {
  const r = el.getBoundingClientRect();
  const hit = [...document.querySelectorAll('button, .board, .card, .level, .num, .tool')].filter((b) => b !== el && !el.contains(b) && !b.contains(el))
    .filter((b) => { const q = b.getBoundingClientRect(); return q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top; });
  return hit.map((b) => b.className || b.id);
});

test('vóór het vinden staat geen enkel geheim thema in de kiezer, ook niet op slot', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig' } } });
  await page.click('[data-open="settings-dialog"]');
  const text = await page.textContent('#theme-picker');
  for (const name of SECRET_NAMES) assert.ok(!text.includes(name), name);
  assert.equal(await page.isVisible('#theme-group-geheim'), false);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Sporthal: in Volleybal de bal 33 keer hooghouden (32 en dan laten vallen telt niet)', async () => {
  const page = await open(base, { clock: GEWOON, query: '?bal=1', storage: { settings: { theme: 'volleybal' } } });
  const ball = page.locator('.keepup-ball');
  await ball.waitFor();
  assert.equal(await page.isVisible('.keepup-count'), false, 'het tellertje pas na de eerste tik');
  assert.deepEqual(await coversNothing(page, '.keepup'), []);
  for (let k = 0; k < 32; k++) await ball.click({ force: true });
  assert.equal(await page.textContent('.keepup-count'), '32');
  // Laten vallen: dan begint het opnieuw.
  await page.clock.runFor(2000);
  assert.equal(await page.textContent('.keepup-count'), '0');
  assert.equal(await page.isVisible('#confirm-dialog'), false);
  for (let k = 0; k < 33; k++) await ball.click({ force: true });
  await acceptAndCheck(page, 'sporthal', 'Sporthal');
  // Scorebordcijfers en het scorebordje om de timer.
  await page.evaluate((g) => localStorage.setItem('rubys-sudoku:game', JSON.stringify(g)), savedGame());
  await page.reload();
  await page.waitForSelector('#levels .level');
  await page.click('.card.continue');
  assert.ok(await page.locator('#board .cell.given .v.led').count() > 20);
  assert.match(await page.$eval('#timer', (el) => getComputedStyle(el, '::before').content), /THUIS 33/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Kampvuur: in Gitaar zes oplopende tonen zonder gekozen vakje (de puzzel verandert niet)', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'gitaar', sound: 'zacht' }, game: savedGame() } });
  await page.click('.card.continue');
  const before = await stored(page, 'game');
  // Te traag: niets.
  for (const d of [1, 2, 3, 4, 5, 6]) { await page.click(`#numpad .num[data-d="${d}"]`); await page.clock.runFor(2500); }
  assert.equal(await page.isVisible('#confirm-dialog'), false);
  // Niet oplopend: niets.
  for (const d of [1, 2, 3, 5, 4, 6]) await page.click(`#numpad .num[data-d="${d}"]`);
  assert.equal(await page.isVisible('#confirm-dialog'), false);
  // Zes oplopende tonen, vlot achter elkaar.
  for (const d of [2, 3, 4, 6, 7, 9]) { await page.click(`#numpad .num[data-d="${d}"]`); await page.clock.runFor(400); }
  const after = await stored(page, 'game');
  assert.deepEqual([after.values, after.notes, after.mistakes], [before.values, before.notes, before.mistakes], 'geen cijfers, notities of fouten');
  await acceptAndCheck(page, 'kampvuur', 'Kampvuur');
  assert.equal(await page.locator('.fx-layer.fx-kampvuur .vonk').count() > 0, true);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Preitaart: drie keer op de 🥧 in de begroeting tikken (met ?begroeting=preitaart)', async () => {
  const page = await open(base, { clock: GEWOON, query: '?begroeting=preitaart', storage: { settings: { theme: 'zonnig' } } });
  assert.match(await page.textContent('#greeting'), /^Hé \S+, preitaart gegeten\?\s🥧$/);
  const pie = page.locator('#greeting .pie-tap');
  await pie.click();
  await pie.click();
  assert.equal(await page.isVisible('#confirm-dialog'), false, 'twee keer is nog niet genoeg');
  await page.clock.runFor(4000);
  await pie.click();
  assert.equal(await page.isVisible('#confirm-dialog'), false, 'na een pauze begint hij opnieuw');
  await pie.click();
  await pie.click();
  await acceptAndCheck(page, 'preitaart', 'Preitaart');
  // Een gewone begroeting heeft geen taartknopje.
  await page.goto(base);
  await page.waitForSelector('#levels .level');
  assert.equal(await page.locator('#greeting .pie-tap').count(), (await page.textContent('#greeting')).includes('🥧') ? 1 : 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
