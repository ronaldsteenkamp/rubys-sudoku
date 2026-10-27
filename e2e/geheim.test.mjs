// De geheime thema's: elke trigger echt in de browser, en daarna staat het thema
// in het groepje Geheim. Vóór het vinden staan ze nergens in de kiezer.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame, solve } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const theme = (page) => page.getAttribute('html', 'data-theme');
// Een gewone dag zonder dagthema (geen wedstrijd, feestdag of seizoensbegin).
const GEWOON = new Date(2026, 10, 3, 12);
const SECRET_NAMES = ['Game Boy', 'Sporthal', 'Kampvuur', 'Preitaart', 'Vertrekhal', 'Onzichtbare inkt', 'Wandeltijd', 'Middernacht'];

// Na het vinden: "Probeer maar!", dan staat het thema aan en in het groepje Geheim.
async function acceptAndCheck(page, id, name) {
  await page.waitForSelector('#confirm-dialog[open]');
  assert.match(await page.textContent('#confirm-title'), new RegExp(`Nieuw thema: ${name}`));
  assert.ok((await stored(page, 'stats')).unlockedThemes.includes(id));
  await page.click('#confirm-yes');
  assert.equal(await theme(page), id);
  // Gevonden op het opgelost-scherm: eerst dat dicht.
  if (await page.isVisible('#solved-dialog')) {
    await page.click('#solved-home');
    // Eerst de berichtjes van nieuwe mijlpalen (zoals De allereerste) wegklikken.
    for (let k = 0; k < 40 && (await page.isVisible('#message-dialog') || await page.isHidden('#home')); k++) {
      if (await page.isVisible('#message-dialog')) await page.click('#message-ok');
      await page.waitForTimeout(100);
    }
  }
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

// Ligt `sel` nergens over een knop of het bord? (De onderdelen van het geheimpje
// zelf, zoals de palmboom en zijn kokosnoot, tellen niet.)
const coversNothing = (page, sel) => page.$eval(sel, (el) => {
  const r = el.getBoundingClientRect();
  const own = el.closest('.palm, .keepup') || el;
  const hit = [...document.querySelectorAll('button, .board, .card, .level, .num, .tool')].filter((b) => !own.contains(b) && !b.contains(el))
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

test('Vertrekhal: in Gran Canaria vijf keer op de palmboom en dan op de kokosnoot', async () => {
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'gran-canaria' }, game: savedGame() } });
  const palm = page.locator('.palm-tree');
  await palm.waitFor();
  assert.deepEqual(await coversNothing(page, '.palm'), []);
  for (let k = 0; k < 4; k++) await palm.click();
  assert.equal(await page.locator('.kokosnoot').count(), 0, 'vier keer is te weinig');
  await palm.click();
  const nut = page.locator('.kokosnoot');
  await nut.waitFor();
  await page.waitForTimeout(800);
  assert.deepEqual(await coversNothing(page, '.kokosnoot'), []);
  assert.equal(await page.isVisible('#confirm-dialog'), false, 'pas bij de kokosnoot');
  await nut.click();
  await acceptAndCheck(page, 'vertrekhal', 'Vertrekhal');
  // Het vertrekbord: ON TIME, en na het oplossen BOARDING.
  await page.click('.card.continue');
  assert.equal(await page.getAttribute('.flapstatus', 'data-text'), 'LAS PALMAS · ON TIME');
  await solve(page);
  await page.waitForSelector('#solved-dialog[open]');
  assert.equal(await page.getAttribute('.flapstatus', 'data-text'), 'BOARDING 💛');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

// Een puzzel waar nog één vakje open is; geeft { game, last }.
function almostSolved() {
  const g = savedGame();
  const last = g.values.findIndex((v) => !v);
  return { game: { ...g, values: g.solution.map((v, i) => (i === last ? 0 : v)) }, last };
}
async function solveLast(page, { game, last }) {
  await page.click('.card.continue');
  await page.click(`#board .cell[data-i="${last}"]`);
  await page.click(`#numpad .num[data-d="${game.solution[last]}"]`);
  await page.clock.runFor(2500);
  await page.waitForSelector('#solved-dialog[open]');
}

test('Onzichtbare inkt: in Briefje het hartje op het opgelost-scherm 3 seconden vasthouden', async () => {
  const a = almostSolved();
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'briefje' }, game: a.game } });
  await solveLast(page, a);
  const box = await page.locator('#solved-dialog .solved-heart').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Te kort: niets, en het hartje is weer gewoon.
  await page.mouse.down();
  await page.clock.runFor(2900);
  assert.ok(Number(await page.$eval('.solved-heart', (el) => el.style.getPropertyValue('--uv'))) > 0.5, 'het hartje kleurt al paars');
  await page.mouse.up();
  assert.equal(await page.$eval('.solved-heart', (el) => el.style.getPropertyValue('--uv')), '0');
  assert.equal(await page.isVisible('#confirm-dialog'), false);
  // Lang genoeg.
  await page.mouse.down();
  await page.clock.runFor(3100);
  await page.mouse.up();
  await acceptAndCheck(page, 'onzichtbare-inkt', 'Onzichtbare inkt');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Wandeltijd: na het oplossen vijf pootjes uit de confetti vangen (de knoppen blijven bovenop)', async () => {
  const a = almostSolved();
  const page = await open(base, { clock: GEWOON, storage: { settings: { theme: 'zonnig' }, game: a.game } });
  await solveLast(page, a);
  const paws = page.locator('#solved-dialog .paw-catch');
  assert.ok(await paws.count() >= 5, 'genoeg pootjes');
  // De knoppen van het opgelost-scherm liggen boven de pootjes.
  assert.ok(await page.$eval('#solved-dialog', (d) => Number(getComputedStyle(d.querySelector('.row')).zIndex) > Number(getComputedStyle(d.querySelector('.paw-layer')).zIndex)));
  for (let k = 0; k < 4; k++) await paws.nth(k).dispatchEvent('click');
  await paws.nth(0).dispatchEvent('click'); // hetzelfde pootje telt niet nog eens
  assert.equal(await page.isVisible('#confirm-dialog'), false, 'vier is te weinig');
  await paws.nth(4).dispatchEvent('click');
  await acceptAndCheck(page, 'wandeltijd', 'Wandeltijd');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

