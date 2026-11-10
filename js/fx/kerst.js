// Kerst: bij het oplossen dwarrelen er sneeuwvlokjes over het scherm, in plaats
// van de gewone confetti (zie onSolved in ui.js). Alleen geladen als Kerst het thema is.
// Met minder beweging gebeurt er niets; in de slaapstand valt de sneeuw op half tempo (--fx-tempo).

import { overlay } from './lib/natuur.js';

// Een sneeuwvlokje: zes armpjes met elk twee takjes.
const ARM = '<path d="M0 0V-10M0-6L-3-9M0-6L3-9M0-3L-2-5M0-3L2-5"/>';
export const FLAKE = `<svg viewBox="-12 -12 24 24"><g stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" fill="none">${
  [0, 60, 120, 180, 240, 300].map((r) => `<g transform="rotate(${r})">${ARM}</g>`).join('')}</g><circle r="1.6" fill="#ffffff"/></svg>`;

export const FLAKES = 36;

export function solved({ reduced }) {
  // Ook met minder beweging geen gewone confetti: die staat dan toch al uit.
  if (reduced) return { celebrated: true };
  let snow = '';
  for (let k = 0; k < FLAKES; k++) {
    const s = 10 + Math.random() * 18;
    snow += `<i style="left:${(Math.random() * 98).toFixed(1)}%;--s:${s.toFixed(0)}px;--o:${(0.55 + Math.random() * 0.45).toFixed(2)};--x:${((Math.random() - 0.5) * 120).toFixed(0)}px;--r:${(Math.random() * 360 - 180).toFixed(0)}deg;--d:${(4.5 + Math.random() * 3.5).toFixed(1)}s;animation-delay:${(Math.random() * 2.2).toFixed(2)}s">${FLAKE}</i>`;
  }
  overlay('sneeuw', snow, 11000);
  // De sneeuw ís het feestje: geen gewone confetti erbij.
  return { celebrated: true };
}
