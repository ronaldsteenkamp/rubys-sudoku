import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THEMES, resolveTheme, migrateThemeSetting, themeById, seasonOf, checkThemeUnlocks, recordSeasonSolve, seasonProgress, SEASON_THEMES } from '../js/themes.js';
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
  // Ook de persoonlijke thema's zonder eigen test, zoals Briefje, gaan hier doorheen.
  for (const id of ['briefje', 'volleybal', 'liefde']) assert.ok(THEMES.some((t) => t.id === id) && vars[id], id);
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

// De rij, kolom en het blok van het gekozen vakje moeten echt opvallen tegen een gewoon vakje.
const PEER_MIN = 10;
test(`rij, kolom en blok van het gekozen vakje vallen op: --peer en --surface minstens ΔE ${PEER_MIN}`, () => {
  const fails = THEMES.map((t) => [t.id, deltaE(vars[t.id].peer, vars[t.id].surface)]).filter(([, d]) => d < PEER_MIN)
    .map(([id, d]) => `${id}: ΔE ${d.toFixed(1)}`);
  assert.deepEqual(fails, []);
});

// De kalender in Statistieken en de recordregel op het opgelost-scherm.
// Tekst minstens 4.5:1; het hartje en het randje om vandaag (geen tekst) minstens 3:1.
const CALENDAR_TEXT = [
  ['ink', 'surface'], ['ink-soft', 'surface'], ['ink', 'accent-soft'], ['heart-ink', 'heart-fill'], ['sel-ink', 'sel'],
  ['ink', 'surface-2'], ['ink-soft', 'surface-2'],
];
const CALENDAR_SHAPES = [['heart', 'surface'], ['heart', 'accent-soft'], ['heart-ink', 'heart-fill'], ['ink-soft', 'surface']];

test('kalender en recordregel: genoeg contrast in elk thema', () => {
  const fails = [];
  for (const t of THEMES) {
    const v = vars[t.id];
    for (const [pairs, min] of [[CALENDAR_TEXT, 4.5], [CALENDAR_SHAPES, 3]]) {
      for (const [fg, bg] of pairs) {
        const c = contrast(v[fg], v[bg]);
        if (!(c >= min)) fails.push(`${t.id}: --${fg} op --${bg} = ${c.toFixed(2)} (nodig ${min})`);
      }
    }
  }
  assert.deepEqual(fails, []);
});

// Figuurpuzzels: elke kleurfamilie (oranje, groen, …) heeft een lichte variant
// (:root) en een donkere ([data-scheme="dark"]). In elk thema moeten de cijfers
// in de figuur (gegeven en ingevuld) en de onthulde figuur 4.5:1 halen.
const famBlock = (re) => Object.fromEntries([...css.match(re)[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map(([, k, v]) => [k, v]));
const FAMILY_LIGHT = famBlock(/:root \{\s*(--orange-fill[^}]*)\}/);
const FAMILY_DARK = famBlock(/\[data-scheme="dark"\] \{\s*([^}]*)\}/);
const FAMILIES = ['orange', 'green', 'gold', 'brown', 'blue', 'lilac'];

test('figuurpuzzels: elke kleurfamilie haalt 4.5:1 in elk thema', async () => {
  const { SHAPES } = await import('../js/generator.js');
  for (const s of Object.values(SHAPES)) assert.ok(s.color === 'heart' || FAMILIES.includes(s.color), s.color);
  const fails = [];
  for (const t of THEMES) {
    const v = vars[t.id], fam = t.scheme === 'dark' ? FAMILY_DARK : FAMILY_LIGHT;
    for (const f of FAMILIES) {
      const c = (k) => fam[`${f}-${k}`];
      assert.ok(c('fill') && c('edge') && c('ink') && c('solved'), `${f} compleet`);
      for (const [name, fg, bg] of [['ink', c('ink'), c('fill')], ['ink', c('ink'), c('edge')], ['user', v.user, c('fill')], ['user', v.user, c('edge')], ['wit', '#ffffff', c('solved')]]) {
        const k = contrast(fg, bg);
        if (!(k >= 4.5)) fails.push(`${t.id} ${f}: ${name} = ${k.toFixed(2)}`);
      }
    }
  }
  assert.deepEqual(fails, []);
});

