import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THEMES, resolveTheme, themeById, seasonOf, checkThemeUnlocks, recordSeasonSolve, seasonProgress, SEASON_THEMES } from '../js/themes.js';
import { emptyStats, migrateStats } from '../js/storage.js';

// ---------- CSS-variabelen per thema uit style.css halen ----------

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const vars = {};
const schemes = {};
for (const [, id, body] of css.matchAll(/\[data-theme="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
  vars[id] = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
  schemes[id] = body.match(/color-scheme:\s*(\w+)/)?.[1];
}

// ---------- Kleurrekenwerk ----------

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (hex) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// Hoe verschillend twee kleuren eruitzien (CIE76 in Lab); vanaf ~10 zie je het duidelijk.
function lab(hex) {
  const [r, g, b] = rgb(hex).map(lin);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

// ---------- Tests ----------

test('elk thema heeft een CSS-blok met alle variabelen van zonnig', () => {
  const needed = Object.keys(vars.zonnig);
  assert.ok(needed.length > 25);
  for (const t of THEMES) {
    assert.ok(vars[t.id], `geen CSS voor ${t.id}`);
    const missing = needed.filter((k) => !(k in vars[t.id]));
    assert.deepEqual(missing, [], `${t.id} mist ${missing.join(', ')}`);
  }
});

test('elk thema heeft een naam, licht/donker, 4 feest-emoji en een kloppend voorproefje', () => {
  for (const t of THEMES) {
    const v = vars[t.id];
    assert.ok(t.name && ['light', 'dark'].includes(t.scheme), t.id);
    assert.equal(schemes[t.id], t.scheme, `${t.id} color-scheme`);
    assert.equal(t.celebrate.length, 4, t.id);
    assert.equal(t.swatch.bg, v.bg, `${t.id} swatch.bg`);
    assert.equal(t.swatch.surface, v.surface, `${t.id} swatch.surface`);
    assert.equal(t.swatch.accent, v.accent, `${t.id} swatch.accent`);
    assert.equal(t.swatch.digit, v.user, `${t.id} swatch.digit`);
  }
});

// [voorgrond, achtergrond]: cijfers, notities en tekst op het bord, minstens 4.5:1.
const PAIRS = [
  ['given', 'surface'], ['user', 'surface'], ['ink-soft', 'surface'], ['ink', 'bg'],
  ['given', 'peer'], ['user', 'peer'], ['ink-soft', 'peer'],
  ['given', 'same'], ['user', 'same'],
  ['sel-ink', 'sel'],
  ['wrong', 'wrong-bg'],
  ['heart-ink', 'heart-fill'], ['heart-ink', 'heart-edge'], ['user', 'heart-fill'], ['user', 'heart-edge'],
  ['heart-solved-ink', 'heart-solved'],
  ['accent-ink', 'accent'],
];

test('contrast van de belangrijkste kleurparen is minstens 4.5:1', () => {
  const fails = [];
  for (const t of THEMES) {
    const v = vars[t.id];
    for (const [fg, bg] of PAIRS) {
      const c = contrast(v[fg], v[bg]);
      if (!(c >= 4.5)) fails.push(`${t.id}: --${fg} op --${bg} = ${c.toFixed(2)}`);
    }
  }
  assert.deepEqual(fails, []);
});

test('selectie, peers, gelijke cijfers, fout en hart zijn duidelijk van elkaar te onderscheiden', () => {
  const keys = ['sel', 'peer', 'same', 'wrong-bg', 'heart-fill'];
  const fails = [];
  for (const t of THEMES) {
    const v = vars[t.id];
    for (let a = 0; a < keys.length; a++) {
      for (let b = a + 1; b < keys.length; b++) {
        // Waar een thema gelijke cijfers met een ringetje toont, telt dat als onderscheid.
        if ([keys[a], keys[b]].includes('same') && v['same-ring'] !== 'transparent') continue;
        const d = deltaE(v[keys[a]], v[keys[b]]);
        if (d < 8) fails.push(`${t.id}: --${keys[a]} en --${keys[b]} lijken te veel op elkaar (ΔE ${d.toFixed(1)})`);
      }
    }
  }
  assert.deepEqual(fails, []);
});

const d = (y, m, day) => new Date(y, m - 1, day, 12);

test('auto kiest licht of donker; onbekend valt terug op zonnig', () => {
  assert.equal(resolveTheme('auto', d(2026, 10, 21), [], false), 'zonnig');
  assert.equal(resolveTheme('auto', d(2026, 10, 21), [], true), 'nacht');
  assert.equal(resolveTheme('lelie', d(2026, 10, 21), []), 'lelie');
  assert.equal(resolveTheme('bestaat-niet', d(2026, 10, 21), []), 'zonnig');
  assert.equal(themeById('nacht').scheme, 'dark');
});

test('seizoenen volgen de meteorologische indeling', () => {
  assert.deepEqual(seasonOf(d(2027, 3, 1)), { season: 'lente', key: 'lente-2027' });
  assert.deepEqual(seasonOf(d(2027, 5, 31)), { season: 'lente', key: 'lente-2027' });
  assert.deepEqual(seasonOf(d(2027, 6, 1)), { season: 'zomer', key: 'zomer-2027' });
  assert.deepEqual(seasonOf(d(2026, 9, 1)), { season: 'herfst', key: 'herfst-2026' });
  assert.deepEqual(seasonOf(d(2026, 11, 30)), { season: 'herfst', key: 'herfst-2026' });
});

test('winter over de jaarwisseling: dec 2026 t/m feb 2027 is winter-2026', () => {
  assert.equal(seasonOf(d(2026, 12, 1)).key, 'winter-2026');
  assert.equal(seasonOf(d(2026, 12, 31)).key, 'winter-2026');
  assert.equal(seasonOf(d(2027, 1, 1)).key, 'winter-2026');
  assert.equal(seasonOf(d(2027, 2, 28)).key, 'winter-2026');
  assert.equal(seasonOf(d(2028, 2, 29)).key, 'winter-2027');
  assert.equal(seasonOf(d(2027, 12, 1)).key, 'winter-2027');
});

test('drie puzzels in de winter, ook over de jaarwisseling heen, ontgrendelen Winter', () => {
  const st = emptyStats();
  recordSeasonSolve(st, d(2026, 12, 30));
  assert.deepEqual(checkThemeUnlocks(st, d(2026, 12, 30)), []);
  recordSeasonSolve(st, d(2026, 12, 31));
  assert.deepEqual(checkThemeUnlocks(st, d(2026, 12, 31)), []);
  assert.deepEqual(seasonProgress(st, d(2027, 1, 1)).current, 2);
  recordSeasonSolve(st, d(2027, 1, 1));
  assert.deepEqual(checkThemeUnlocks(st, d(2027, 1, 1)), ['winter']);
  assert.deepEqual(st.seasonSolves, { 'winter-2026': 3 });
  assert.deepEqual(st.unlockedThemes, ['winter']);
  // Eenmaal vrij blijft vrij, en komt niet nog eens als 'nieuw'.
  recordSeasonSolve(st, d(2027, 1, 2));
  assert.deepEqual(checkThemeUnlocks(st, d(2027, 1, 2)), []);
  assert.deepEqual(checkThemeUnlocks(st, d(2027, 7, 1)), []);
  assert.deepEqual(st.unlockedThemes, ['winter']);
});

test('puzzels uit een ander seizoen tellen niet mee', () => {
  const st = emptyStats();
  recordSeasonSolve(st, d(2026, 11, 29));
  recordSeasonSolve(st, d(2026, 11, 30));
  recordSeasonSolve(st, d(2026, 12, 1));
  assert.deepEqual(checkThemeUnlocks(st, d(2026, 12, 1)), []);
  assert.deepEqual(st.seasonSolves, { 'herfst-2026': 2, 'winter-2026': 1 });
  recordSeasonSolve(st, d(2027, 12, 1)); // de winter erna is een nieuwe winter
  assert.equal(seasonProgress(st, d(2027, 12, 1)).current, 1);
});

test('seizoensthema alleen als het vrij is; "seizoen" volgt de kalender', () => {
  assert.equal(resolveTheme('herfst', d(2026, 10, 21), []), 'zonnig');
  assert.equal(resolveTheme('herfst', d(2026, 10, 21), ['herfst']), 'herfst');
  assert.equal(resolveTheme('herfst', d(2027, 4, 1), ['herfst']), 'herfst', 'een vrij thema mag ook buiten z’n seizoen');
  assert.equal(resolveTheme('seizoen', d(2026, 10, 21), ['herfst']), 'herfst');
  assert.equal(resolveTheme('seizoen', d(2027, 1, 10), ['herfst']), 'zonnig');
  assert.equal(resolveTheme('seizoen', d(2027, 1, 10), ['herfst', 'winter']), 'winter');
  assert.equal(SEASON_THEMES.length, 4);
});

test('oude statistieken krijgen lege seizoensgegevens, kapotte worden hersteld', () => {
  const st = migrateStats({ totalSolved: 5 });
  assert.deepEqual(st.seasonSolves, {});
  assert.deepEqual(st.unlockedThemes, []);
  const bad = migrateStats({ seasonSolves: [1], unlockedThemes: 'herfst' });
  assert.deepEqual(bad.seasonSolves, {});
  assert.deepEqual(bad.unlockedThemes, []);
  assert.deepEqual(migrateStats({ unlockedThemes: ['herfst', 7, 'onzin'] }).unlockedThemes, ['herfst']);
});
