// De geheime thema's: elke trigger is pure logica (net wel en net niet), los van de DOM.
// Middernacht rekent met de Nederlandse klok, ook rond zomer- en wintertijd.
process.env.TZ = 'Europe/Amsterdam';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, themeById, checkThemeUnlocks, unlockTheme, resolveTheme, keepUp, KEEP_UP, stringRun, STRING_RUN, tapCounter, PIE_TAPS, PALM_TAPS, holdProgress, HOLD_MS, pawCatcher, PAW_CATCH, midnightMinute, struckMidnight } from '../js/themes.js';
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

// ---------- Vertrekhal: de kokosnoot ----------

test('Vertrekhal: vijf tikken op de palmboom laten een kokosnoot vallen, vier niet', () => {
  assert.equal(PALM_TAPS.taps, 5);
  const palm = tapCounter(PALM_TAPS);
  assert.deepEqual([0, 500, 1000, 1500].map(palm), [false, false, false, false]);
  assert.equal(palm(2000), true);
  const slow = tapCounter(PALM_TAPS);
  assert.ok([0, 1300, 2600, 3900, 5200].map(slow).every((x) => !x), 'te langzaam (meer dan 5 s)');
  assert.equal(themeById('gran-canaria').fx, 'gran-canaria');
});

test('Vertrekhal: het klapbordje ratelt door en eindigt op het goede cijfer', async () => {
  const { flapRun, FLAPS, ON_TIME, BOARDING } = await import('../js/fx/vertrekhal.js');
  for (let d = 1; d <= 9; d++) {
    const run = flapRun(d);
    assert.equal(run.length, FLAPS + 1);
    assert.equal(run.at(-1), d);
    assert.ok(run.every((x) => x >= 1 && x <= 9));
    for (let k = 1; k < run.length; k++) assert.equal(run[k], (run[k - 1] % 9) + 1, 'op volgorde, zoals een echt bord');
  }
  assert.equal(ON_TIME, 'LAS PALMAS · ON TIME');
  assert.match(BOARDING, /^BOARDING/);
});

// ---------- Onzichtbare inkt: niet loslaten ----------

test('Onzichtbare inkt: drie seconden ingedrukt houden, 2,999 s is net te kort', () => {
  assert.equal(HOLD_MS, 3000);
  assert.equal(holdProgress(1000, 1000), 0);
  assert.equal(holdProgress(1000, 2500), 0.5);
  assert.ok(holdProgress(1000, 3999) < 1, 'net te kort');
  assert.equal(holdProgress(1000, 4000), 1);
  assert.equal(holdProgress(1000, 99999), 1, 'nooit meer dan 1');
  assert.equal(holdProgress(null, 5000), 0, 'losgelaten');
  assert.equal(holdProgress(5000, 4000), 0, 'nooit minder dan 0');
});

// ---------- Wandeltijd: vang ze! ----------

test('Wandeltijd: vijf verschillende pootjes vangen, vier is een pootje te weinig', () => {
  assert.equal(PAW_CATCH, 5);
  const paw = pawCatcher();
  assert.deepEqual([1, 5, 9, 13].map((id) => paw(id).done), [false, false, false, false]);
  assert.deepEqual(paw(17), { count: 5, done: true });
  assert.deepEqual(paw(21), { count: 5, done: false }, 'daarna niet nog eens');
  // Hetzelfde pootje twee keer telt één keer.
  const twice = pawCatcher();
  for (const id of [1, 1, 5, 5, 9, 13]) twice(id);
  assert.equal(twice(13).count, 4);
  // Elk opgelost-scherm begint opnieuw (een nieuwe teller).
  assert.equal(pawCatcher()(1).count, 1);
  // In de confetti van Zonnig (en Wandeltijd zelf) zitten pootjes.
  for (const id of ['zonnig', 'wandeltijd']) assert.ok(themeById(id).celebrate.includes('🐾'), id);
});

// ---------- Middernacht: de juiste minuut ----------

test('Middernacht: alleen tussen 00:00 en 00:01 (23:59 en 00:01 net niet)', () => {
  assert.equal(midnightMinute(new Date(2026, 10, 3, 23, 59, 59)), false, '23:59:59');
  assert.equal(midnightMinute(new Date(2026, 10, 4, 0, 0, 0)), true, '00:00:00');
  assert.equal(midnightMinute(new Date(2026, 10, 4, 0, 0, 59)), true, '00:00:59');
  assert.equal(midnightMinute(new Date(2026, 10, 4, 0, 1, 0)), false, '00:01');
  assert.equal(midnightMinute(new Date(2026, 10, 4, 12, 0)), false, '12:00 is geen middernacht');
});

test('Middernacht: zomer- en wintertijd maken niet uit', () => {
  // Zomertijd in: zondag 28 maart 2027 (02:00 → 03:00). Middernacht is dan nog CET (UTC+1).
  assert.equal(midnightMinute(new Date('2027-03-27T23:00:30Z')), true, '28 maart 00:00 CET');
  assert.equal(midnightMinute(new Date('2027-03-28T22:00:30Z')), true, '29 maart 00:00 CEST');
  assert.equal(midnightMinute(new Date('2027-03-28T23:00:30Z')), false, '29 maart 01:00, niet de UTC-middernacht');
  // Wintertijd in: zondag 25 oktober 2026 (03:00 → 02:00). Middernacht is dan nog CEST (UTC+2).
  assert.equal(midnightMinute(new Date('2026-10-24T22:00:30Z')), true, '25 oktober 00:00 CEST');
  assert.equal(midnightMinute(new Date('2026-10-25T23:00:30Z')), true, '26 oktober 00:00 CET');
  assert.equal(midnightMinute(new Date('2026-10-25T00:30:00Z')), false, '25 oktober 02:30 (de eerste keer)');
  assert.equal(midnightMinute(new Date('2026-10-25T01:30:00Z')), false, '25 oktober 02:30 (de tweede keer)');
});

test('Middernacht: de klok slaat twaalf als het middernacht wordt, ook in een zomertijdnacht', async () => {
  const { handAngles, STRIKES } = await import('../js/fx/middernacht.js');
  assert.equal(struckMidnight(new Date(2026, 10, 3, 23, 59, 59), new Date(2026, 10, 4, 0, 0, 0)), true);
  assert.equal(struckMidnight(new Date(2026, 10, 4, 0, 0, 0), new Date(2026, 10, 4, 0, 0, 1)), false, 'maar één keer');
  assert.equal(struckMidnight(new Date(2026, 10, 3, 22, 0), new Date(2026, 10, 4, 7, 0)), false, 'pas om 7 uur weer in beeld: geen slagen');
  assert.equal(struckMidnight(new Date('2027-03-27T22:59:59Z'), new Date('2027-03-27T23:00:00Z')), true, 'de nacht van de zomertijd');
  assert.equal(struckMidnight(new Date('2026-10-24T21:59:59Z'), new Date('2026-10-24T22:00:00Z')), true, 'de nacht van de wintertijd');
  assert.equal(STRIKES, 12);
  assert.deepEqual(handAngles(new Date(2026, 10, 4, 0, 0)), { hour: 0, minute: 0 });
  assert.deepEqual(handAngles(new Date(2026, 10, 4, 15, 30)), { hour: 105, minute: 180 });
});
