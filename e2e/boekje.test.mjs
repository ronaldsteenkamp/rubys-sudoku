// Het Techniekenboekje: ontdekken via een hint, het stipje, de regel op het
// opgelost-scherm, en het boekje zelf (ontdekt, vergrendeld, voorbeeld).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, savedGame, TEST_PREFIX } from './helpers.mjs';
import { MILESTONES } from '../js/messages.js';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const openBook = async (page) => {
  await page.click('[data-open="stats-dialog"]');
  await page.click('.stats-tabs label:has(input[value="boekje"])');
  await page.waitForSelector('#book .book-item');
};

test('het boekje: een ontdekte techniek met datum, uitleg en voorbeeld, en een vergrendelde met een hintje', async () => {
  const stats = { totalSolved: 4, levels: {}, techniques: { 'x-wing': { since: '2026-10-23', hints: 2 }, 'full-house': { since: '2026-10-02', hints: 1 } } };
  const page = await open(base, { query: '?vandaag=2026-11-03', prefix: TEST_PREFIX, storage: { stats } });
  await openBook(page);
  assert.equal(await page.textContent('.book-count'), 'Je kent nu 2 van de 13 technieken');
  assert.equal(await page.getAttribute('.book-progress', 'aria-valuenow'), '2');
  const levels = await page.$$eval('.book-level-title', (els) => els.map((e) => e.textContent.trim()));
  assert.deepEqual(levels, ['☀️ Zondagochtend', '☕ Koffie erbij', '🤔 Even nadenken', '🔥 Ruby-modus']);

  const xwing = page.locator('.book-item[data-technique="x-wing"]');
  assert.match(await xwing.textContent(), /X-wing/);
  assert.match(await xwing.locator('.book-since').textContent(), /sinds 23 oktober · 2× in een hint/);
  assert.match(await xwing.locator('.book-text').textContent(), /rechthoek/);
  // Het voorbeeld: een stukje bord met de markeringen van een hint.
  const mini = xwing.locator('.mini-sudoku');
  assert.equal(await mini.isVisible(), true);
  assert.ok(await mini.locator('.cell').count() >= 9);
  assert.ok(await mini.locator('.cell.hint-focus').count() >= 4, 'de vier hoeken van de X-wing');
  assert.ok(await mini.locator('.notes span.strike').count() >= 1, 'wat weg mag');

  const locked = page.locator('.book-item[data-technique="swordfish"]');
  assert.equal(await locked.evaluate((el) => el.classList.contains('locked')), true);
  assert.match(await locked.textContent(), /🔒/);
  assert.equal(await locked.locator('.book-hint').textContent(), 'Vraag eens om een hint in Ruby-modus 🔥');
  assert.equal(await locked.locator('.mini-sudoku, .book-text').count(), 0, 'niets verklappen');
  assert.equal(await page.locator('.book-item.locked[data-technique="pointing"] .book-hint').textContent(), 'Vraag eens om een hint in Koffie erbij');
  // De echte opslag blijft onaangeroerd (testdatum = testopslag).
  assert.equal(await page.evaluate(() => localStorage.getItem('rubys-sudoku:stats')), null);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('ontdekken via een hint: pas bij stap 2, dan een stipje en een regel op het opgelost-scherm', async () => {
  const g = savedGame();
  const last = g.values.findIndex((v) => !v);
  const almost = { ...g, values: g.solution.map((v, i) => (i === last ? 0 : v)) };
  // Geen record (anders gaat die regel voor): ze was al eens sneller op dit niveau.
  const stats = { totalSolved: 5, levels: { zondag: { played: 5, solved: 5, best: 1000, totalTime: 50000 } } };
  const page = await open(base, { query: '?vandaag=2026-11-03T12:00', prefix: TEST_PREFIX, storage: { game: almost, stats, unlocked: MILESTONES.map((m) => m.id) } }); // geen berichtjes ertussen
  assert.equal(await page.isVisible('.nav-btn .book-dot'), false);
  await page.click('.card.continue');
  await page.click('#tool-hint');
  assert.equal((await stored(page, 'stats', TEST_PREFIX)).techniques?.['full-house'], undefined, 'stap 1 telt nog niet');
  await page.click('#hint-next'); // stap 2: de uitleg
  assert.deepEqual((await stored(page, 'stats', TEST_PREFIX)).techniques['full-house'], { since: '2026-11-03', hints: 1 });
  await page.click('#hint-next'); // stap 3: invullen
  await page.click('#hint-next'); // klaar
  await page.waitForSelector('#solved-dialog[open]');
  assert.equal(await page.textContent('#solved-book'), 'Nieuw in je boekje: Laatste vakje 📖');
  assert.equal(await page.isVisible('#solved-record'), false);
  await page.click('#solved-home');
  // Het startscherm komt pas na het sluiten van de dialoog (een los moment): daar op wachten.
  await page.waitForSelector('#home:not([hidden]) .nav-btn');
  // Al gemeld: geen stipje meer nodig.
  assert.equal(await page.isVisible('.nav-btn .book-dot'), false);
  await openBook(page);
  assert.equal(await page.locator('.book-item[data-technique="full-house"]:not(.locked) .mini-sudoku').count(), 1);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('niet afgemaakt: de techniek is toch ontdekt, met een stipje dat weggaat zodra ze het boekje opent', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-03T12:00', prefix: TEST_PREFIX, storage: { game: savedGame() } });
  await page.click('.card.continue');
  await page.click('#tool-hint');
  await page.click('#hint-next');
  await page.click('#hint-close');
  await page.click('#back-btn');
  await page.waitForSelector('.nav-btn .book-dot', { state: 'visible' });
  // Statistieken opent dan meteen het boekje.
  await page.click('[data-open="stats-dialog"]');
  await page.waitForSelector('#book .book-item');
  assert.equal(await page.isChecked('input[name="stats-view"][value="boekje"]'), true);
  assert.equal(await page.textContent('.book-count'), 'Je kent nu 1 van de 13 technieken');
  assert.equal(await page.isVisible('.stats-tabs .book-dot'), false);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#stats-dialog:not([open])', { state: 'attached' });
  assert.equal(await page.isVisible('.nav-btn .book-dot'), false);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('een recordregel gaat voor: dan geen boekjesregel, alleen het stipje', async () => {
  const g = savedGame();
  const last = g.values.findIndex((v) => !v);
  const almost = { ...g, values: g.solution.map((v, i) => (i === last ? 0 : v)) };
  // De allereerste op dit niveau: daar is een eigen regel voor.
  const page = await open(base, { query: '?vandaag=2026-11-03T12:00', prefix: TEST_PREFIX, storage: { game: almost, unlocked: MILESTONES.map((m) => m.id) } });
  await page.click('.card.continue');
  await page.click('#tool-hint');
  for (let k = 0; k < 3; k++) await page.click('#hint-next');
  await page.waitForSelector('#solved-dialog[open]');
  assert.equal(await page.isVisible('#solved-record'), true);
  assert.equal(await page.isVisible('#solved-book'), false);
  await page.click('#solved-home');
  await page.waitForSelector('#home:not([hidden]) .nav-btn');
  await page.waitForSelector('.nav-btn .book-dot', { state: 'visible' });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