// Slaapstand: hetzelfde filter in de CSS als in sleep.js, en de cijfers op het
// bord blijven ook in zwart-wit in elk thema 4.5:1 halen. De vette tekst op de
// accentknoppen ("Speel") zakt in Liefde en Herfst iets; daar is 3.5:1 genoeg
// (vette knoptekst; de norm voor grote of vette tekst is 3:1).
test('slaapstand: cijfers en tekst blijven in elk thema leesbaar in zwart-wit', async () => {
  const { sleepFilterCss, sleepColor } = await import('../js/sleep.js');
  assert.ok(css.includes(`html[data-sleep] { filter: ${sleepFilterCss()}; }`), 'filter in de CSS = sleep.js');
  const fails = [];
  for (const t of THEMES) {
    const v = vars[t.id];
    for (const [fg, bg] of [...PAIRS, ...CALENDAR_TEXT]) {
      const c = contrast(sleepColor(v[fg]), sleepColor(v[bg]));
      if (!(c >= (fg === 'accent-ink' ? 3.5 : 4.5))) fails.push(`${t.id} (slaapstand): --${fg} op --${bg} = ${c.toFixed(2)}`);
    }
  }
  assert.deepEqual(fails, []);
});

const d = (y, m, day) => new Date(y, m - 1, day, 12);

test("het oude 'auto' wordt het thema dat ze toen zag; onbekend valt terug op zonnig", () => {
  assert.equal(migrateThemeSetting('auto', false), 'zonnig');
  assert.equal(migrateThemeSetting('auto', true), 'nacht');
  assert.equal(migrateThemeSetting('lelie', true), 'lelie');
  assert.equal(resolveTheme('auto', d(2026, 10, 21), []), 'zonnig');
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

// ---------- Dagthema's: Volleybal met de accentkleuren van een ander thema ----------

const accentSets = {};
for (const [, id, body] of css.matchAll(/html\[data-accent="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
  accentSets[id] = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
}
const mixed = (() => {
  const body = css.match(/html\[data-accent\]\s*\{([^}]*)\}/)[1];
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*color-mix\(in srgb, var\(--accent\) (\d+)%, var\(--surface\)\);/g)].map(([, k, p]) => [k, Number(p) / 100]));
})();
// color-mix(in srgb, a p%, b): per kanaal gewoon mengen.
const mix = (a, b, p) => `#${rgb(a).map((v, i) => Math.round(v * p + rgb(b)[i] * (1 - p)).toString(16).padStart(2, '0')).join('')}`;
const combined = (base, accent) => {
  const v = { ...vars[base], ...accentSets[accent] };
  for (const [k, p] of Object.entries(mixed)) v[k] = mix(v.accent, v.surface, p);
  return v;
};

test('dagthema: elk thema heeft een accentset met dezelfde kleuren als zijn eigen blok', () => {
  assert.deepEqual(Object.keys(mixed).sort(), ['accent-soft', 'peer', 'same']);
  for (const t of THEMES) {
    const set = accentSets[t.id];
    assert.ok(set, `geen html[data-accent="${t.id}"]`);
    for (const k of ['accent', 'accent-strong', 'accent-ink', 'sel', 'sel-ink']) assert.equal(set[k], vars[t.id][k], `${t.id} --${k}`);
  }
});

test('dagthema: Volleybal met elk ander accent blijft leesbaar (4.5:1)', () => {
  const fails = [];
  for (const t of THEMES) {
    const v = combined('volleybal', t.id);
    for (const [fg, bg] of [...PAIRS, ...CALENDAR_TEXT]) {
      const c = contrast(v[fg], v[bg]);
      if (!(c >= 4.5)) fails.push(`volleybal + ${t.id}: --${fg} op --${bg} = ${c.toFixed(2)}`);
    }
  }
  assert.deepEqual(fails, []);
});

// ---------- Nieuwe thema's met iets bijzonders ----------

