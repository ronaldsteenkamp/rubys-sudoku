// Gedeelde hulpjes voor de e2e-tests (Playwright + node --test).
import { chromium } from 'playwright';
import { serve } from '../scripts/static-server.mjs';
import { generate } from '../js/generator.js';

export const PREFIX = 'rubys-sudoku:';
export const TEST_PREFIX = 'rubys-sudoku-test:'; // opslag bij ?vandaag=

let browser;
export async function launch() {
  browser ??= await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  return browser;
}
export async function shutdown() { await browser?.close(); browser = undefined; }

// Start de webserver. Met APP_ROOT=<map> test je een andere versie van de app (bijvoorbeeld main).
export const start = (opts = {}) => serve({ ...(process.env.APP_ROOT ? { root: process.env.APP_ROOT } : {}), ...opts });

// Een vaste, makkelijke puzzel als opgeslagen spel.
export function savedGame(extra = {}) {
  const p = generate({ levelId: 'zondag', seed: 2026 });
  return { v: 1, id: 'e2e', givens: p.givens, solution: p.solution, levelId: 'zondag', daily: null, special: null, shape: null,
    values: p.givens.slice(), notes: new Array(81).fill(0), elapsed: 60000, mistakes: 0, hints: 0, solved: false, startedAt: 0, ...extra };
}

// Opent de app. `storage` komt vóór het laden in localStorage (alleen bij de eerste keer, niet bij herladen).
// Paginafouten worden verzameld in page.errors.
export async function open(base, { storage = {}, prefix = PREFIX, query = '', serviceWorkers = 'block', viewport = { width: 390, height: 844 }, clock, colorScheme = 'light', reducedMotion = 'no-preference' } = {}) {
  const b = await launch();
  const context = await b.newContext({ viewport, serviceWorkers, colorScheme, reducedMotion, isMobile: true, hasTouch: true, timezoneId: 'Europe/Amsterdam', locale: 'nl-NL' });
  if (clock) await context.clock.install({ time: clock });
  await context.addInitScript(({ storage, prefix }) => {
    if (sessionStorage.getItem('e2e-seeded')) return;
    sessionStorage.setItem('e2e-seeded', '1');
    for (const [k, v] of Object.entries(storage)) localStorage.setItem(prefix + k, typeof v === 'string' ? v : JSON.stringify(v));
  }, { storage, prefix });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.setDefaultTimeout(8000);
  await page.goto(base + query);
  await page.waitForSelector('#levels .level');
  return page;
}

export const stored = (page, key, prefix = PREFIX) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), prefix + key);

// Doet alsof de app even op de achtergrond stond en weer terugkomt.
export const backAndForth = (page) => page.evaluate(() => {
  for (const state of ['hidden', 'visible']) {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }
});

// Vult via de interface vakjes in: `pick(i, game)` geeft het cijfer voor vakje i (of 0 = overslaan).
export async function fill(page, pick, prefix = PREFIX) {
  const game = await stored(page, 'game', prefix);
  for (let i = 0; i < 81; i++) {
    if (game.values[i]) continue;
    const d = pick(i, game);
    if (!d) continue;
    await page.click(`#board .cell[data-i="${i}"]`);
    await page.click(`#numpad .num[data-d="${d}"]`);
  }
}

// Lost de lopende puzzel op via de interface.
export const solve = (page, prefix) => fill(page, (i, g) => g.solution[i], prefix);

// Wacht tot alle eindige animaties (zoals het inschuiven van een kaart) klaar zijn.
export const settled = (page) => page.evaluate(() => Promise.all(document.getAnimations()
  .filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
