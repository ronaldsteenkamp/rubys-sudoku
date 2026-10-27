// Wandeltijd (geheim): af en toe kwispelt er een staartje om de hoek (dezelfde
// regels als het zeehondje: nooit over een knop of het bord, wegduiken bij een tik
// ergens anders, niet in de slaapstand of met minder beweging), en bij het oplossen
// rent er een hond met een riem in z'n bek voorbij. De pootafdruk als gekozen vakje
// is gewoon CSS. Alleen geladen als Wandeltijd het thema is.

import { animalTimer, peek, removeAnimal, overlay } from './lib/natuur.js';

// Een kwispelend staartje (rechts gespiegeld, net als de andere dieren).
export const TAIL = `<svg viewBox="0 0 48 60" aria-hidden="true">
  <ellipse cx="6" cy="44" rx="18" ry="14" fill="#b8763a"/>
  <g class="kwispel"><path d="M14 40C26 36 34 24 36 8C38 4 44 6 42 12C40 28 30 42 18 48Z" fill="#c98a4b"/>
  <path d="M36 8C38 4 44 6 42 12C41 15 37 15 36 12Z" fill="#f3ddb8"/></g>
</svg>`;

// Een hond die rent, met een rode riem in z'n bek.
export const DOG = `<svg viewBox="0 0 120 80" aria-hidden="true">
  <path d="M18 34C10 30 6 22 10 16" stroke="#c98a4b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="40" rx="34" ry="16" fill="#c98a4b"/>
  <ellipse cx="52" cy="46" rx="22" ry="8" fill="#f3ddb8"/>
  <g class="poten" fill="#b8763a"><rect x="24" y="48" width="9" height="22" rx="4.5"/><rect x="66" y="48" width="9" height="22" rx="4.5"/></g>
  <g class="poten p2" fill="#a8672e"><rect x="34" y="48" width="9" height="20" rx="4.5"/><rect x="76" y="48" width="9" height="20" rx="4.5"/></g>
  <circle cx="90" cy="28" r="16" fill="#c98a4b"/>
  <path d="M80 16C76 8 82 2 88 10Z" fill="#8e5526"/>
  <ellipse cx="104" cy="32" rx="9" ry="7" fill="#f3ddb8"/>
  <circle cx="111" cy="29" r="3" fill="#2a1a10"/>
  <circle cx="94" cy="24" r="2.6" fill="#2a1a10"/><circle cx="95" cy="23" r="0.9" fill="#ffffff"/>
  <path d="M100 38C104 44 112 40 112 36" fill="#e85d7a"/>
  <path d="M104 37C98 50 84 58 62 62C50 64 40 66 30 74" stroke="#d9363e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="30" cy="74" r="4" fill="none" stroke="#d9363e" stroke-width="2.5"/>
</svg>`;

let stopTimer = null;

export function start() {
  stopTimer ??= animalTimer((forced) => Boolean(peek('staartje', TAIL, { w: 40, h: 58, stay: 5500, forced })), { first: 60000, every: 140000 });
}

// Bij het oplossen rent er een hond voorbij (niet met minder beweging).
export function solved({ reduced }) {
  if (reduced) return;
  overlay('hond', `<i>${DOG}</i>`, 4200);
}

export function stop() {
  stopTimer?.();
  stopTimer = null;
  removeAnimal();
  document.querySelector('.fx-over.fx-hond')?.remove();
}
