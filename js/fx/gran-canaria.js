// Gran Canaria: een palmboom rechtsboven op het startscherm (de tekst loopt
// ernaast, dus hij bedekt nooit een knop of het bord). Tik er vijf keer op en er
// valt een kokosnoot; tik op de kokosnoot en het geheime thema Vertrekhal is vrij.
// Alleen geladen als Gran Canaria het thema is.

import { tapCounter, PALM_TAPS } from '../themes.js';

export const PALM = `<svg viewBox="0 0 80 120" aria-hidden="true">
  <path d="M36 118C40 92 44 66 42 34L48 34C52 66 50 92 46 118Z" fill="#a37a4c"/>
  <path d="M39 112h8M40 100h8M41 88h8M42 76h7M43 64h7M43 52h6" stroke="#7d5a34" stroke-width="2" stroke-linecap="round"/>
  <g class="kroon" fill="#2f8f6f">
    <path d="M45 34C30 20 12 22 2 34C16 28 30 30 45 36Z"/>
    <path d="M45 34C34 14 18 8 6 12C20 14 34 22 44 37Z" fill="#3aa57f"/>
    <path d="M45 34C46 16 56 4 70 2C60 12 52 24 47 37Z"/>
    <path d="M45 34C60 22 74 22 80 32C68 28 56 30 46 37Z" fill="#3aa57f"/>
    <path d="M45 34C58 34 70 44 72 58C64 46 54 40 45 38Z"/>
    <path d="M45 34C34 36 22 46 20 60C28 48 38 40 46 38Z" fill="#3aa57f"/>
  </g>
  <circle cx="41" cy="38" r="4.5" fill="#7a5130"/><circle cx="49" cy="39" r="4.5" fill="#6a4426"/>
</svg>`;
export const COCONUT = `<svg viewBox="0 0 30 30" aria-hidden="true">
  <circle cx="15" cy="15" r="13" fill="#7a5130"/>
  <path d="M6 10c4-5 12-6 17-2" stroke="#9b6c42" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="12" cy="17" r="1.8" fill="#3d2614"/><circle cx="18" cy="17" r="1.8" fill="#3d2614"/><circle cx="15" cy="22" r="1.8" fill="#3d2614"/>
</svg>`;

export function home(ctx) {
  const head = document.querySelector('.home-head');
  if (!head || head.querySelector('.palm')) return;
  const box = document.createElement('div');
  box.className = 'palm';
  box.innerHTML = `<button type="button" class="palm-tree" aria-label="Een palmboom">${PALM}</button>`;
  head.prepend(box);
  head.classList.add('with-palm');
  const tree = box.querySelector('.palm-tree');
  const tap = tapCounter(PALM_TAPS);
  tree.addEventListener('click', () => {
    tree.classList.remove('wiegen');
    void tree.offsetWidth;
    tree.classList.add('wiegen');
    if (!tap(performance.now()) || box.querySelector('.kokosnoot')) return;
    // Plof: er valt een kokosnoot naast de stam.
    const nut = document.createElement('button');
    nut.type = 'button';
    nut.className = 'kokosnoot';
    nut.setAttribute('aria-label', 'Een kokosnoot');
    nut.innerHTML = COCONUT;
    nut.addEventListener('click', () => {
      nut.classList.add('weg');
      setTimeout(() => nut.remove(), 400);
      ctx.secret('vertrekhal');
    });
    box.append(nut);
  });
}

export function stop() {
  document.querySelector('.home-head .palm')?.remove();
  document.querySelector('.home-head')?.classList.remove('with-palm');
}
