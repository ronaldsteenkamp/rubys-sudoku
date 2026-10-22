// Maakt screenshots van het startscherm en het speelscherm in alle thema's,
// plus de verjaardag en de hart-onthulling. Handig na een ontwerpwijziging.
// Gebruik: node scripts/screenshots.mjs [--maten] [--themas=liefde,sterren]   (vereist Playwright + Chromium)
// Met --themas alleen die thema's (start, spel en hartjespuzzel) plus een overzicht per thema.
// De plaatjes komen in screenshots/ (staat niet in git), met per scherm een overzicht.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { generate, generateHeart } from '../js/generator.js';
import { THEMES as ALL_THEMES } from '../js/themes.js';
import { serve } from './static-server.mjs';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'screenshots');
const allSizes = process.argv.includes('--maten');
const only = process.argv.find((a) => a.startsWith('--themas='))?.slice(9).split(',');

// ---------- Kleine webserver ----------
const { server, base } = await serve({ prefix: '/' });

// ---------- Vaste spelsituaties ----------
const bit = (d) => 1 << (d - 1);
const level = generate({ levelId: 'koffie', seed: 2027 });
function playGame() {
  const values = level.givens.slice();
  const notes = new Array(81).fill(0);
  let placed = 0, noted = 0;
  for (let i = 0; i < 81; i++) {
    if (values[i]) continue;
    if (placed < 14 && i % 3 === 0) { values[i] = level.solution[i]; placed++; continue; }
    if (noted < 10 && i % 4 === 1) { notes[i] = bit(level.solution[i]) | bit((level.solution[i] % 9) + 1) | bit(((level.solution[i] + 3) % 9) + 1); noted++; }
  }
  // Eén fout cijfer, zodat 'wrong' zichtbaar is.
  const wrongCell = values.findIndex((v, i) => !v && !notes[i]);
  values[wrongCell] = (level.solution[wrongCell] % 9) + 1;
  return { v: 1, id: 'shot', givens: level.givens, solution: level.solution, levelId: 'koffie', daily: null, special: null, shape: null, values, notes, elapsed: 312000, mistakes: 1, hints: 0, solved: false, startedAt: 0 };
}
const heart = generateHeart(121000 + 2027);
function heartGame(almost) {
  const values = heart.givens.slice();
  const empty = [];
  for (let i = 0; i < 81; i++) if (!values[i]) empty.push(i);
  const fill = almost ? empty.slice(0, -1) : empty.filter((_, k) => k % 4 === 1);
  for (const i of fill) values[i] = heart.solution[i];
  return { game: { v: 1, id: 'hart', givens: heart.givens, solution: heart.solution, levelId: heart.levelId, daily: null, special: 'verjaardag-2027', shape: 'heart', values, notes: new Array(81).fill(0), elapsed: 401000, mistakes: 0, hints: 0, solved: false, startedAt: 0 }, last: empty[empty.length - 1] };
}
const stats = { totalSolved: 9, dailySolved: 3, noHintSolved: 4, streak: 3, bestStreak: 3, lastSolvedDay: null, dailyDone: [], levels: { zondag: { played: 5, solved: 5, best: 241000, totalTime: 1500000 }, koffie: { played: 4, solved: 4, best: 402000, totalTime: 1900000 } } };

// ---------- Schermen ----------
const THEMES = [...ALL_THEMES.map((t) => [t.id, t.scheme]), ['auto', 'dark']]
  .filter(([id]) => !only || only.includes(id));
const IPHONE13 = { width: 390, height: 844 };
// Met een iPhone-useragent verschijnt ook het 'zet op beginscherm'-bannertje.
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const SIZES = { se: { width: 375, height: 667 }, iphone13: IPHONE13, promax: { width: 430, height: 932 }, liggend: { width: 844, height: 390 } };

const browser = await chromium.launch();
await mkdir(out, { recursive: true });
const shots = [];

async function page({ theme, scheme, viewport = IPHONE13, game = null, query = '', reducedMotion = 'no-preference', dailyDone = false, extraStats = {} }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  // Met ?vandaag= gebruikt de app een aparte testopslag.
  const prefix = query.includes('vandaag=') ? 'rubys-sudoku-test:' : 'rubys-sudoku:';
  await ctx.addInitScript(({ theme, stats, game, dailyDone, extraStats, prefix }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem(prefix + 'settings', JSON.stringify({ theme }));
    const done = dailyDone ? { dailyDone: [key], dailyTimes: { [key]: 372000 } } : {};
    // Seizoensthema's staan vrij, anders zou het thema terugvallen op zonnig.
    const seasons = { unlockedThemes: ['lente', 'zomer', 'herfst', 'winter'] };
    localStorage.setItem(prefix + 'stats', JSON.stringify({ ...stats, ...done, ...seasons, ...extraStats, lastSolvedDay: key }));
    localStorage.setItem(prefix + 'unlocked', JSON.stringify(['eerste', 'dag1', 'zonderhint']));
    if (game) localStorage.setItem(prefix + 'game', JSON.stringify(game));
  }, { theme, stats, game, dailyDone, extraStats, prefix });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('paginafout:', e.message));
  await p.goto(base + query);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(450);
  return p;
}

