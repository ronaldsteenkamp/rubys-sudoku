// Noorderlicht: boven het bord golven langzaam groene en paarse lichtbanen
// (CSS, 20–40 s per golf). Bij het oplossen laait het even op.
// Alleen geladen als Noorderlicht het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer } from './lib/natuur.js';

export function start() {
  createLayer('noorderlicht', `
    <i class="baan b1" style="--d:28s"></i>
    <i class="baan b2" style="--d:36s"></i>
    <i class="baan b3" style="--d:22s"></i>`);
}

export function solved({ reduced }) {
  const layer = document.querySelector('.fx-noorderlicht');
  if (!layer || reduced) return;
  layer.classList.remove('oplaaien');
  void layer.offsetWidth;
  layer.classList.add('oplaaien');
  setTimeout(() => layer.classList.remove('oplaaien'), 4200);
}

export const stop = removeLayer;
