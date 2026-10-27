// De geheime thema's: elke trigger is pure logica (net wel en net niet), los van de DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, themeById, checkThemeUnlocks, unlockTheme, resolveTheme, keepUp, KEEP_UP } from '../js/themes.js';
import { THEME_UNLOCK_TEXT, THEME_EMOJI } from '../js/messages.js';
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
