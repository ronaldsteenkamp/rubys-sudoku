// Bos: zachte lichtvlekken alsof de zon door de bladeren valt, af en toe een
// eekhoorntje met een nootje in een hoekje, en bij het oplossen dwarrelende blaadjes.
// Alleen geladen als Bos het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer, animalTimer, peek, removeAnimal, overlay, seeded } from './lib/natuur.js';

export const SQUIRREL = `<svg viewBox="0 0 80 70" aria-hidden="true">
  <path d="M14 62C-2 52 2 22 18 14c10-5 20 2 18 12c-2 8-12 6-12 14c0 8 8 12 4 20z" fill="#b8622c"/>
  <path d="M16 54C6 46 8 28 18 22" stroke="#d9874f" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <ellipse cx="40" cy="52" rx="16" ry="14" fill="#c8713a"/>
  <ellipse cx="44" cy="55" rx="8" ry="9" fill="#f3d2a8"/>
  <g class="kop"><circle cx="52" cy="32" r="12" fill="#c8713a"/>
    <path d="M44 23l2-9 5 7z" fill="#a9522a"/><path d="M53 21l4-8 3 9z" fill="#a9522a"/>
    <circle cx="56" cy="31" r="2.6" fill="#2a1a10"/><circle cx="57" cy="30" r="0.9" fill="#ffffff"/>
    <ellipse cx="63" cy="35" rx="2" ry="1.6" fill="#3a2414"/>
    <circle cx="55" cy="37" r="2.2" fill="#f2a7b8" opacity="0.55"/></g>
  <g class="noot"><ellipse cx="60" cy="47" rx="5" ry="6" fill="#8a5a2b"/><path d="M55 44q5-5 10 0" fill="#5f3d1c"/></g>
  <ellipse cx="54" cy="47" rx="3" ry="2.4" fill="#c8713a"/><ellipse cx="64" cy="49" rx="3" ry="2.4" fill="#c8713a"/>
  <ellipse cx="36" cy="66" rx="6" ry="3" fill="#a9522a"/><ellipse cx="48" cy="66" rx="6" ry="3" fill="#a9522a"/>
</svg>`;

const LEAF = (fill) => `<svg viewBox="0 0 30 20"><path d="M2 10C8 0 22 0 28 10C22 20 8 20 2 10Z" fill="${fill}"/><path d="M3 10H27" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1"/></svg>`;
const LEAF_COLOURS = ['#7fa34e', '#a7c06a', '#c99a3b', '#5d8238', '#d5893a'];

let stopTimer = null;

export function start() {
  const rnd = seeded(7);
  let spots = '';
  for (let k = 0; k < 5; k++) {
    spots += `<i class="zon" style="left:${(rnd() * 90).toFixed(0)}%;top:${(rnd() * 85).toFixed(0)}%;--s:${(110 + rnd() * 120).toFixed(0)}px;--d:${(9 + rnd() * 8).toFixed(1)}s;animation-delay:-${(rnd() * 9).toFixed(1)}s"></i>`;
  }
  createLayer('bos', spots);
  stopTimer ??= animalTimer((forced) => Boolean(peek('eekhoorntje', SQUIRREL, { w: 60, h: 62, stay: 6500, forced })));
}

// Bij het oplossen: een handvol blaadjes dwarrelt naar beneden (niet met minder beweging).
export function solved({ reduced }) {
  if (reduced) return;
  let leaves = '';
  for (let k = 0; k < 14; k++) {
    const s = 16 + Math.random() * 14;
    leaves += `<i style="left:${(Math.random() * 96).toFixed(0)}%;--s:${s.toFixed(0)}px;--x:${((Math.random() - 0.5) * 140).toFixed(0)}px;--r:${(Math.random() * 540 - 270).toFixed(0)}deg;--d:${(3.6 + Math.random() * 2.4).toFixed(1)}s;animation-delay:${(Math.random() * 1.2).toFixed(2)}s">${LEAF(LEAF_COLOURS[k % LEAF_COLOURS.length])}</i>`;
  }
  overlay('blaadjes', leaves, 8000);
}

export function stop() {
  stopTimer?.();
  stopTimer = null;
  removeAnimal();
  removeLayer();
}