async function shot(p, name, group, fullPage = false) {
  const file = `${name}.png`;
  await p.screenshot({ path: join(out, file), fullPage });
  shots.push({ file, group, name });
}

async function openPlay(p, select) {
  await p.click('.card.continue');
  await p.waitForSelector('#play:not([hidden])');
  if (select != null) await p.click(`.cell[data-i="${select}"]`);
  await p.waitForTimeout(400);
}

const game = playGame();
const selectCell = game.values.findIndex((v, i) => v && !game.givens[i] && v === game.solution[i]);

for (const [theme, scheme] of THEMES) {
  let p = await page({ theme, scheme });
  await shot(p, `start-${theme}`, 'start', true);
  await p.context().close();

  p = await page({ theme, scheme, game });
  await openPlay(p, selectCell);
  await shot(p, `spel-${theme}`, 'spel');
  await p.context().close();

  p = await page({ theme, scheme, query: '?vandaag=2027-10-12' });
  await shot(p, `verjaardag-start-${theme}`, 'verjaardag');
  await p.context().close();

  const h = heartGame(false);
  p = await page({ theme, scheme, game: h.game, query: '?vandaag=2027-10-12' });
  await openPlay(p, null);
  await shot(p, `verjaardag-spel-${theme}`, 'verjaardag');
  await p.context().close();

  // Onthulling: los het laatste vakje op en kijk halverwege.
  const a = heartGame(true);
  p = await page({ theme, scheme, game: a.game, query: '?vandaag=2027-10-12' });
  await openPlay(p, a.last);
  await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
  await p.waitForTimeout(650);
  await shot(p, `hart-onthulling-${theme}`, 'onthulling');
  await p.context().close();
}

// Minder beweging: het hart moet meteen gekleurd zijn.
if (!only) {
  const a = heartGame(true);
  const p = await page({ theme: 'nacht', scheme: 'dark', game: a.game, query: '?vandaag=2027-10-12', reducedMotion: 'reduce' });
  await openPlay(p, a.last);
  await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
  await p.waitForTimeout(120);
  await shot(p, 'hart-minder-beweging-nacht', 'onthulling');
  await p.context().close();
}

// Thema-kiezer: Winter vrij, Herfst op 2 van 3 (vandaag is het herfst), de rest dicht.
for (const [theme, scheme] of [['zonnig', 'light'], ['sterren', 'dark'], ['winter', 'light']]) {
  const p = await page({ theme, scheme, query: '?vandaag=2026-10-21', extraStats: { unlockedThemes: ['winter'], seasonSolves: { 'herfst-2026': 2 } } });
  await p.click('[data-open="settings-dialog"]');
  await p.waitForTimeout(400);
  await p.locator('#settings-dialog fieldset').first().screenshot({ path: join(out, `kiezer-${theme}.png`) });
  shots.push({ file: `kiezer-${theme}.png`, group: 'kiezer', name: `kiezer-${theme}` });
  await p.evaluate(() => { for (const r of document.querySelectorAll('.theme-options')) r.scrollLeft = 9999; });
  await p.waitForTimeout(200);
  await p.locator('#settings-dialog fieldset').first().screenshot({ path: join(out, `kiezer-${theme}-rechts.png`) });
  shots.push({ file: `kiezer-${theme}-rechts.png`, group: 'kiezer', name: `kiezer-${theme} (doorgescrold)` });
  await p.context().close();
}
{
  const p = await page({ theme: 'zonnig', scheme: 'light', query: '?vandaag=2027-01-10', extraStats: { unlockedThemes: [], seasonSolves: {} } });
  await p.click('[data-open="settings-dialog"]');
  await p.waitForTimeout(400);
  await p.locator('#settings-dialog fieldset').first().screenshot({ path: join(out, 'kiezer-niets-vrij.png') });
  shots.push({ file: 'kiezer-niets-vrij.png', group: 'kiezer', name: 'kiezer-niets-vrij (januari)' });
  await p.context().close();
}

