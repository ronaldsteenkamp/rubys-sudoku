import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sunflowerGrowth, sunflowerSvg, playedDays, STAGES, FULL_DAYS } from '../js/fx/zonnebloem.js';
import { JINGLE } from '../js/fx/gameboy.js';
import { THEMES } from '../js/themes.js';

test('elk effect hoort bij een thema, en elk thema met een effect heeft een module', () => {
  const files = readdirSync(new URL('../js/fx/', import.meta.url)).map((f) => f.replace(/\.js$/, ''));
  const used = THEMES.filter((t) => t.fx).map((t) => t.fx);
  assert.deepEqual([...used].sort(), [...files].sort());
});

test('ui.js laadt de effecten pas als het thema te zien is (geen vaste import)', () => {
  const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
  assert.ok(!/^import .*\.\/fx\//m.test(ui));
  assert.ok(ui.includes('import(`./fx/${name}.js`)'));
});

test('de zonnebloem groeit in stadia: zaadje, kiem, steel, knop, bloem, volle bloem', () => {
  const stage = (d) => sunflowerGrowth(d).stage;
  assert.deepEqual([0, 1, 4, 5, 14, 15, 29, 30, 44, 45, 60, 365].map(stage),
    ['zaadje', 'kiem', 'kiem', 'steel', 'steel', 'knop', 'knop', 'bloem', 'bloem', 'volle-bloem', 'volle-bloem', 'volle-bloem']);
  assert.deepEqual(STAGES.map((s) => s.id), ['zaadje', 'kiem', 'steel', 'knop', 'bloem', 'volle-bloem']);
  // In stapjes van 5 dagen, tot hij na ~60 dagen helemaal groot is.
  assert.equal(sunflowerGrowth(4).step, 0);
  assert.equal(sunflowerGrowth(5).step, 1);
  assert.equal(sunflowerGrowth(FULL_DAYS).step, 12);
  assert.equal(sunflowerGrowth(500).step, 12);
  assert.equal(sunflowerGrowth(-3).stage, 'zaadje');
  assert.equal(sunflowerGrowth(44).next.id, 'volle-bloem');
  assert.equal(sunflowerGrowth(45).next, null);
});

test('de zonnebloem telt de dagen waarop ze gepuzzeld heeft (niet het aantal puzzels)', () => {
  const log = [['2026-10-01', 'koffie', 1, 0, 0], ['2026-10-01', 'zondag', 1, 0, 0], ['2026-10-03', 'koffie', 1, 0, 0]];
  assert.equal(playedDays({ log }), 2);
  assert.equal(playedDays({}), 0);
});

test('elk groeistadium is een tekening, en de steel wordt steeds langer', () => {
  const tops = [];
  for (const d of [0, 1, 5, 10, 15, 25, 30, 40, 45, 60]) {
    const svg = sunflowerSvg(sunflowerGrowth(d));
    assert.ok(svg.length > 60 && !svg.includes('NaN') && !svg.includes('undefined'), `dag ${d}`);
    const m = /<path d="M30 92C[^"]* 30 ([\d.]+)"/.exec(svg);
    if (m) tops.push(Number(m[1]));
  }
  for (let k = 1; k < tops.length; k++) assert.ok(tops[k] <= tops[k - 1], `steel ${k}`);
  assert.ok(sunflowerSvg(sunflowerGrowth(60)).includes('#ffc816'), 'gele blaadjes');
  assert.ok(!sunflowerSvg(sunflowerGrowth(20)).includes('<ellipse cx="0" cy="-'), 'een knop heeft nog geen blaadjes');
});

test('het 8-bit-deuntje van Game Boy is kort en klinkt', () => {
  assert.ok(JINGLE.length >= 5);
  const end = Math.max(...JINGLE.map(([, at, dur]) => at + dur));
  assert.ok(end > 0.6 && end < 1.5, `duurt ${end} s`);
  for (const [f, at, dur] of JINGLE) assert.ok(f > 200 && f < 2000 && at >= 0 && dur > 0, String(f));
});
