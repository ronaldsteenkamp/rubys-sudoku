// De geheime thema's: elke trigger is pure logica (net wel en net niet), los van de DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, themeById, checkThemeUnlocks, unlockTheme, resolveTheme, keepUp, KEEP_UP, stringRun, STRING_RUN, tapCounter, PIE_TAPS } from '../js/themes.js';
import { THEME_UNLOCK_TEXT, THEME_EMOJI, GREETINGS, PIE_GREETING, pieGreeting } from '../js/messages.js';
import { emptyStats } from '../js/storage.js';

const SECRETS = THEMES.filter((t) => t.unlock?.secret);
const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

test('geheime thema\'s: in het groepje Geheim, met tekst, emoji en icoon, en nooit vrij door te spelen', () => {
  const st = { ...emptyStats(), totalSolved: 9999, bestStreak: 999, noHintSolved: 999, levels: { ruby: { solved: 999 } } };
  for (const t of SECRETS) {
    assert.equal(t.group, 'geheim', t.id);
    assert.ok(THEME_UNLOCK_TEXT[t.id] && THEME_EMOJI[t.id] && t.emoji && t.icon, t.id);
    assert.equal(resolveTheme(t.id, at(2026, 11, 3), []), 'zonnig', `${t.id}: nog niet te kiezen`);
  }
  assert.deepEqual(checkThemeUnlocks(st, at(2027, 8, 15)).filter((id) => SECRETS.some((t) => t.id === id)), []);
  // Eén keer vrij; een tweede keer doet niets extra's.
  for (const t of SECRETS) {
    assert.equal(unlockTheme(st, t.id, at(2026, 11, 3)), true, t.id);
    assert.equal(unlockTheme(st, t.id, at(2026, 11, 4)), false, t.id);
    assert.equal(st.themeUnlockDates[t.id], '2026-11-03');
  }
});

// ---------- Sporthal: 33 keer hooghouden ----------

const juggle = (n, { gap = 800, start = 1000 } = {}) => {
  const ball = keepUp();
  let last;
  for (let k = 0; k < n; k++) last = ball.tap(start + k * gap);
  return { ball, last };
};

test('Sporthal: 33 keer hooghouden speelt hem vrij, 32 keer niet', () => {
  assert.equal(KEEP_UP.target, 33);
  assert.deepEqual(juggle(32).last, { count: 32, done: false });
  assert.deepEqual(juggle(33).last, { count: 33, done: true });
  // Daarna blijft hij gewoon tellen, maar zegt hij niet nog eens done.
  const { ball } = juggle(33);
  assert.equal(ball.tap(1000 + 33 * 800).done, false);
});

test('Sporthal: valt de bal, dan begint de telling opnieuw', () => {
  const ball = keepUp();
  for (let k = 0; k < 20; k++) ball.tap(k * 1000);
  assert.equal(ball.count, 20);
  const landed = 19 * 1000 + KEEP_UP.airtime;
  assert.equal(ball.fell(landed - 1), false, 'net nog in de lucht');
  assert.equal(ball.fell(landed), true, 'geland');
  assert.deepEqual(ball.tap(landed), { count: 1, done: false }, 'te laat: opnieuw bij 1');
  // Precies te laat bij de 33e tik: dan niet.
  const late = keepUp();
  for (let k = 0; k < 32; k++) late.tap(k * 1000);
  assert.deepEqual(late.tap(31 * 1000 + KEEP_UP.airtime), { count: 1, done: false });
  assert.equal(keepUp().fell(0), false, 'een bal die nog ligt, is niet gevallen');
});

test('Sporthal: het applaus is kort en zacht begrensd', async () => {
  const { applause } = await import('../js/fx/lib/klank.js');
  const { WHISTLE } = await import('../js/fx/sporthal.js');
  const a = applause({ sampleRate: 8000 });
  assert.equal(a.length, 8000 * 1.6);
  assert.ok(Math.max(...a.map(Math.abs)) <= 1 && a.some((v) => Math.abs(v) > 0.5));
  assert.equal(a[a.length - 1], 0, 'zonder klik aan het eind');
  assert.ok(WHISTLE.every(([s, d]) => s >= 0 && d > 0 && s + d < 1), 'het fluitje duurt kort');
  assert.equal(themeById('volleybal').fx, 'volleybal', 'de bal ligt in Volleybal');
});

