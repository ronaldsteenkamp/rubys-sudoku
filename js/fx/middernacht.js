// Middernacht (geheim): een grote, zachte klok achter het bord, waarvan de wijzers
// echt meelopen (lokale tijd, dus ook goed met zomer- en wintertijd). Om precies
// middernacht slaat hij twaalf zachte slagen, als de app open en in beeld is (met de
// gewone geluidsinstelling). De wijzers draaien alleen met transform; is de app niet in
// beeld, dan staat alles stil en klopt de tijd weer zodra ze terugkomt.
// Alleen geladen als Middernacht het thema is.

import { createLayer, removeLayer } from './lib/natuur.js';
import { bell, play } from './lib/klank.js';
import { struckMidnight } from '../themes.js';

// De hoeken (graden, vanaf 12 uur met de klok mee) van de uur- en minuutwijzer.
export function handAngles(date) {
  const m = date.getMinutes() + date.getSeconds() / 60;
  return { hour: ((date.getHours() % 12) + m / 60) * 30, minute: m * 6 };
}

export const STRIKES = 12;
export const STRIKE_GAP = 1.7; // seconden tussen twee slagen

const ticks = Array.from({ length: 60 }, (_, k) => {
  const big = k % 5 === 0, a = (k * 6 * Math.PI) / 180, r1 = big ? 80 : 86;
  const p = (r) => `${(100 + r * Math.sin(a)).toFixed(1)} ${(100 - r * Math.cos(a)).toFixed(1)}`;
  return `<path d="M${p(r1)}L${p(92)}" stroke-width="${big ? 3 : 1.2}"/>`;
}).join('');
const CLOCK = `<svg viewBox="0 0 200 200" aria-hidden="true">
  <circle cx="100" cy="100" r="97" fill="rgb(255 255 255 / 4%)" stroke="#e8c46a" stroke-opacity="0.5" stroke-width="2"/>
  <g stroke="#e8c46a" stroke-opacity="0.55" stroke-linecap="round">${ticks}</g>
  <g class="wijzer uur"><path d="M100 108V30" stroke="#e8c46a" stroke-width="7" stroke-linecap="round"/></g>
  <g class="wijzer minuut"><path d="M100 112V6" stroke="#f3d68e" stroke-width="4" stroke-linecap="round"/></g>
  <circle cx="100" cy="100" r="5" fill="#f3d68e"/>
</svg>`;

let ctx = null, timer = null, last = null;

function tick() {
  const now = ctx.now();
  const { hour, minute } = handAngles(now);
  const layer = document.querySelector('.fx-middernacht');
  for (const [cls, angle] of [['uur', hour], ['minuut', minute]]) {
    const hand = layer?.querySelector(`.${cls}`);
    if (!hand) continue;
    // Over de 12 heen: niet een rondje terug draaien, maar meteen verder.
    hand.style.transition = angle < Number(hand.dataset.angle ?? 0) ? 'none' : '';
    hand.dataset.angle = angle;
    hand.style.transform = `rotate(${angle.toFixed(2)}deg)`;
  }
  if (last && struckMidnight(last, now) && document.visibilityState === 'visible') chime();
  last = now;
}

// Twaalf zachte slagen.
export function chime() {
  for (let k = 0; k < STRIKES; k++) play('klokslag', (sr) => bell({ sampleRate: sr }), { at: k * STRIKE_GAP, gain: 0.07 });
  document.querySelector('.fx-middernacht')?.classList.add('slaat');
  setTimeout(() => document.querySelector('.fx-middernacht')?.classList.remove('slaat'), STRIKES * STRIKE_GAP * 1000);
}

export function start(c) {
  ctx = c;
  createLayer('middernacht', `<i class="klok">${CLOCK}</i>`);
  clearInterval(timer);
  last = null;
  tick();
  timer = setInterval(tick, 1000);
}

export function stop() {
  clearInterval(timer);
  timer = null;
  removeLayer();
}