// Dialogen: instellingen (met de thema-kiezer) en het menu.
for (const [theme, scheme] of only ? [] : [['zonnig', 'light'], ['nacht', 'dark']]) {
  let p = await page({ theme, scheme });
  await p.click('[data-open="settings-dialog"]');
  await p.waitForTimeout(400);
  await shot(p, `instellingen-${theme}`, 'dialogen');
  await p.context().close();
  p = await page({ theme, scheme, game });
  await openPlay(p, null);
  await p.click('#menu-btn');
  await p.waitForTimeout(400);
  await shot(p, `menu-${theme}`, 'dialogen');
  await p.context().close();
}

// Andere staten van het startscherm: dagpuzzel opgelost, bezig, en een smal scherm.
if (!only) {
  let p = await page({ theme: 'zonnig', scheme: 'light', dailyDone: true });
  await shot(p, 'staat-opgelost-zonnig', 'staten', true);
  await p.context().close();
  const daily = { ...game, daily: new Date().toISOString().slice(0, 10) };
  p = await page({ theme: 'nacht', scheme: 'dark', game: daily });
  await shot(p, 'staat-bezig-nacht', 'staten', true);
  await p.context().close();
  p = await page({ theme: 'lelie', scheme: 'light', viewport: { width: 340, height: 700 } });
  await shot(p, 'staat-smal-340-lelie', 'staten', true);
  await p.context().close();
  p = await page({ theme: 'gran-canaria', scheme: 'light', viewport: { width: 520, height: 900 } });
  await shot(p, 'staat-breed-520-gran-canaria', 'staten', true);
  await p.context().close();
}

if (allSizes) {
  for (const [size, viewport] of Object.entries(SIZES)) {
    for (const [theme, scheme] of [['zonnig', 'light'], ['nacht', 'dark']]) {
      let p = await page({ theme, scheme, viewport, game });
      await openPlay(p, selectCell);
      await shot(p, `maat-${size}-spel-${theme}`, 'maten');
      await p.context().close();
      p = await page({ theme, scheme, viewport });
      await shot(p, `maat-${size}-start-${theme}`, 'maten');
      await p.context().close();
    }
  }
}

// Overzichten: alle plaatjes van één groep naast elkaar.
const groups = [...new Set(shots.map((s) => s.group))];
const sheet = await browser.newPage({ deviceScaleFactor: 1 });
for (const g of groups) {
  const items = shots.filter((s) => s.group === g);
  const imgs = await Promise.all(items.map(async (s) => `data:image/png;base64,${(await readFile(join(out, s.file))).toString('base64')}`));
  const html = `<body style="margin:0;padding:12px;background:#888;font:14px sans-serif;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;width:${items.length > 6 ? 2100 : 1700}px">${
    items.map((s, k) => `<figure style="margin:0;width:${g === 'maten' ? 260 : 320}px"><img src="${imgs[k]}" style="width:100%;display:block;border-radius:8px"><figcaption style="color:#fff">${s.name}</figcaption></figure>`).join('')}</body>`;
  await sheet.setContent(html);
  await sheet.waitForTimeout(200);
  await sheet.screenshot({ path: join(out, `overzicht-${g}.png`), fullPage: true });
}
// Per thema één rij: startscherm, spel, hartjespuzzel en onthulling.
if (only) {
  const rows = THEMES.map(([t]) => ['start', 'spel', 'verjaardag-spel', 'hart-onthulling'].map((k) => shots.find((s) => s.name === `${k}-${t}`)));
  const img = async (s) => `data:image/png;base64,${(await readFile(join(out, s.file))).toString('base64')}`;
  const html = `<body style="margin:0;padding:12px;background:#777;font:15px sans-serif;width:${4 * 300 + 5 * 12}px">${(await Promise.all(rows.map(async (row) =>
    `<div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start">${(await Promise.all(row.map(async (s) =>
      `<figure style="margin:0;width:300px"><img src="${await img(s)}" style="width:100%;max-height:650px;object-fit:cover;object-position:top;display:block;border-radius:8px"><figcaption style="color:#fff">${s.name}</figcaption></figure>`))).join('')}</div>`))).join('')}</body>`;
  await sheet.setContent(html);
  await sheet.waitForTimeout(200);
  await sheet.screenshot({ path: join(out, 'overzicht-themas.png'), fullPage: true });
}
await writeFile(join(out, 'index.txt'), shots.map((s) => s.file).join('\n'));
await browser.close();
server.close();
console.log(`${shots.length} screenshots in screenshots/`);
