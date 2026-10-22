// De kalender en persoonlijke records: twee dagen puzzelen (met ?vandaag=) en dan terugkijken.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, savedGame, stored, solve, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

async function solveSaved(page) {
  await page.click('#continue-slot .card');
  await solve(page, TEST_PREFIX);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
  return (await page.textContent('#solved-record')).trim();
}

test('twee dagen puzzelen: een record op dag twee, en beide dagen met een hartje in de kalender', async () => {
  // Dag 1: de allereerste Zondagochtend, in een minuut.
  const page = await open(base, { query: '?vandaag=2026-10-21', prefix: TEST_PREFIX, storage: { game: savedGame({ id: 'dag1', elapsed: 60000 }) } });
  assert.match(await solveSaved(page), /eerste Zondagochtend/);

  // Dag 2: dezelfde soort puzzel, een stuk sneller.
  await page.evaluate(([key, game]) => localStorage.setItem(key, JSON.stringify(game)), [`${TEST_PREFIX}game`, savedGame({ id: 'dag2', elapsed: 20000 })]);
  await page.goto(`${base}?vandaag=2026-10-22`);
  await page.waitForSelector('#levels .level');
  const record = await solveSaved(page);
  assert.match(record, /Zondagochtend|record/i);
  assert.match(record, /seconden|tikje|minuut/);
  assert.equal(await page.isVisible('#solved-record'), true);
  assert.doesNotMatch(await page.textContent('#solved-stats'), /record/, 'de recordregel staat apart');
  assert.equal((await stored(page, 'stats', TEST_PREFIX)).log.length, 2);

  // Terugkijken in de kalender.
  await page.goto(`${base}?vandaag=2026-10-22`);
  await page.waitForSelector('#levels .level');
  await page.click('[data-open="stats-dialog"]');
  await page.click('.stats-tabs label:has(input[value="kalender"])');
  await page.waitForSelector('#calendar:not([hidden])');
  assert.equal(await page.textContent('#cal-month'), 'Oktober 2026');
  for (const day of ['2026-10-21', '2026-10-22']) {
    const cell = page.locator(`#cal-grid [data-day="${day}"]`);
    assert.equal(await cell.locator('.cal-heart').count(), 1, `hartje op ${day}`);
    assert.match(await cell.getAttribute('aria-label'), /1 puzzel opgelost/);
  }
  assert.equal(await page.locator('#cal-grid [data-day="2026-10-20"] .cal-heart').count(), 0);
  assert.match(await page.getAttribute('#cal-grid [data-day="2026-10-22"]', 'aria-label'), /vandaag/);
  assert.equal(await page.isDisabled('#cal-grid [data-day="2026-10-23"]'), true, 'de toekomst kun je niet kiezen');
  assert.equal(await page.textContent('#cal-summary'), 'Deze maand: 2 puzzels op 2 dagen 💛');
  // Verder dan deze maand en terug vóór het eerste logboekitem kan niet.
  assert.equal(await page.isDisabled('#cal-next'), true);
  assert.equal(await page.isDisabled('#cal-prev'), true);

  // Vandaag is al gekozen: het record staat erbij.
  assert.match(await page.textContent('#cal-detail'), /Donderdag 22 oktober/);
  assert.match(await page.textContent('#cal-detail'), /Zondagochtend/);
  assert.match(await page.textContent('#cal-detail'), /🏅/);

  // Met het toetsenbord naar gisteren, en kiezen.
  await page.focus('#cal-grid [data-day="2026-10-22"]');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.day), '2026-10-21');
  await page.keyboard.press('Enter');
  const detail = await page.textContent('#cal-detail');
  assert.match(detail, /Woensdag 21 oktober/);
  assert.match(detail, /Zondagochtend/);
  assert.match(detail, /zonder hints/);
  assert.doesNotMatch(detail, /🏅/, 'de allereerste was nog geen record');
  assert.equal(await page.getAttribute('#cal-grid [data-day="2026-10-21"]', 'aria-pressed'), 'true');

  // De echte opslag is niet aangeraakt.
  assert.equal(await stored(page, 'stats'), null);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
