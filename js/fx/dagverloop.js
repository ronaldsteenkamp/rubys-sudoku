// Dagverloop: de kleuren schuiven met de klok mee. Ochtendroze (6–10),
// middagblauw (10–17), avondoranje (17–21) en nachtpaars (21–6).
// Alleen geladen als Dagverloop het thema is (zie loadFx in ui.js).
//
// Per kwartier rekenen we alle themakleuren uit door twee paletten te mengen.
// Licht en donker mengen we nooit (halverwege zou alles grijs op grijs zijn):
// om 6:00 en 21:00 springt het naar het andere schema, met de zachte
// kleurovergang van de pagina zelf. dagverloopAt() is puur en draait ook in
// Node; de test controleert het contrast op alle 96 kwartieren.

const LIGHT_SHADOW = '0 1px 2px rgb(20 40 70 / 6%), 0 8px 24px rgb(20 40 70 / 9%)';
const DARK_SHADOW = '0 1px 2px rgb(0 0 0 / 30%), 0 8px 24px rgb(0 0 0 / 35%)';

// Alle paletten hebben dezelfde sleutels als een themablok in style.css (behalve
// --shadow en --same-ring: die volgen uit licht/donker en het accent).
export const PALETTES = {
  // 6–10: ochtendroze, de zon komt op.
  ochtend: {
    scheme: 'light',
    bg: '#fff2f2', 'bg-2': '#ffd9e0', surface: '#ffffff', 'surface-2': '#fdeef0', ink: '#3d1f2b', 'ink-soft': '#6a4452',
    line: '#f2dde2', 'line-strong': '#b0647d', accent: '#f4a3b8', 'accent-strong': '#e07a98', 'accent-ink': '#3a1422', 'accent-soft': '#fde0e7',
    user: '#9a3358', given: '#3d1f2b', sel: '#f4a3b8', 'sel-ink': '#3a1422', peer: '#fce6eb', same: '#fde5a0',
    hint: '#e0874f', wrong: '#a8321a', 'wrong-bg': '#fcd9c4',
    heart: '#c8456b', 'heart-fill': '#efdcfa', 'heart-edge': '#e5cbf7', 'heart-ink': '#6e2a7a', 'heart-solved': '#c2365a', 'heart-solved-ink': '#ffffff',
  },
  // 10–17: middagblauw (dezelfde kleuren als [data-theme="dagverloop"] in style.css).
  middag: {
    scheme: 'light',
    bg: '#eef5ff', 'bg-2': '#d5e7ff', surface: '#ffffff', 'surface-2': '#e8f1fc', ink: '#142a4c', 'ink-soft': '#3e5372',
    line: '#d5e1f0', 'line-strong': '#4b6fa6', accent: '#7db6f2', 'accent-strong': '#3f86d6', 'accent-ink': '#0c2242', 'accent-soft': '#d6e8fc',
    user: '#1f57a8', given: '#142a4c', sel: '#7db6f2', 'sel-ink': '#0c2242', peer: '#e1eefc', same: '#bad4f4',
    hint: '#e07a3f', wrong: '#b02e20', 'wrong-bg': '#fcd5c6',
    heart: '#d24e78', 'heart-fill': '#efdcfa', 'heart-edge': '#e5cbf7', 'heart-ink': '#6e2a7a', 'heart-solved': '#c8324f', 'heart-solved-ink': '#ffffff',
  },
  // 17–21: avondoranje.
  avond: {
    scheme: 'light',
    bg: '#fff3e6', 'bg-2': '#ffd9b3', surface: '#fffcf8', 'surface-2': '#fdebd9', ink: '#3a220f', 'ink-soft': '#66462c',
    line: '#f0dcc6', 'line-strong': '#b8662a', accent: '#f59a4a', 'accent-strong': '#d97526', 'accent-ink': '#331804', 'accent-soft': '#fde0c4',
    user: '#944510', given: '#3a220f', sel: '#f59a4a', 'sel-ink': '#331804', peer: '#fcebd8', same: '#fbcf9e',
    hint: '#d9562b', wrong: '#a3201a', 'wrong-bg': '#f9cfd0',
    heart: '#c8456b', 'heart-fill': '#efdcfa', 'heart-edge': '#e5cbf7', 'heart-ink': '#6e2a7a', 'heart-solved': '#c2365a', 'heart-solved-ink': '#ffffff',
  },
  // Vlak voor 21:00: de laatste gloed, dieper oranje.
  gloed: {
    scheme: 'light',
    bg: '#ffe8d4', 'bg-2': '#ffc28f', surface: '#fff8f0', 'surface-2': '#fbdfc8', ink: '#36200f', 'ink-soft': '#5f3f28',
    line: '#ecd0b6', 'line-strong': '#a95420', accent: '#f2843a', 'accent-strong': '#c9631c', 'accent-ink': '#2e1404', 'accent-soft': '#fbd5b4',
    user: '#8a3c0c', given: '#36200f', sel: '#f2843a', 'sel-ink': '#2e1404', peer: '#fbe6d0', same: '#f9cda3',
    hint: '#c94a22', wrong: '#a3201a', 'wrong-bg': '#f6c9d2',
    heart: '#c23a5c', 'heart-fill': '#efdcfa', 'heart-edge': '#e5cbf7', 'heart-ink': '#6e2a7a', 'heart-solved': '#b8283f', 'heart-solved-ink': '#ffffff',
  },
  // 21:00: schemer, violet met nog wat avondgloed in het accent.
  schemer: {
    scheme: 'dark',
    bg: '#241a35', 'bg-2': '#3a2650', surface: '#2c2140', 'surface-2': '#372a4f', ink: '#f5ecff', 'ink-soft': '#d3c4e6',
    line: '#44365e', 'line-strong': '#9b86c4', accent: '#f5a97a', 'accent-strong': '#ffc29e', 'accent-ink': '#2a1608', 'accent-soft': '#4a3352',
    user: '#ffc9a3', given: '#f5ecff', sel: '#f5a97a', 'sel-ink': '#2a1608', peer: '#3f305b', same: '#4d3a6b',
    hint: '#ffa77f', wrong: '#ffc08a', 'wrong-bg': '#4a2a12',
    heart: '#ff8fb1', 'heart-fill': '#4f2346', 'heart-edge': '#6a2d5d', 'heart-ink': '#ffd0e4', 'heart-solved': '#c43450', 'heart-solved-ink': '#ffffff',
  },
  // Midden in de nacht: diep paars.
  nacht: {
    scheme: 'dark',
    bg: '#140f24', 'bg-2': '#221838', surface: '#1d1631', 'surface-2': '#281f40', ink: '#ece6ff', 'ink-soft': '#c2b8e0',
    line: '#332a4d', 'line-strong': '#8676b8', accent: '#c4a7ff', 'accent-strong': '#d9c6ff', 'accent-ink': '#1a1030', 'accent-soft': '#352a55',
    user: '#d9c6ff', given: '#ece6ff', sel: '#c4a7ff', 'sel-ink': '#1a1030', peer: '#2e244b', same: '#3d3163',
    hint: '#ffb38a', wrong: '#ffc08a', 'wrong-bg': '#4a2a12',
    heart: '#ff8fb1', 'heart-fill': '#4f2346', 'heart-edge': '#6a2d5d', 'heart-ink': '#ffd0e4', 'heart-solved': '#c43450', 'heart-solved-ink': '#ffffff',
  },
  // Vlak voor zessen: de eerste roze gloed aan de nachthemel.
  dageraad: {
    scheme: 'dark',
    bg: '#22182f', 'bg-2': '#3d2340', surface: '#2a1e37', 'surface-2': '#362744', ink: '#fbeaf2', 'ink-soft': '#dcc0d2',
    line: '#45324f', 'line-strong': '#b083a8', accent: '#f2a0c0', 'accent-strong': '#ffbfd6', 'accent-ink': '#2a0f1c', 'accent-soft': '#4a2c48',
    user: '#ffc2dc', given: '#fbeaf2', sel: '#f2a0c0', 'sel-ink': '#2a0f1c', peer: '#3f2d51', same: '#523a5e',
    hint: '#ffb38a', wrong: '#ffc08a', 'wrong-bg': '#4a2a12',
    heart: '#ff8fb1', 'heart-fill': '#4f2346', 'heart-edge': '#6a2d5d', 'heart-ink': '#ffd0e4', 'heart-solved': '#c43450', 'heart-solved-ink': '#ffffff',
  },
};

