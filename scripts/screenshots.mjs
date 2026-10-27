// Maakt screenshots van het startscherm en het speelscherm in alle thema's,
// plus de verjaardag, de hart-onthulling, Dagverloop op vier tijden, de
// zonnebloem in elk stadium en de effecten bij het oplossen. Handig na een ontwerpwijziging.
// Gebruik: node scripts/screenshots.mjs [--maten] [--themas=liefde,sterren] [--boekje]   (vereist Playwright + Chromium)
// Met --boekje alleen het Techniekenboekje (in een paar lichte en donkere thema's).
// Met --natuur alleen de natuurthema's: start en spel, de dieren (via ?dier=1) en de effecten bij het oplossen.
// Met --geheim alleen de geheime thema's: start, spel en opgelost per thema, plus elke trigger en de teller.
// Met --themas alleen die thema's (start, spel en hartjespuzzel) plus een overzicht per thema.
// De plaatjes komen in screenshots/ (staat niet in git), met per scherm een overzicht.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { generate, generateHeart, generateShape, SHAPES } from '../js/generator.js';
import { THEMES as ALL_THEMES, LOCKED_THEME_IDS } from '../js/themes.js';
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
const THEMES = ALL_THEMES.map((t) => [t.id, t.scheme])
  .filter(([id]) => !only || only.includes(id));
const IPHONE13 = { width: 390, height: 844 };
// Met een iPhone-useragent verschijnt ook het 'zet op beginscherm'-bannertje.
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const SIZES = { se: { width: 375, height: 667 }, iphone13: IPHONE13, promax: { width: 430, height: 932 }, liggend: { width: 844, height: 390 } };

const browser = await chromium.launch();
await mkdir(out, { recursive: true });
const shots = [];

// De dagthema's staan uit (anders kiest de app op bijv. haar verjaardag of een
// wedstrijddag zelf het thema), behalve met dayTheme: true.
async function page({ theme, scheme, viewport = IPHONE13, game = null, query = '', reducedMotion = 'no-preference', dailyDone = false, extraStats = {}, dayTheme = false }) {
  if (!dayTheme) query += `${query.includes('?') ? '&' : '?'}dagthema=uit`;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  // Met ?vandaag= gebruikt de app een aparte testopslag.
  const prefix = query.includes('vandaag=') ? 'rubys-sudoku-test:' : 'rubys-sudoku:';
  await ctx.addInitScript(({ theme, stats, game, dailyDone, extraStats, prefix, locked }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem(prefix + 'settings', JSON.stringify({ theme }));
    const done = dailyDone ? { dailyDone: [key], dailyTimes: { [key]: 372000 } } : {};
    // Alle thema's staan vrij (seizoenen, Robijn, Game Boy…), anders zou het thema terugvallen op zonnig.
    const seasons = { unlockedThemes: locked };
    localStorage.setItem(prefix + 'stats', JSON.stringify({ ...stats, ...done, ...seasons, ...extraStats, lastSolvedDay: key }));
    localStorage.setItem(prefix + 'unlocked', JSON.stringify(['eerste', 'dag1', 'zonderhint']));
    if (game) localStorage.setItem(prefix + 'game', JSON.stringify(game));
  }, { theme, stats, game, dailyDone, extraStats, prefix, locked: LOCKED_THEME_IDS });
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
  // Het hart van vandaag ga je verder via de speciale kaart zelf, de rest via "Verder puzzelen".
  await p.click((await p.locator('.card.continue').count()) ? '.card.continue' : '.card.special');
  await p.waitForSelector('#play:not([hidden])');
  if (select != null) await p.click(`.cell[data-i="${select}"]`);
  await p.waitForTimeout(400);
}