// Alle controles van hierboven voor één set kleuren (een kwartier van Dagverloop, een blok van RubyxCube).
async function colourFails(label, v, scheme, min = 4.5) {
  const { sleepColor } = await import('../js/sleep.js');
  const fails = [];
  for (const [pairs, need] of [[PAIRS, min], [CALENDAR_TEXT, min], [CALENDAR_SHAPES, 3]]) {
    for (const [fg, bg] of pairs) {
      const c = contrast(v[fg], v[bg]);
      if (!(c >= need)) fails.push(`${label}: --${fg} op --${bg} = ${c.toFixed(2)} (nodig ${need})`);
    }
  }
  for (const [fg, bg] of [...PAIRS, ...CALENDAR_TEXT]) {
    const c = contrast(sleepColor(v[fg]), sleepColor(v[bg]));
    if (!(c >= (fg === 'accent-ink' ? 3.5 : 4.5))) fails.push(`${label} (slaapstand): --${fg} op --${bg} = ${c.toFixed(2)}`);
  }
  const keys = ['sel', 'peer', 'same', 'wrong-bg', 'heart-fill'];
  for (let a = 0; a < keys.length; a++) {
    for (let b = a + 1; b < keys.length; b++) {
      if ([keys[a], keys[b]].includes('same') && v['same-ring'] !== 'transparent') continue;
      const d = deltaE(v[keys[a]], v[keys[b]]);
      if (d < 8) fails.push(`${label}: --${keys[a]} en --${keys[b]} lijken te veel op elkaar (ΔE ${d.toFixed(1)})`);
    }
  }
  const dp = deltaE(v.peer, v.surface);
  if (dp < PEER_MIN) fails.push(`${label}: --peer valt te weinig op tegen --surface (ΔE ${dp.toFixed(1)})`);
  const fam = scheme === 'dark' ? FAMILY_DARK : FAMILY_LIGHT;
  for (const f of FAMILIES) for (const k of ['fill', 'edge']) if (!(contrast(v.user, fam[`${f}-${k}`]) >= 4.5)) fails.push(`${label}: --user op ${f}-${k}`);
  return fails;
}

test('Dagverloop: op elk kwartier van de dag klopt het contrast en is alles te onderscheiden', async () => {
  const { dagverloopAt } = await import('../js/fx/dagverloop.js');
  const needed = Object.keys(vars.zonnig);
  const fails = [];
  for (let q = 0; q < 96; q++) {
    const date = new Date(2027, 2, 3, Math.floor(q / 4), (q % 4) * 15);
    const { scheme, vars: v } = dagverloopAt(date);
    const label = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const missing = needed.filter((k) => !(k in v));
    if (missing.length) fails.push(`${label} mist ${missing.join(', ')}`);
    fails.push(...await colourFails(`dagverloop ${label}`, v, scheme));
  }
  assert.deepEqual(fails, []);
});

test('Dagverloop: ochtendroze, middagblauw, avondoranje en nachtpaars, licht of donker volgt het uur', async () => {
  const { dagverloopAt, PALETTES } = await import('../js/fx/dagverloop.js');
  const at = (h, m = 0) => dagverloopAt(new Date(2027, 2, 3, h, m));
  const hue = (hex) => { const [r, g, b] = rgb(hex).map((c) => c / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
    const h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return (h * 60 + 360) % 360; };
  assert.equal(at(7).scheme, 'light'); assert.ok(hue(at(7).vars.accent) > 300, 'ochtend: roze');
  assert.equal(at(13).scheme, 'light'); assert.ok(hue(at(13).vars.accent) > 190 && hue(at(13).vars.accent) < 230, 'middag: blauw');
  assert.equal(at(18).scheme, 'light'); assert.ok(hue(at(18).vars.accent) > 15 && hue(at(18).vars.accent) < 40, 'avond: oranje');
  assert.equal(at(2).scheme, 'dark'); assert.ok(hue(at(2).vars.accent) > 250 && hue(at(2).vars.accent) < 290, 'nacht: paars');
  assert.equal(at(5, 45).scheme, 'dark'); assert.equal(at(6).scheme, 'light');
  assert.equal(at(20, 45).scheme, 'light'); assert.equal(at(21).scheme, 'dark');
  // Binnen een kwartier verandert er niets; de middag is precies het CSS-blok (en het voorproefje).
  assert.deepEqual(dagverloopAt(new Date(2027, 2, 3, 13, 1)), dagverloopAt(new Date(2027, 2, 3, 13, 14)));
  for (const [k, v] of Object.entries(PALETTES.middag)) if (k !== 'scheme') assert.equal(vars.dagverloop[k], v, `middag --${k}`);
  // Vloeiend: binnen licht of donker schuift de achtergrond per kwartier maar een klein beetje op.
  for (let q = 1; q < 96; q++) {
    const a = dagverloopAt(new Date(2027, 2, 3, Math.floor((q - 1) / 4), ((q - 1) % 4) * 15));
    const b = dagverloopAt(new Date(2027, 2, 3, Math.floor(q / 4), (q % 4) * 15));
    if (a.scheme === b.scheme) assert.ok(deltaE(a.vars.bg, b.vars.bg) < 6, `kwartier ${q}: ΔE ${deltaE(a.vars.bg, b.vars.bg).toFixed(1)}`);
  }
});

// RubyxCube: per blok een eigen kleur. Elk blok apart doorrekenen.
const cubeBlocks = [...css.matchAll(/\[data-theme="rubyxcube"\] \.cell\[data-b="(\d)"\]\s*\{([^}]*)\}/g)]
  .map(([, b, body]) => [Number(b), Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]))]);