// De browser draait in Europe/Amsterdam (zie helpers.mjs), dus de tijden met +01:00 (wintertijd).
for (const [hhmm, iso, free] of [['23:59', '2026-11-03T23:59:30+01:00', false], ['00:00', '2026-11-04T00:00:05+01:00', true], ['00:01', '2026-11-04T00:01:00+01:00', false]]) {
  const time = new Date(iso);
  test(`Middernacht: een puzzel oplossen om ${hhmm} ${free ? 'speelt hem vrij' : 'doet niets'}`, async () => {
    const a = almostSolved();
    const page = await open(base, { clock: time, storage: { settings: { theme: 'zonnig' }, game: a.game, unlocked: ['eerste', 'zonderhint'] } });
    await page.click('.card.continue');
    await page.click(`#board .cell[data-i="${a.last}"]`);
    await page.click(`#numpad .num[data-d="${a.game.solution[a.last]}"]`);
    await page.clock.runFor(2500);
    await page.waitForSelector('#solved-dialog[open]');
    assert.equal((await stored(page, 'stats')).unlockedThemes.includes('middernacht'), free);
    await page.click('#solved-home');
    await page.waitForTimeout(300);
    if (free) await acceptAndCheck(page, 'middernacht', 'Middernacht');
    else assert.equal(await page.isVisible('#confirm-dialog'), false);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test('Middernacht: de wijzers lopen mee en om 00:00 slaat de klok', async () => {
  const page = await open(base, { clock: new Date('2026-11-03T23:59:57+01:00'), storage: { settings: { theme: 'middernacht' }, stats: { unlockedThemes: ['middernacht'], levels: {} } } });
  await page.waitForSelector('.fx-middernacht .klok');
  const angle = () => page.$eval('.fx-middernacht .minuut', (el) => Number(el.dataset.angle));
  assert.ok(await angle() > 354, 'bijna twaalf uur');
  assert.equal(await page.isVisible('.fx-middernacht.slaat'), false);
  await page.clock.runFor(4000);
  assert.ok(await angle() < 1, 'net over twaalven');
  assert.equal(await page.locator('.fx-middernacht.slaat').count(), 1, 'de klok slaat');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