// [minuut van de dag, palet]. Tussen twee punten met hetzelfde schema mengen we
// per kwartier; tussen licht en donker houden we het vorige palet tot het volgende punt.
export const DAY_POINTS = [
  [0, 'nacht'], [4 * 60 + 30, 'nacht'], [5 * 60 + 45, 'dageraad'],
  [6 * 60, 'ochtend'], [8 * 60 + 45, 'ochtend'], [10 * 60, 'middag'],
  [15 * 60 + 45, 'middag'], [17 * 60, 'avond'], [19 * 60 + 45, 'avond'], [20 * 60 + 45, 'gloed'],
  [21 * 60, 'schemer'], [22 * 60 + 30, 'nacht'], [24 * 60, 'nacht'],
];

const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, t) => `#${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;

// `base` plus het verschil tussen `from` en `to`.
const shift = (base, from, to) => `#${hex(base).map((v, i) => Math.max(0, Math.min(255, v + hex(to)[i] - hex(from)[i])).toString(16).padStart(2, '0')).join('')}`;

// Het kwartier van de dag (0–95) van `date`.
export const quarterOf = (date) => Math.floor((date.getHours() * 60 + date.getMinutes()) / 15);

// Alle kleuren voor `date` (afgerond op het kwartier): { scheme, vars }.
// `vars` heeft dezelfde sleutels als een themablok, zonder de streepjes ervoor.
export function dagverloopAt(date = new Date()) {
  const minute = quarterOf(date) * 15;
  let k = 0;
  while (DAY_POINTS[k + 1][0] <= minute) k++;
  const [m0, p0] = DAY_POINTS[k], [m1, p1] = DAY_POINTS[k + 1];
  const a = PALETTES[p0], b = PALETTES[p1];
  const t = a.scheme === b.scheme && m1 > m0 ? (minute - m0) / (m1 - m0) : 0;
  const vars = {};
  for (const key of Object.keys(a)) if (key !== 'scheme') vars[key] = mixHex(a[key], b[key], t);
  // Roze + blauw (of blauw + oranje) gemengd wordt bijna grijs: dan valt de rij/kolom-kleur
  // weg. Daarom de tint van het palet dat nu het zwaarst weegt, over het gemengde vakje.
  const main = t < 0.5 ? a : b;
  vars.peer = shift(vars.surface, main.surface, main.peer);
  const dark = a.scheme === 'dark';
  vars['same-ring'] = dark ? `color-mix(in srgb, ${vars.sel} 60%, transparent)` : 'transparent';
  vars.shadow = dark ? DARK_SHADOW : LIGHT_SHADOW;
  return { scheme: a.scheme, vars };
}