test('RubyxCube: negen blokken, buren hebben een andere kleur, alle zes de kleuren doen mee', () => {
  assert.deepEqual(cubeBlocks.map(([b]) => b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const colour = (b) => cubeBlocks[b][1].surface;
  assert.equal(new Set(cubeBlocks.map(([b]) => colour(b))).size, 6);
  for (let b = 0; b < 9; b++) {
    if (b % 3 < 2) assert.notEqual(colour(b), colour(b + 1), `blok ${b} en ${b + 1}`);
    if (b < 6) assert.notEqual(colour(b), colour(b + 3), `blok ${b} en ${b + 3}`);
  }
});

test('RubyxCube: in elk blok klopt het contrast en zijn selectie, buren en fouten te zien', async () => {
  const fails = [];
  for (const [b, block] of cubeBlocks) fails.push(...await colourFails(`rubyxcube blok ${b}`, { ...vars.rubyxcube, ...block }, 'light'));
  assert.deepEqual(fails, []);
});

test('Hoog contrast: alle tekst en cijfers minstens 7:1', async () => {
  assert.deepEqual(await colourFails('hoog-contrast', vars['hoog-contrast'], 'light', 7), []);
  assert.ok(/\[data-theme="hoog-contrast"\] \.cell\.selected \{ box-shadow: inset 0 0 0 4px/.test(css), 'selectie ook als rand, niet alleen kleur');
});

test('Krant: het gekozen vakje is een dikke rand, geen zwart blok; emoji in grijs', () => {
  assert.ok(/\[data-theme="krant"\] \.cell\.selected \{[^}]*box-shadow: inset 0 0 0 3px var\(--ink\)/.test(css));
  assert.ok(/\[data-theme="krant"\] :is\(\.emo[^{]*\{ filter: grayscale\(1\)/.test(css));
});

test("'auto' kiest Hoog contrast als het toestel om meer contrast vraagt", () => {
  assert.equal(migrateThemeSetting('auto', false, true), 'hoog-contrast');
  assert.equal(migrateThemeSetting('auto', true, true), 'hoog-contrast');
  assert.equal(migrateThemeSetting('auto', true, false), 'nacht');
  assert.equal(migrateThemeSetting('lelie', false, true), 'lelie', 'een eigen keuze blijft');
  assert.equal(resolveTheme('auto', d(2026, 10, 21), [], { contrast: true }), 'hoog-contrast');
  assert.equal(resolveTheme('auto', d(2026, 10, 21), [], { dark: true }), 'nacht');
  assert.equal(resolveTheme('auto', d(2026, 10, 21), []), 'zonnig');
});

// De geheime thema's na Game Boy, in deze volgorde.
const SECRET_ORDER = ['sporthal', 'kampvuur', 'preitaart'];
test('de kiezer: volgorde en groepjes', async () => {
  const { THEME_GROUPS } = await import('../js/themes.js');
  assert.deepEqual(THEMES.map((t) => t.id), ['zonnig', 'nacht', 'sterren', 'liefde', 'lelie', 'gran-canaria', 'volleybal', 'briefje',
    'robijn', 'rubyxcube', 'koffiemonster', 'gitaar', 'beachvolleybal', 'dagverloop', 'krant', 'krijtbord', 'zonnebloem', 'hoog-contrast',
    'waddenzee', 'bos', 'noorderlicht', 'regen', 'onderwater',
    'lente', 'zomer', 'herfst', 'winter', 'gameboy', ...SECRET_ORDER]);
  for (const t of THEMES) assert.ok(THEME_GROUPS.some((g) => g.id === t.group), t.id);
  assert.equal(THEMES.filter((t) => t.group === 'seizoen').every((t) => t.season), true);
  assert.deepEqual(THEMES.filter((t) => t.group === 'geheim').map((t) => t.id), ['gameboy', ...SECRET_ORDER]);
});

test('Game Boy: alleen de vier groentinten', () => {
  const four = ['#081820', '#346856', '#88c070', '#e0f8d0'];
  for (const [k, v] of Object.entries(vars.gameboy)) {
    for (const hex of v.match(/#[0-9a-f]{6}/g) || []) assert.ok(four.includes(hex), `--${k}: ${hex}`);
  }
});