// Het Techniekenboekje: 7 van de 13 technieken ontdekt, in lichte en donkere thema's.
const BOOK_STATS = { techniques: {
  'full-house': { since: '2026-10-02', hints: 3 }, 'hidden-single': { since: '2026-10-02', hints: 9 }, 'naked-single': { since: '2026-10-05', hints: 2 },
  pointing: { since: '2026-10-11', hints: 2 }, 'naked-pair': { since: '2026-10-18', hints: 1 }, 'hidden-pair': { since: '2026-10-21', hints: 1 }, 'x-wing': { since: '2026-10-23', hints: 1 },
} };
async function bookShots(themes) {
  for (const [theme, scheme] of themes) {
    const p = await page({ theme, scheme, query: '?vandaag=2026-10-24', extraStats: BOOK_STATS });
    await p.click('[data-open="stats-dialog"]');
    await p.click('.stats-tabs label:has(input[value="boekje"])');
    await p.waitForSelector('#book .mini-sudoku');
    await p.waitForTimeout(400);
    await shot(p, `boekje-${theme}`, 'boekje');
    for (const id of ['pointing', 'x-wing']) {
      await p.locator(`#book [data-technique="${id}"]`).screenshot({ path: join(out, `boekje-${id}-${theme}.png`) });
      shots.push({ file: `boekje-${id}-${theme}.png`, group: 'boekje', name: `${id} (${theme})` });
    }
    await p.evaluate(() => { document.querySelector('#stats-dialog').scrollTop = 99999; });
    await p.waitForTimeout(200);
    await shot(p, `boekje-onder-${theme}`, 'boekje');
    await p.context().close();
  }
}
// Natuur: start en spel per thema, het zeehondje en het eekhoorntje (?dier=1 haalt ze
// meteen tevoorschijn), en het opgelost-moment (blaadjes, noorderlicht, visjes).
async function natureShots() {
  const NATUUR = [['waddenzee', 'light'], ['bos', 'light'], ['noorderlicht', 'dark'], ['regen', 'dark'], ['onderwater', 'light']];
  const g = playGame();
  const sel = g.values.findIndex((v, i) => v && !g.givens[i] && v === g.solution[i]);
  for (const [theme, scheme] of NATUUR) {
    let p = await page({ theme, scheme, query: '?dier=1' });
    await p.waitForTimeout(1600);
    await shot(p, `natuur-start-${theme}`, 'natuur', false);
    await p.context().close();
    p = await page({ theme, scheme, game: g, query: '?dier=1' });
    await openPlay(p, sel);
    await p.waitForTimeout(9800); // met ?dier=1 komt het dier na ~8 s opnieuw kijken
    await shot(p, `natuur-spel-${theme}`, 'natuur');
    await p.context().close();
    const a = heartGame(true);
    p = await page({ theme, scheme, game: { ...a.game, special: null, shape: null } });
    await openPlay(p, a.last);
    await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
    await p.waitForTimeout(theme === 'onderwater' ? 2400 : 1500);
    await shot(p, `natuur-opgelost-${theme}`, 'natuur');
    await p.context().close();
  }
  // Met minder beweging: een stilstaand beeld.
  for (const [theme, scheme] of [['regen', 'dark'], ['onderwater', 'light']]) {
    const p = await page({ theme, scheme, game: g, reducedMotion: 'reduce' });
    await openPlay(p, sel);
    await shot(p, `natuur-stil-${theme}`, 'natuur');
    await p.context().close();
  }
}