// ---------- In de app ----------

let timer = null;
let ctx = null;
const onVisible = () => { if (document.visibilityState === 'visible') apply(); };

// Zet de kleuren van nu en plant de volgende update op het volgende kwartier.
function apply() {
  if (!ctx) return;
  const now = ctx.now();
  const { scheme, vars } = dagverloopAt(now);
  const html = document.documentElement;
  for (const [k, v] of Object.entries(vars)) html.style.setProperty(`--${k}`, v);
  html.style.colorScheme = scheme;
  html.dataset.scheme = scheme;
  ctx.changed({ scheme, vars });
  clearTimeout(timer);
  const ms = (15 - (now.getMinutes() % 15)) * 60000 - now.getSeconds() * 1000 - now.getMilliseconds();
  timer = setTimeout(apply, Math.max(1000, ms + 500));
}

// `c`: { now(): Date, changed({ scheme, vars }) } (zie loadFx in ui.js).
export function start(c) {
  ctx = c;
  document.removeEventListener('visibilitychange', onVisible);
  document.addEventListener('visibilitychange', onVisible);
  apply();
}

export function stop() {
  clearTimeout(timer);
  document.removeEventListener('visibilitychange', onVisible);
  const html = document.documentElement;
  for (const k of Object.keys(PALETTES.middag)) if (k !== 'scheme') html.style.removeProperty(`--${k}`);
  for (const k of ['same-ring', 'shadow']) html.style.removeProperty(`--${k}`);
  html.style.colorScheme = '';
  ctx = null;
}
