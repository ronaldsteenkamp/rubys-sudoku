// De Robijnen Kroon: een trofee voor Ruby-modus-puzzels die ze oplost zonder één
// hint. Puur (geen DOM), zodat alles te testen is. De teller staat in de
// statistieken (`stats.rubyNoHintSolved`, zie storage.js); welk niveau ze al
// gevierd heeft in `stats.crownShown` (0 = nog niets, 1 = brons … 4 = kroon).
// De teksten bij elk niveau staan in js/kroon-berichtjes.js.

// Oplopend; `at` is het aantal hintloze Ruby-puzzels dat ervoor nodig is.
export const CROWN_LEVELS = [
  { level: 1, id: 'brons', name: 'Brons', at: 1 },
  { level: 2, id: 'zilver', name: 'Zilver', at: 5 },
  { level: 3, id: 'goud', name: 'Goud', at: 15 },
  { level: 4, id: 'kroon', name: 'De Robijnen Kroon', at: 33 },
];
export const MAX_CROWN = CROWN_LEVELS.length;

// Het niveau (0–4) bij `count` hintloze Ruby-puzzels.
export const crownLevel = (count) => CROWN_LEVELS.filter((l) => count >= l.at).length;
export const crownById = (level) => CROWN_LEVELS[level - 1] || null;

// Het volgende niveau en hoeveel puzzels daar nog voor nodig zijn, of null (alles gehaald).
export function nextCrown(count) {
  const next = CROWN_LEVELS.find((l) => count < l.at);
  return next ? { ...next, left: next.at - count } : null;
}

// Een Ruby-modus-puzzel zonder hints? (Dezelfde regel als in recordSolve.)
export const countsForCrown = (levelId, hints) => levelId === 'ruby' && !hints;

// Hoeveel hintloze Ruby-puzzels er in het logboek staan ([dag, niveau, sec, hints, …]).
// Om de teller te vullen bij opslag van vóór de kroon; onbekende hints (null) tellen niet.
export const crownCountFromLog = (log = []) => log.filter((row) => row[1] === 'ruby' && row[3] === 0).length;

// Het niveau dat nog gevierd moet worden (het hoogste nieuwe), of 0.
export function crownToCelebrate(stats) {
  const level = crownLevel(stats.rubyNoHintSolved || 0);
  return level > (stats.crownShown || 0) ? level : 0;
}

// Onthoudt dat niveau `level` gevierd is (nooit terug naar lager).
export function markCrownShown(stats, level) {
  stats.crownShown = Math.max(stats.crownShown || 0, Math.min(MAX_CROWN, level));
  return stats;
}

// ---------- De trofee als SVG ----------
//
// Een kroon met een geslepen robijn in het midden. Hoe hoger het niveau, hoe meer
// glans: brons is dof en mat, zilver krijgt een glimlijn en een lichtpuntje op de
// robijn, goud fonkelt (sterretjes), en de Robijnen Kroon heeft stralen, een gloed,
// robijntjes op de punten en het getal 33 op de band. De animaties staan in
// css/style.css (.crown-*) en staan stil met minder beweging.
// `silhouette`: een grijze schaduw, voor niveaus die ze nog niet heeft.

const METALS = {
  1: { light: '#d4a06a', mid: '#a5703f', dark: '#6b4423' },
  2: { light: '#f7f9fc', mid: '#bcc3cd', dark: '#727b88' },
  3: { light: '#fff0a6', mid: '#e3b22c', dark: '#94680a' },
  4: { light: '#fff6c4', mid: '#f0c53a', dark: '#a06e08' },
};
const RUBIES = {
  1: { base: '#6e2a33', a: '#83404a', b: '#5c2029', c: '#7a333d', core: '#743039' },
  2: { base: '#a8122e', a: '#d8304f', b: '#7d0d24', c: '#c11a3b', core: '#e0264f' },
  3: { base: '#c00f38', a: '#ff4a6e', b: '#8e0a2a', c: '#e0264f', core: '#ff2d5f' },
  4: { base: '#d0103c', a: '#ff6b8a', b: '#8e0a2a', c: '#ee2a55', core: '#ff3d6b' },
};

const BODY = 'M18 88L11 38L37 60L60 24L83 60L109 38L102 88Z';
const TIPS = [[11, 38], [60, 24], [109, 38]];
const STAR = 'M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z';
// De geslepen robijn (dezelfde vorm als die op het startscherm van Robijn), rond (0, 0), straal ~34.
const OCTAGON = '-34,-18 -18,-34 18,-34 34,-18 34,18 18,34 -18,34 -34,18';

