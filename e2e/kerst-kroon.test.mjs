// Kerst (vanaf 1 december, met de melding en sneeuw bij het oplossen) en De Robijnen
// Kroon (de teller, het moment bij een nieuw niveau, de trofeeënkast en de testknoppen).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame, PREFIX, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const theme = (page) => page.getAttribute('html', 'data-theme');
// Tekst met gewone spaties (het laatste woord hangt met een vaste spatie aan de rest).
const text = async (page, sel) => (await page.textContent(sel)).replace(/\u00a0/g, ' ');

// Een bijna opgeloste Ruby-modus-puzzel (op één vakje na), zonder hints.
function almostSolved(extra = {}) {
  const g = savedGame({ levelId: 'ruby', ...extra });
  const empty = g.givens.findIndex((v) => !v);
  g.values = g.solution.slice();
  g.values[empty] = 0;
  return { game: g, empty };
}

async function finish(page, { game, empty }) {
  await page.click('.card.continue');
  await page.click(`#board .cell[data-i="${empty}"]`);
  await page.click(`#numpad .num[data-d="${game.solution[empty]}"]`);
}

// Tikt mijlpalen en nieuwe thema's weg tot het kroonmoment er staat (of niet komt).
async function untilCrown(page, tries = 30) {
  for (let k = 0; k < tries; k++) {
    if (await page.isVisible('#crown-dialog[open]')) return true;
    if (await page.isVisible('#message-dialog[open]')) await page.click('#message-ok');
    else if (await page.isVisible('#confirm-dialog[open]')) await page.click('#confirm-no');
    await page.waitForTimeout(150);
  }
  return false;
}

// ---------- Kerst ----------

test('Kerst: vóór 1 december niets, op 1 december één keer de melding, en daarna blijft hij', async () => {
  const before = await open(base, { query: '?vandaag=2026-11-30' });
  await before.waitForTimeout(400);
  assert.equal(await before.isVisible('#confirm-dialog[open]'), false);
  await before.click('[data-open="settings-dialog"]');
  assert.match(await before.getAttribute('button.theme-opt.locked:has-text("Kerst")', 'aria-label'), /nog op slot. Pakje ligt klaar vanaf 1 december/);
  await before.context().close();

  const page = await open(base, { query: '?vandaag=2026-12-01' });
  await page.waitForSelector('#confirm-dialog[open]');
  assert.equal(await page.textContent('#confirm-title'), '🎄 Er is iets nieuws uitgepakt!');
  await page.click('#confirm-yes'); // Probeer maar!
  assert.equal(await theme(page), 'kerst');
  const stats = await stored(page, 'stats', TEST_PREFIX);
  assert.ok(stats.unlockedThemes.includes('kerst'));
  assert.equal(stats.themeUnlockDates.kerst, '2026-12-01');
  // Herladen: geen tweede melding.
  await page.reload();
  await page.waitForSelector('#levels .level');
  await page.waitForTimeout(500);
  assert.equal(await page.isVisible('#confirm-dialog[open]'), false);
  // Ruby's echte opslag is niet aangeraakt.
  assert.equal(await page.evaluate((p) => localStorage.getItem(p + 'stats'), PREFIX), null);
  assert.deepEqual(page.errors, []);
});

test('Kerst: na december nog steeds te kiezen (vrij blijft vrij)', async () => {
  const page = await open(base, { query: '?vandaag=2027-03-10', prefix: TEST_PREFIX,
    storage: { stats: { totalSolved: 1, levels: {}, unlockedThemes: ['kerst'], themeUnlockDates: { kerst: '2026-12-01' } } } });
  await page.click('[data-open="settings-dialog"]');
  await page.click('label.theme-opt:has(input[value="kerst"])');
  assert.equal(await theme(page), 'kerst');
});

test('Kerst: bij het oplossen sneeuwt het, in plaats van de gewone confetti', async () => {
  const p = almostSolved({ levelId: 'zondag' });
  const page = await open(base, { query: '?vandaag=2026-12-02', prefix: TEST_PREFIX,
    storage: { settings: { theme: 'kerst' }, game: p.game, stats: { totalSolved: 1, levels: {}, unlockedThemes: ['kerst'] } } });
  assert.equal(await theme(page), 'kerst');
  await finish(page, p);
  await page.waitForSelector('.fx-sneeuw i');
  assert.ok(await page.locator('.fx-sneeuw i').count() >= 30);
  assert.equal(await page.locator('#confetti span').count(), 0, 'geen gewone confetti');
  assert.deepEqual(page.errors, []);
});

// ---------- De Robijnen Kroon ----------

