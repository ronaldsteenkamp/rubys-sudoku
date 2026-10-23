// Onderwater: lichtstrepen van boven en belletjes die langzaam opstijgen (achter
// het bord), en bij het oplossen zwemt er een klein scholetje visjes voorbij.
// Alleen geladen als Onderwater het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer, overlay, seeded } from './lib/natuur.js';

// Een eigen visje: rond lijfje, staartje, streepje en een groot oog.
export const FISH = (body, fin) => `<svg viewBox="0 0 64 40" aria-hidden="true">
  <path d="M8 20L-2 8V32Z" fill="${fin}" transform="translate(4 0)"/>
  <ellipse cx="34" cy="20" rx="24" ry="15" fill="${body}"/>
  <path d="M30 6c4 8 4 20 0 28" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M34 6l6-5 4 7z" fill="${fin}"/>
  <circle cx="48" cy="17" r="4.4" fill="#ffffff"/><circle cx="49" cy="17" r="2.4" fill="#123040"/>
  <path d="M54 25q2 1.5 4 0" stroke="#123040" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <circle cx="44" cy="24" r="2" fill="#ff9fb4" opacity="0.6"/>
</svg>`;

const MAX_BUBBLES = 12;

export function start() {
  const rnd = seeded(3);
  let html = '';
  for (let k = 0; k < 4; k++) html += `<i class="straal" style="left:${(8 + k * 24 + rnd() * 8).toFixed(0)}%;--d:${(14 + rnd() * 10).toFixed(1)}s;animation-delay:-${(rnd() * 10).toFixed(1)}s"></i>`;
  for (let k = 0; k < MAX_BUBBLES; k++) {
    html += `<i class="bel" style="left:${(rnd() * 96).toFixed(1)}%;top:${(20 + rnd() * 75).toFixed(0)}%;--s:${(5 + rnd() * 9).toFixed(0)}px;--d:${(14 + rnd() * 12).toFixed(1)}s;animation-delay:-${(rnd() * 20).toFixed(1)}s"></i>`;
  }
  createLayer('onderwater', html);
}

// Een klein scholetje over het hele scherm (niet met minder beweging).
export function solved({ reduced }) {
  if (reduced) return;
  const school = [['#ffb347', '#ff8a3d', 0, 0], ['#7fd6e0', '#38bfc9', 34, 0.25], ['#ffd166', '#f2a93b', -30, 0.45]];
  overlay('visjes', school.map(([body, fin, dy, delay], k) =>
    `<i style="--dy:${dy}px;--s:${k ? 46 : 64}px;animation-delay:${delay}s">${FISH(body, fin)}</i>`).join(''), 7000);
}

export const stop = removeLayer;