// ---------- Kampvuur: zes oplopende tonen ----------

const play = (digits, gaps) => {
  const run = stringRun();
  let t = 0;
  return digits.map((d, k) => run(d, (t += k ? gaps[k - 1] ?? gaps[0] : 0)));
};

test('Kampvuur: zes oplopende tonen, elk binnen 2 seconden, zetten het vuurtje aan', () => {
  assert.deepEqual(STRING_RUN, { length: 6, within: 2000 });
  assert.deepEqual(play([1, 2, 3, 4, 5, 6], [300]), [false, false, false, false, false, true]);
  // Ook met sprongetjes, als het maar steeds hoger wordt; precies 2 s ertussen mag nog.
  assert.equal(play([1, 3, 4, 6, 8, 9], [2000]).at(-1), true);
  // Vijf is te weinig.
  assert.ok(play([2, 3, 4, 5, 6], [300]).every((x) => !x));
});

test('Kampvuur: te traag, niet oplopend of dezelfde toon telt niet', () => {
  assert.equal(play([1, 2, 3, 4, 5, 6], [300, 300, 300, 300, 2001]).at(-1), false, 'de laatste te laat');
  assert.equal(play([1, 2, 3, 5, 4, 6], [300]).at(-1), false, 'niet oplopend');
  assert.equal(play([1, 2, 3, 3, 4, 5], [300]).at(-1), false, 'dezelfde toon twee keer');
  // Een reeks die mislukt, telt opnieuw vanaf de toon waar het misging.
  assert.equal(play([5, 1, 2, 3, 4, 6, 7], [300]).at(-2), false);
  assert.equal(play([9, 1, 2, 3, 4, 5, 6], [300]).at(-1), true, 'een nieuwe reeks vanaf de 1');
  // Na een gelukte reeks begint hij weer opnieuw.
  assert.deepEqual(play([1, 2, 3, 4, 5, 6, 7], [300]).slice(-2), [true, false]);
});

test('Kampvuur: het knisperen is kort en eindigt zonder klik', async () => {
  const { crackle } = await import('../js/fx/lib/klank.js');
  const { SPARKS } = await import('../js/fx/kampvuur.js');
  const c = crackle({ sampleRate: 8000 });
  assert.ok(c.length <= 8000 * 1.5 && c.some((v) => Math.abs(v) > 0.5) && c[c.length - 1] === 0);
  assert.ok(SPARKS <= 20, 'een vast, klein aantal vonkjes');
});

// ---------- Preitaart: drie tikken op de taart ----------

test('Preitaart: de begroeting met de 🥧 bestaat, en is te forceren', () => {
  assert.ok(GREETINGS.avond.includes(PIE_GREETING));
  assert.equal(PIE_GREETING('Ruby'), 'Hé Ruby, preitaart gegeten? 🥧');
  assert.match(pieGreeting(() => 0), /^Hé \S+, preitaart gegeten\? 🥧$/);
});

test('Preitaart: drie tikken op de 🥧 (binnen 3 seconden), twee is te weinig', () => {
  assert.deepEqual(PIE_TAPS, { taps: 3, within: 3000 });
  const tap = tapCounter(PIE_TAPS);
  assert.deepEqual([0, 400, 800].map(tap), [false, false, true]);
  const two = tapCounter(PIE_TAPS);
  assert.deepEqual([0, 400].map(two), [false, false]);
  // Te langzaam: de eerste tik is dan al vergeten.
  const slow = tapCounter(PIE_TAPS);
  assert.deepEqual([0, 1600, 3000, 3100].map(slow), [false, false, false, true]);
});