// De geheime thema's: start, spel en het opgelost-moment, en elke trigger in actie.
async function secretShots() {
  const SECRET = ALL_THEMES.filter((t) => t.unlock?.secret).map((t) => [t.id, t.scheme]);
  const g = playGame();
  const sel = g.values.findIndex((v, i) => !v && !g.notes[i]);
  const solvedMoment = async (theme, scheme, name, wait = 2400) => {
    const a = heartGame(true);
    const p = await page({ theme, scheme, game: { ...a.game, special: null, shape: null } });
    // Geen mijlpaal-berichtjes over het opgelost-moment heen.
    await p.evaluate(() => localStorage.setItem('rubys-sudoku:unlocked', JSON.stringify(['eerste', 'dag1', 'zonderhint', 'tien', 'streak3', 'vijfentwintig', 'geheimen'])));
    await p.reload();
    await p.waitForTimeout(450);
    await openPlay(p, a.last);
    await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
    await p.waitForTimeout(wait);
    return p;
  };
  for (const [theme, scheme] of SECRET) {
    let p = await page({ theme, scheme });
    await shot(p, `geheim-start-${theme}`, 'geheim');
    await p.context().close();
    p = await page({ theme, scheme, game: g });
    await openPlay(p, sel);
    await p.waitForTimeout(theme === 'kampvuur' ? 3000 : 300);
    await shot(p, `geheim-spel-${theme}`, 'geheim');
    await p.context().close();
    p = await solvedMoment(theme, scheme, theme, { vertrekhal: 2200, preitaart: 900, 'onzichtbare-inkt': 2000, wandeltijd: 1300 }[theme] ?? 1600);
    // Het opgelost-scherm even weg, zodat het effect op het bord te zien is.
    await p.evaluate(() => document.querySelector('#solved-dialog')?.close());
    await shot(p, `geheim-opgelost-${theme}`, 'geheim');
    await p.context().close();
  }
  // De triggers.
  let p = await page({ theme: 'volleybal', scheme: 'light', query: '?bal=1' });
  await p.click('.keepup-ball');
  await p.click('.keepup-ball', { force: true });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);
  await shot(p, 'geheim-trigger-sporthal-bal', 'geheim');
  await p.context().close();
  p = await page({ theme: 'gran-canaria', scheme: 'light' });
  for (let k = 0; k < 5; k++) await p.click('.palm-tree');
  await p.waitForTimeout(900);
  await shot(p, 'geheim-trigger-vertrekhal-kokosnoot', 'geheim');
  await p.context().close();
  p = await page({ theme: 'zonnig', scheme: 'light', query: '?begroeting=preitaart' });
  await shot(p, 'geheim-trigger-preitaart-begroeting', 'geheim');
  await p.context().close();
  p = await solvedMoment('briefje', 'light', 'briefje', 2400);
  await p.evaluate(() => document.querySelector('.solved-heart')?.style.setProperty('--uv', '0.7'));
  await shot(p, 'geheim-trigger-onzichtbare-inkt-hartje', 'geheim');
  await p.context().close();
  p = await solvedMoment('zonnig', 'light', 'zonnig', 4200);
  await shot(p, 'geheim-trigger-wandeltijd-pootjes', 'geheim');
  await p.context().close();
  // De teller onder Statistieken, met een paar geheimen gevonden.
  p = await page({ theme: 'nacht', scheme: 'dark', extraStats: { unlockedThemes: ['gameboy', 'kampvuur', 'preitaart'], themeUnlockDates: { gameboy: '2026-10-30', kampvuur: '2026-11-02' } } });
  await p.click('[data-open="stats-dialog"]');
  await p.click('.secrets-line');
  await p.evaluate(() => { const d = document.querySelector('#stats-dialog'); d.scrollTop = d.scrollHeight; });
  await p.waitForTimeout(300);
  await shot(p, 'geheim-teller', 'geheim');
  await p.context().close();
}

