// Tijden zijn lokale tijd; we testen in de tijdzone van Ruby.
process.env.TZ = 'Europe/Amsterdam';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSleepTime, sleepActive, sleepColor, SLEEP_FILTER, SLEEP_SETTINGS } from '../js/sleep.js';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../js/storage.js';

const at = (y, m, d, h, mi = 0) => new Date(y, m - 1, d, h, mi);

test('slaapstand automatisch: van 23:00 tot 06:00', () => {
  assert.equal(isSleepTime(at(2026, 12, 31, 22, 59)), false);
  assert.equal(isSleepTime(at(2026, 12, 31, 23, 0)), true);
  assert.equal(isSleepTime(at(2027, 1, 1, 0, 30)), true);
  assert.equal(isSleepTime(at(2027, 1, 1, 5, 59)), true);
  assert.equal(isSleepTime(at(2027, 1, 1, 6, 0)), false);
  assert.equal(isSleepTime(at(2027, 1, 1, 14, 0)), false);
});

test('slaapstand rond de overgang van zomer- naar wintertijd (25 oktober 2026)', () => {
  // 02:00–03:00 komt die nacht twee keer voor; het blijft gewoon slaapstand.
  assert.equal(isSleepTime(at(2026, 10, 24, 23, 0)), true);
  assert.equal(isSleepTime(at(2026, 10, 25, 2, 30)), true);
  const later = new Date(at(2026, 10, 25, 2, 30).getTime() + 3600000); // een uur later: nog steeds 02:30 (wintertijd)
  assert.equal(later.getHours(), 2);
  assert.equal(isSleepTime(later), true);
  assert.equal(isSleepTime(at(2026, 10, 25, 5, 59)), true);
  assert.equal(isSleepTime(at(2026, 10, 25, 6, 0)), false);
  // En in maart (zomertijd): 02:30 bestaat niet, de klok springt naar 03:30.
  assert.equal(isSleepTime(at(2027, 3, 28, 2, 30)), true);
  assert.equal(isSleepTime(at(2027, 3, 28, 6, 0)), false);
});

test('slaapstand aan, uit of automatisch', () => {
  assert.deepEqual(SLEEP_SETTINGS, ['auto', 'aan', 'uit']);
  assert.equal(DEFAULT_SETTINGS.sleep, 'auto');
  assert.equal(sleepActive('aan', at(2027, 1, 1, 14)), true);
  assert.equal(sleepActive('uit', at(2027, 1, 1, 23, 30)), false);
  assert.equal(sleepActive('auto', at(2027, 1, 1, 23, 30)), true);
  assert.equal(sleepActive('auto', at(2027, 1, 1, 14)), false);
});

test('een onbekende slaapstand-instelling valt terug op automatisch', () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  saveSettings({ ...DEFAULT_SETTINGS, sleep: 'misschien' });
  assert.equal(loadSettings().sleep, 'auto');
  saveSettings({ ...DEFAULT_SETTINGS, sleep: 'uit' });
  assert.equal(loadSettings().sleep, 'uit');
  delete globalThis.localStorage;
});

test('het slaapfilter maakt warmer en donkerder', () => {
  const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const [r, g, b] = rgb(sleepColor('#ffffff'));
  assert.ok(r < 255 && b <= g && g <= r, 'wit wordt warm en gedimd');
  const [, , b2] = rgb(sleepColor('#4a86e8'));
  assert.ok(b2 < 0xe8, 'minder blauw');
  assert.ok(SLEEP_FILTER.brightness < 1 && SLEEP_FILTER.sepia > 0);
});
