// Wedstrijddag: 's ochtends peptalk en warming-up, daarna "hoe ging het?" en de herstelpuzzel.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, open, shutdown, stored, solve, TEST_PREFIX } from './helpers.mjs';

let server, base;
before(async () => ({ server, base } = await start()));
after(async () => { await shutdown(); server.close(); });

const statsOf = (page) => stored(page, 'stats', TEST_PREFIX);
async function goto(page, when) {
  await page.goto(`${base}?vandaag=${when}`);
  await page.waitForSelector('#levels .level');
}
async function solveFromCard(page) {
  await page.click('#match-slot .btn.primary');
  await page.waitForSelector('#play:not([hidden])');
  await solve(page, TEST_PREFIX);
  await page.waitForSelector('#solved-dialog[open]', { timeout: 6000 });
}

test('wedstrijddag: warming-up, dan hoe ging het, dan herstel; elke puzzel telt één keer', async () => {
  // Zaterdag 28 november, 9:30: om 11:00 uit bij Kroton.
  const page = await open(base, { query: '?vandaag=2026-11-28T09:30', prefix: TEST_PREFIX });
  const card = () => page.textContent('#match-slot');
  assert.match(await card(), /Wedstrijddag/);
  assert.match(await card(), /Vanochtend om 11:00 uit bij Kroton 🏐/);
  const pep = await page.textContent('#match-slot .match-text');
  assert.ok(pep.length > 20, 'er staat een peptalk');
  // De gewone dagpuzzel blijft gewoon bestaan.
  assert.equal(await page.locator('#daily-card').count(), 1);

  await solveFromCard(page);
  const warm = await page.textContent('#solved-note');
  assert.match(warm, /warm|Opgewarmd|hersens|Hersens|snelheid|warming-up/);
  assert.equal(await page.isVisible('#solved-record'), false, 'geen recordmelding bij een wedstrijdpuzzel');
  let st = await statsOf(page);
  assert.equal(st.totalSolved, 1);
  assert.equal(st.dailySolved, 0, 'telt niet als dagpuzzel');
  assert.equal(st.matches['2026-11-28'].warmup, true);
  assert.equal(st.levels.warmup.solved, 1);
  assert.equal(st.levels.zondag, undefined, 'geen record op Zondagochtend door de warming-up');

  // Opnieuw laden: de warming-up is gedaan, de peptalk is dezelfde, en er telt niets extra.
  await goto(page, '2026-11-28T10:00');
  assert.match(await card(), /Warming-up gedaan/);
  assert.equal(await page.textContent('#match-slot .match-text'), pep);
  assert.equal(await page.locator('#match-slot .btn').count(), 0);
  assert.equal((await statsOf(page)).totalSolved, 1);

  // Tijdens de wedstrijd.
  await goto(page, '2026-11-28T11:30');
  assert.match(await card(), /langs de lijn|knallen|Hup Donitas/);

  // 's Middags: hoe ging het?
  await goto(page, '2026-11-28T14:00');
  assert.match(await card(), /Hoe ging het\?/);
  assert.equal(await page.locator('#match-slot .btn').count(), 3);
  await page.click('#match-slot .btn:has-text("Verloren")');
  assert.match(await card(), /trots|hart|beste|knuffel/i);
  assert.equal((await statsOf(page)).matches['2026-11-28'].uitslag, 'verloren');

  await solveFromCard(page);
  assert.match(await page.textContent('#solved-note'), /trots|zware|geweldig/);
  assert.doesNotMatch(await page.textContent('#solved-stats'), /\d:\d\d/, 'de tijd van de herstelpuzzel blijft verborgen');
  st = await statsOf(page);
  assert.equal(st.totalSolved, 2);
  assert.equal(st.matches['2026-11-28'].herstel, true);
  assert.equal(st.levels.herstel.solved, 1);
  assert.equal(st.log.length, 2);

  await goto(page, '2026-11-28T15:00');
  assert.match(await card(), /Herstelpuzzel gedaan/);
  assert.equal((await statsOf(page)).totalSolved, 2, 'elke puzzel telt maar één keer');
  assert.equal(await stored(page, 'stats'), null, 'echte opslag onaangeroerd');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('zonder wedstrijd blijft het startscherm zoals het was; een late wedstrijd loopt door tot de volgende ochtend', async () => {
  const page = await open(base, { query: '?vandaag=2026-11-29T10:00', prefix: TEST_PREFIX });
  assert.equal(await page.locator('#match-slot > *').count(), 0);
  // Donderdag 22 oktober 21:00 uit bij DIO Bedum: de volgende ochtend nog "hoe ging het?".
  await goto(page, '2026-10-23T09:00');
  assert.match(await page.textContent('#match-slot'), /Uit bij DIO Bedum[\s\S]*Hoe ging het\?/);
  await goto(page, '2026-10-23T12:30');
  assert.equal(await page.locator('#match-slot > *').count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
