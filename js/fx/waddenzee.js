// Waddenzee: een zilverig glinsterend streepje zee onderaan, en af en toe kijkt er
// een zeehondje om de hoek. Tik je erop, dan zwaait hij met een flipper.
// Alleen geladen als Waddenzee het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer, animalTimer, peek, leave, removeAnimal } from './lib/natuur.js';

// Een zeehondje dat van links om de hoek kijkt (rechts wordt hij gespiegeld).
export const SEAL = `<svg viewBox="0 0 90 64" aria-hidden="true">
  <ellipse cx="30" cy="44" rx="40" ry="18" fill="#8e9ba4"/>
  <ellipse cx="34" cy="50" rx="30" ry="9" fill="#a9b5bc"/>
  <g class="flipper"><path d="M44 50c6 2 12 8 12 13c-6 0-12-4-15-9z" fill="#76848d"/></g>
  <circle cx="62" cy="30" r="20" fill="#9aa7af"/>
  <circle cx="56" cy="22" r="2.6" fill="#7f8c94" opacity="0.5"/>
  <circle cx="68" cy="27" r="3.6" fill="#1d2a31"/><circle cx="56" cy="27" r="3.6" fill="#1d2a31"/>
  <circle cx="69.2" cy="25.8" r="1.2" fill="#ffffff"/><circle cx="57.2" cy="25.8" r="1.2" fill="#ffffff"/>
  <ellipse cx="66" cy="36" rx="7" ry="5" fill="#b9c4ca"/>
  <ellipse cx="66" cy="33.5" rx="2.6" ry="1.8" fill="#2a363c"/>
  <path d="M58 37h-10M58 39l-9 3M74 37h9M74 39l9 3" stroke="#5d6a72" stroke-width="0.9" stroke-linecap="round"/>
  <circle cx="51" cy="35" r="2" fill="#f2a7b8" opacity="0.6"/><circle cx="80" cy="35" r="2" fill="#f2a7b8" opacity="0.6"/>
</svg>`;

let stopTimer = null;

export function start() {
  createLayer('waddenzee', '<i class="glint"></i><i class="glint g2"></i>');
  stopTimer ??= animalTimer((forced) => Boolean(peek('zeehondje', SEAL, {
    w: 64, h: 64, stay: 5000, forced,
    onTap: (el) => {
      el.classList.remove('zwaai');
      void el.offsetWidth;
      el.classList.add('zwaai');
      if (!forced) setTimeout(() => leave(el), 1600);
    },
  })));
}

export function stop() {
  stopTimer?.();
  stopTimer = null;
  removeAnimal();
  removeLayer();
}