function gem(r, { shine }) {
  return `<polygon points="${OCTAGON}" fill="${r.base}"/>
    <polygon points="-34,-18 -18,-34 0,-14 -14,0" fill="${r.a}"/>
    <polygon points="-18,-34 18,-34 0,-14" fill="${r.a}" opacity="0.85"/>
    <polygon points="18,-34 34,-18 14,0 0,-14" fill="${r.c}"/>
    <polygon points="34,18 18,34 0,14 14,0" fill="${r.b}"/>
    <polygon points="-18,34 -34,18 -14,0 0,14" fill="${r.c}" opacity="0.8"/>
    <polygon points="0,-14 14,0 0,14 -14,0" fill="${r.core}"/>
    ${shine ? '<path d="M-22-26L-12-30" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85"/><circle cx="-6" cy="-6" r="3" fill="#fff" opacity="0.7"/>' : ''}`;
}

export function crownSvg(level, { silhouette = false, label = '' } = {}) {
  const lvl = Math.min(MAX_CROWN, Math.max(1, level));
  const aria = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  if (silhouette) {
    return `<svg class="crown-svg silhouette" viewBox="0 0 120 120" ${aria}><g fill="currentColor">
      <path d="${BODY}"/><rect x="15" y="84" width="90" height="18" rx="4"/>
      ${TIPS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}
      <polygon points="${OCTAGON}" transform="translate(60 66) scale(0.5)" style="fill: var(--surface); opacity: 0.55"/></g></svg>`;
  }
  const m = METALS[lvl], r = RUBIES[lvl], id = `kr${lvl}`;
  const rays = lvl === 4
    ? `<g class="crown-rays" opacity="0.5">${Array.from({ length: 12 }, (_, k) => `<path d="M60 64L55 2L65 2Z" fill="url(#${id}-ray)" transform="rotate(${k * 30} 60 64)"/>`).join('')}</g>`
    : '';
  const sparkles = lvl >= 3
    ? [[24, 22, 0], [100, 18, 0.6], [104, 72, 1.1], [14, 70, 0.3], ...(lvl === 4 ? [[60, 8, 0.9], [36, 108, 1.4], [88, 110, 0.2]] : [])]
      .map(([x, y, delay]) => `<path class="crown-twinkle" d="${STAR}" fill="#fff8d6" transform="translate(${x} ${y})" style="animation-delay:${delay}s"/>`).join('')
    : '';
  const tips = TIPS.map(([x, y]) => (lvl === 4
    ? `<g transform="translate(${x} ${y}) scale(0.2)">${gem(RUBIES[3], { shine: true })}</g>`
    : `<circle cx="${x}" cy="${y}" r="6" fill="url(#${id}-ball)"/>`)).join('');
  const band = lvl === 4
    ? `<text x="60" y="99" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="16" fill="#7a0a26" stroke="#fff6c4" stroke-width="0.6" class="crown-33">33</text>`
    : [32, 46, 74, 88].map((x) => `<circle cx="${x}" cy="93" r="2.4" fill="${m.light}" opacity="${lvl === 1 ? 0.45 : 0.9}"/>`).join('');
  return `<svg class="crown-svg lvl-${lvl}" viewBox="0 0 120 120" ${aria}>
    <defs>
      <linearGradient id="${id}-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.light}"/><stop offset="0.55" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>
      <linearGradient id="${id}-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>
      <radialGradient id="${id}-ball" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stop-color="${m.light}"/><stop offset="1" stop-color="${m.dark}"/></radialGradient>
      <radialGradient id="${id}-glow"><stop offset="0" stop-color="#ff3d6b" stop-opacity="0.75"/><stop offset="1" stop-color="#ff3d6b" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-ray" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></linearGradient>
    </defs>
    ${rays}
    ${lvl >= 3 ? `<circle class="crown-glow" cx="60" cy="66" r="${lvl === 4 ? 34 : 24}" fill="url(#${id}-glow)"/>` : ''}
    <path d="${BODY}" fill="url(#${id}-metal)" stroke="${m.dark}" stroke-width="1.2" stroke-linejoin="round"/>
    ${lvl >= 2 ? `<path class="crown-shine" d="M22 82L17 46L30 57" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${lvl === 2 ? 0.55 : 0.75}"/>` : ''}
    <rect x="15" y="84" width="90" height="18" rx="4" fill="url(#${id}-band)" stroke="${m.dark}" stroke-width="1.2"/>
    ${band}
    ${tips}
    <g class="crown-gem" transform="translate(60 66) scale(${lvl === 4 ? 0.56 : 0.5})">${gem(r, { shine: lvl >= 2 })}</g>
    ${sparkles}
  </svg>`;
}
