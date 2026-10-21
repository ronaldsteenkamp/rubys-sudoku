import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THEMES, resolveTheme, themeById } from '../js/themes.js';

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

test('auto kiest licht of donker; onbekend valt terug op zonnig', () => {
  assert.equal(resolveTheme('auto', false), 'zonnig');
  assert.equal(resolveTheme('auto', true), 'nacht');
  assert.equal(resolveTheme('lelie'), 'lelie');
  assert.equal(resolveTheme('bestaat-niet'), 'zonnig');
  assert.equal(themeById('nacht').scheme, 'dark');
});