test('Kroon: een Ruby-puzzel zonder hints telt, en bij 15 vliegt Goud in beeld (met ?kroon=14)', async () => {
  const p = almostSolved();
  const page = await open(base, { query: '?vandaag=2026-11-20&kroon=14', prefix: TEST_PREFIX, storage: { game: p.game } });
  await page.waitForTimeout(400);
  assert.equal(await page.isVisible('#crown-dialog[open]'), false, '?kroon=14 zelf viert niets');
  await finish(page, p);
  await page.waitForSelector('#solved-dialog[open]');
  await page.click('#solved-home');
  assert.ok(await untilCrown(page), 'het kroonmoment komt');
  assert.match(await page.getAttribute('#crown-dialog', 'class'), /lvl-3/);
  assert.equal(await text(page, '#crown-title'), 'Een fonkelende robijn!');
  assert.ok(await page.locator('#crown-dialog .crown-confetti i').count() > 20, 'robijnrode confetti');
  await page.click('#crown-ok');
  const stats = await stored(page, 'stats', TEST_PREFIX);
  assert.equal(stats.rubyNoHintSolved, 15);
  assert.equal(stats.crownShown, 3);
  assert.deepEqual(page.errors, []);
});

test('Kroon: met een hint telt hij niet', async () => {
  const p = almostSolved({ hints: 1 });
  const page = await open(base, { query: '?vandaag=2026-11-20&kroon=14', prefix: TEST_PREFIX, storage: { game: p.game } });
  await finish(page, p);
  await page.waitForSelector('#solved-dialog[open]');
  await page.click('#solved-home');
  assert.equal(await untilCrown(page, 12), false);
  assert.equal((await stored(page, 'stats', TEST_PREFIX)).rubyNoHintSolved, 14);
});

test('Kroon: bestaande voortgang uit het logboek telt mee en wordt bij het openen één keer gevierd', async () => {
  const log = [['2026-10-22', 'ruby', 900, 0, 0], ['2026-10-25', 'ruby', 800, 1, 0]];
  const page = await open(base, { storage: { stats: { totalSolved: 2, levels: { ruby: { played: 2, solved: 2 } }, log } } });
  assert.ok(await untilCrown(page), 'brons vliegt in beeld');
  assert.match(await page.getAttribute('#crown-dialog', 'class'), /lvl-1/);
  assert.equal(await text(page, '#crown-title'), 'Eerste keer zonder hulp!');
  await page.click('#crown-ok');
  const stats = await stored(page, 'stats');
  assert.equal(stats.rubyNoHintSolved, 1);
  assert.equal(stats.crownShown, 1);
  assert.equal(stats.totalSolved, 2, 'de rest blijft zoals het was');
  assert.equal(stats.log.length, 2);
  await page.reload();
  await page.waitForSelector('#levels .level');
  await page.waitForTimeout(500);
  assert.equal(await page.isVisible('#crown-dialog[open]'), false, 'maar één keer');
});

test('Kroon: ?kroon-toon=4 laat de Robijnen Kroon zien zonder iets op te slaan', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-20&kroon-toon=4' });
  await page.waitForSelector('#crown-dialog[open]');
  assert.match(await page.getAttribute('#crown-dialog', 'class'), /lvl-4/);
  assert.equal(await page.textContent('#crown-art .crown-33'), '33');
  await page.click('#crown-ok');
  assert.equal(await page.evaluate((p) => localStorage.getItem(p + 'stats'), TEST_PREFIX), null);
});

test('Kroon: de trofeeënkast met niveau, teller, wat er nog nodig is en grijze silhouetten (ook op 360 px)', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-20&kroon=6', viewport: { width: 360, height: 740 } });
  await page.click('[data-open="stats-dialog"]');
  await page.click('input[value="kroon"] + span');
  const box = page.locator('#crown-case');
  assert.equal(await box.locator('.crown-name').textContent(), 'Zilver');
  assert.match(await box.locator('.crown-count').textContent(), /6 Ruby-puzzels zonder hints/);
  assert.match(await box.locator('.crown-next').textContent(), /Nog 9 tot Goud/);
  assert.equal(await box.locator('.crown-shelf button').count(), 2, 'brons en zilver behaald');
  assert.equal(await box.locator('.crown-shelf .locked .silhouette').count(), 2, 'goud en kroon als silhouet');
  const fits = await page.evaluate(() => { const d = document.querySelector('#stats-dialog'); return d.scrollWidth <= d.clientWidth; });
  assert.ok(fits, 'niets steekt uit');
  // Een behaalde trofee nog eens bekijken.
  await box.locator('.crown-shelf button').first().click();
  await page.waitForSelector('#crown-dialog[open]');
  assert.match(await page.getAttribute('#crown-dialog', 'class'), /lvl-1/);
  assert.deepEqual(page.errors, []);
});