if (process.argv.includes('--geheim')) {
  await secretShots();
} else if (process.argv.includes('--natuur')) {
  await natureShots();
} else if (process.argv.includes('--boekje')) {
  await bookShots([['zonnig', 'light'], ['nacht', 'dark'], ['briefje', 'light'], ['rubyxcube', 'light'], ['hoog-contrast', 'light'], ['robijn', 'dark'], ['krijtbord', 'dark']]);
} else {

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

// Dagverloop op vier momenten van de dag (ochtend, middag, avond, nacht), start en spel.
if (!only || only.includes('dagverloop')) {
  // 's Nachts om kwart voor elf: nog net vóór de slaapstand (die maakt alles zwart-wit).
  for (const [name, time] of [['ochtend', '07:30'], ['middag', '13:00'], ['avond', '18:30'], ['nacht', '22:45']]) {
    let p = await page({ theme: 'dagverloop', scheme: 'light', query: `?vandaag=2027-03-03T${time}`, extraStats: { unlockedThemes: [] } });
    await p.waitForTimeout(500);
    await shot(p, `dagverloop-${name}-start`, 'dagverloop');
    await p.context().close();
    p = await page({ theme: 'dagverloop', scheme: 'light', game, query: `?vandaag=2027-03-03T${time}` });
    await openPlay(p, selectCell);
    await p.waitForTimeout(500);
    await shot(p, `dagverloop-${name}-spel`, 'dagverloop');
    await p.context().close();
  }
}

// Zonnebloem: de bloem in elk groeistadium (aantal gespeelde dagen).
if (!only || only.includes('zonnebloem')) {
  const days = (n) => Array.from({ length: n }, (_, k) => { const d = new Date(2026, 6, 1 + k); return [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, 'koffie', 300, 0, 0]; });
  for (const [stage, n] of [['zaadje', 0], ['kiem', 2], ['steel', 8], ['knop', 20], ['bloem', 35], ['volle-bloem', 50], ['volle-bloem-60', 60]]) {
    const p = await page({ theme: 'zonnebloem', scheme: 'light', extraStats: { log: days(n) } });
    await p.locator('.home-head').screenshot({ path: join(out, `zonnebloem-${stage}.png`) });
    shots.push({ file: `zonnebloem-${stage}.png`, group: 'zonnebloem', name: `${stage} (${n} dagen)` });
    await p.context().close();
  }
}

// Effecten bij het oplossen: het latte-hartje, de kubus halverwege en Game Boy.
for (const [theme, wait] of [['koffiemonster', 1700], ['rubyxcube', 560], ['gameboy', 700]].filter(([t]) => !only || only.includes(t))) {
  const a = heartGame(true);
  const p = await page({ theme, scheme: 'light', game: { ...a.game, special: null, shape: null } });
  await openPlay(p, a.last);
  await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
  await p.waitForTimeout(wait);
  await shot(p, `opgelost-${theme}`, 'effecten');
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

// Thema-kiezer: Winter vrij, Herfst op 2 van 3 (vandaag is het herfst), Robijn en Game Boy vrij, de rest dicht.
for (const [theme, scheme] of [['zonnig', 'light'], ['sterren', 'dark'], ['winter', 'light'], ['krijtbord', 'dark']]) {
  const p = await page({ theme, scheme, query: '?vandaag=2026-10-21', extraStats: { unlockedThemes: ['winter', 'robijn', 'gameboy'], seasonSolves: { 'herfst-2026': 2 }, totalSolved: 18, bestStreak: 4 } });
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
  await shot(p, 'kiezer-scherm-niets-vrij', 'kiezer');
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

// Kalender in Statistieken: een maand met gewone dagen, dagpuzzels, records en speciale dagen.
const CAL_LOG = [
  ['2026-09-29', 'zondag', 260, 0, 0, 'jubileum-2026'], ['2026-10-01', null, 402, null, 1], ['2026-10-03', 'koffie', 402, 1, 1],
  ['2026-10-03', 'zondag', 241, 0, 2], ['2026-10-12', 'nadenken', 912, 2, 0, 'verjaardag-2026'], ['2026-10-18', 'zondag', 280, 0, 1],
  ['2026-10-20', 'ruby', 1500, 3, 0], ['2026-10-21', 'koffie', 330, 0, 3], ['2026-10-22', 'koffie', 312, 0, 1], ['2026-10-22', 'nadenken', 845, 1, 2],
];
const CAL_THEMES = only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark'], ['briefje', 'light'], ['sterren', 'dark'], ['volleybal', 'light']];
for (const [theme, scheme] of CAL_THEMES) {
  const p = await page({ theme, scheme, query: '?vandaag=2026-10-22', extraStats: { log: CAL_LOG } });
  await p.click('[data-open="stats-dialog"]');
  await p.click('.stats-tabs label:has(input[value="kalender"])');
  await p.waitForTimeout(400);
  await shot(p, `kalender-${theme}`, 'kalender');
  await p.context().close();
}

// Wedstrijddag (do 22 oktober, 21:00 uit bij DIO Bedum): vóór de wedstrijd,
// "hoe ging het?" en na het antwoord. Ook op iPhone-SE-breedte.
const MATCH_STATES = [
  ['voor', '?vandaag=2026-10-22T18:00', {}],
  ['vraag', '?vandaag=2026-10-22T23:30', { matches: { '2026-10-22': { warmup: true, pep: 0 } } }],
  ['na', '?vandaag=2026-10-22T23:30', { matches: { '2026-10-22': { warmup: true, pep: 0, uitslag: 'verloren' } } }],
];
const MATCH_THEMES = only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark'], ['volleybal', 'light'], ['briefje', 'light']];
for (const [theme, scheme] of MATCH_THEMES) {
  for (const [state, query, extraStats] of MATCH_STATES) {
    const p = await page({ theme, scheme, query, extraStats });
    await shot(p, `wedstrijd-${state}-${theme}`, 'wedstrijd');
    await p.context().close();
  }
}
for (const [state, query, extraStats] of only ? [] : MATCH_STATES) {
  const p = await page({ theme: 'zonnig', scheme: 'light', viewport: SIZES.se, query, extraStats });
  await shot(p, `wedstrijd-${state}-se`, 'wedstrijd');
  await p.context().close();
}

// Figuurpuzzels: elke figuur als bord (ongeveer een derde ingevuld), in een paar thema's.
const FIGURE_THEMES = only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark'], ['briefje', 'light']];
for (const name of Object.keys(SHAPES)) {
  const f = generateShape(name, 1);
  const values = f.givens.slice();
  let k = 0;
  for (let i = 0; i < 81; i++) if (!values[i] && k++ % 3 === 0) values[i] = f.solution[i];
  const g = { v: 1, id: `figuur-${name}`, givens: f.givens, solution: f.solution, levelId: f.levelId, daily: null, special: null, shape: name,
    values, notes: new Array(81).fill(0), elapsed: 95000, mistakes: 0, hints: 0, solved: false, startedAt: 0 };
  for (const [theme, scheme] of FIGURE_THEMES) {
    const p = await page({ theme, scheme, game: g });
    await openPlay(p, null);
    await p.waitForTimeout(350);
    await p.locator('#board').screenshot({ path: join(out, `figuur-${name}-${theme}.png`) });
    shots.push({ file: `figuur-${name}-${theme}.png`, group: 'figuren', name: `${name} (${theme})` });
    await p.context().close();
  }
}

// Kaartjes van de speciale dagen op het startscherm.
const SPECIAL_CARDS = [
  ['halfjaar', '2027-03-29'], ['honderd', '2027-01-07'], ['app-verjaardag', '2027-10-21'], ['thuiswedstrijd', '2027-04-17T09:00'],
  ['valentijn', '2027-02-14'], ['pasen', '2027-03-28'], ['koningsdag', '2027-04-27'], ['halloween', '2026-10-31T10:00'],
  ['sinterklaas', '2026-12-05'], ['kerst', '2026-12-25'], ['tweede-kerstdag', '2026-12-26'], ['nieuwjaar', '2027-01-01'], ['maandversary', '2026-11-29'],
];
for (const [kind, day] of only ? [] : SPECIAL_CARDS) {
  for (const [theme, scheme] of FIGURE_THEMES) {
    const p = await page({ theme, scheme, query: `?vandaag=${day}`, extraStats: { totalSolved: 247, bestStreak: 31 } });
    await shot(p, `kaartje-${kind}-${theme}`, 'kaartjes');
    await p.context().close();
  }
}

// Slaapstand ('s avonds na 23:00): startscherm, spel en het slaapberichtje.
const SLEEP_THEMES = only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark'], ['briefje', 'light']];
for (const [theme, scheme] of SLEEP_THEMES) {
  let p = await page({ theme, scheme, query: '?vandaag=2026-11-02T23:30' });
  await p.waitForTimeout(2200); // het filter komt er in 2 seconden overheen
  await shot(p, `slaap-start-${theme}`, 'slaapstand');
  await p.context().close();
  p = await page({ theme, scheme, game, query: '?vandaag=2026-11-02T23:30' });
  await openPlay(p, selectCell);
  await p.waitForTimeout(2000);
  await shot(p, `slaap-spel-${theme}`, 'slaapstand');
  await p.context().close();
  const a = heartGame(true);
  p = await page({ theme, scheme, game: { ...a.game, special: null, shape: null }, query: '?vandaag=2026-11-02T23:30' });
  await openPlay(p, a.last);
  await p.click(`.num[data-d="${heart.solution[a.last]}"]`);
  await p.waitForSelector('#solved-dialog[open]', { timeout: 8000 });
  await p.waitForTimeout(2500);
  await shot(p, `slaap-opgelost-${theme}`, 'slaapstand');
  await p.context().close();
}

// Ruby Wrapped: het kaartje op het startscherm en elke kaart van het verhaal,
// voor een vol jaar (2027) en het eerste, gedeeltelijke jaar (2026, in slaapstand).
const WRAPPED_LOG = [];
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= 28; d += m === 3 ? 1 : 3) {
    const day = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const lv = ['zondag', 'koffie', 'koffie', 'nadenken', 'ruby'][(m + d) % 5];
    WRAPPED_LOG.push([day, lv, 200 + ((m * 37 + d * 11) % 900), d % 4 ? 0 : 1, d % 2, null, [21, 22, 20, 8, 21][(m + d) % 5]]);
  }
}
WRAPPED_LOG.push(['2027-02-14', 'zondag', 300, 0, 0, 'valentijn-2027', 22], ['2027-10-12', 'nadenken', 700, 0, 0, 'verjaardag-2027', 19]);
WRAPPED_LOG.sort((a, b) => (a[0] < b[0] ? -1 : 1));
async function wrappedShots(theme, scheme, query, extraStats, tag) {
  const p = await page({ theme, scheme, query, extraStats });
  await p.waitForTimeout(2200);
  await shot(p, `wrapped-${tag}-start-${theme}`, 'wrapped');
  await p.click('#wrapped-slot .card');
  await p.waitForSelector('#wrapped-dialog[open]');
  const n = await p.locator('#wr-progress span').count();
  for (let k = 0; k < n; k++) {
    if (k) await p.click('#wr-next');
    await p.waitForTimeout(600);
    const id = await p.getAttribute('#wr-card', 'data-card');
    await shot(p, `wrapped-${tag}-${String(k + 1).padStart(2, '0')}-${id}-${theme}`, 'wrapped');
  }
  await p.context().close();
}
for (const [theme, scheme] of only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark']]) {
  await wrappedShots(theme, scheme, '?vandaag=2027-12-31T20:00', { log: WRAPPED_LOG }, '2027');
}
if (!only) {
  const first = [['2026-10-21', 'koffie', 330, 0, 3, null, 21], ['2026-10-22', 'koffie', 312, 0, 1, null, 22], ['2026-10-22', 'nadenken', 845, 1, 2, null, 23],
    ['2026-11-07', 'zondag', 260, 0, 1, null, 20], ['2026-12-25', 'zondag', 290, 0, 0, 'kerst-2026', 11]];
  await wrappedShots('briefje', 'light', '?vandaag=2026-12-31T23:30', { log: first }, '2026');
}

// Dagthema's: elke dag waarop de app het thema kiest (met haar eigen keuze
// Lelie), de themakiezer die dan dicht zit, en Volleybal met elk ander accent.
const DAY_THEME_DAYS = [
  ['wedstrijd', '2026-11-14', {}], ['wedstrijd-halloween', '2026-10-31', {}], ['jubileum', '2027-09-29', {}],
  ['halfjaar', '2027-03-29', {}], ['honderd', '2027-01-07', {}], ['valentijn', '2027-02-14', {}],
  ['verjaardag', '2027-10-12', {}], ['app-verjaardag', '2027-10-21', {}], ['kerst-sterren', '2026-12-25', { unlockedThemes: [] }],
  ['kerst-winter', '2026-12-25', { unlockedThemes: ['winter'] }], ['sinterklaas', '2026-12-05', { unlockedThemes: [] }],
  ['oudjaar', '2026-12-31', {}], ['nieuwjaar', '2027-01-01', {}], ['halloween', '2027-10-31', {}],
  ['pasen-zonnig', '2027-03-28', { unlockedThemes: [] }], ['pasen-lente', '2027-03-28', { unlockedThemes: ['lente'] }],
  ['koningsdag', '2027-04-27', {}], ['eerste-winterdag', '2027-12-01', { unlockedThemes: ['winter'] }],
  ['vrijspeeldag-herfst', '2027-10-05', { unlockedThemes: ['herfst'], themeUnlockDates: { herfst: '2027-10-05' } }],
];
if (!only) {
  for (const [name, day, extraStats] of DAY_THEME_DAYS) {
    const p = await page({ theme: 'lelie', scheme: 'light', query: `?vandaag=${day}`, extraStats, dayTheme: true });
    await shot(p, `dagthema-${name}`, 'dagthemas');
    if (name === 'wedstrijd-halloween' || name === 'verjaardag') {
      await p.click('[data-open="settings-dialog"]');
      await p.waitForTimeout(400);
      await p.locator('#settings-dialog fieldset').first().screenshot({ path: join(out, `dagthema-kiezer-${name}.png`) });
      shots.push({ file: `dagthema-kiezer-${name}.png`, group: 'dagthemas', name: `kiezer dicht (${name})` });
    }
    await p.context().close();
  }
  // Volleybal met elk accent (zo ziet een wedstrijd op zo'n dag eruit), met een bord.
  for (const t of ALL_THEMES) {
    const p = await page({ theme: 'volleybal', scheme: 'light', game });
    await p.evaluate((a) => { document.documentElement.dataset.accent = a; }, t.id);
    await openPlay(p, selectCell);
    await p.evaluate((a) => { document.documentElement.dataset.accent = a; }, t.id);
    await p.waitForTimeout(200);
    await shot(p, `dagthema-volleybal-${t.id}`, 'accenten');
    await p.context().close();
  }
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

await bookShots(only ? THEMES : [['zonnig', 'light'], ['nacht', 'dark']]);
if (!only) await natureShots();
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
