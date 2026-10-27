// Kampvuur (geheim): een sterrenhemel boven, onderaan het scherm een warm
// flakkerende gloed en opstijgende vonkjes (achter het bord, nooit klikbaar). Bij
// het oplossen laait het vuur even op en knispert het zacht. Het gekozen vakje
// (een marshmallow die goudbruin kleurt) is gewoon CSS.
// Alleen geladen als Kampvuur het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer, seeded } from './lib/natuur.js';
import { crackle, play } from './lib/klank.js';

export const SPARKS = 14;
const STARS = 26;

export function start() {
  const rnd = seeded(11);
  let html = '';
  for (let k = 0; k < STARS; k++) {
    html += `<i class="ster" style="left:${(rnd() * 98).toFixed(1)}%;top:${(rnd() * 34).toFixed(1)}%;--s:${(1.5 + rnd() * 2).toFixed(1)}px;--d:${(3 + rnd() * 5).toFixed(1)}s;animation-delay:-${(rnd() * 6).toFixed(1)}s"></i>`;
  }
  html += '<i class="gloed"></i><i class="gloed g2"></i>';
  for (let k = 0; k < SPARKS; k++) {
    html += `<i class="vonk" style="left:${(30 + rnd() * 40).toFixed(1)}%;--s:${(2 + rnd() * 3).toFixed(1)}px;--x:${((rnd() - 0.5) * 80).toFixed(0)}px;--h:${(30 + rnd() * 30).toFixed(0)}vh;--d:${(3.5 + rnd() * 3).toFixed(1)}s;animation-delay:-${(rnd() * 6).toFixed(1)}s"></i>`;
  }
  createLayer('kampvuur', html);
}

// Het vuur laait even op (niet met minder beweging) en knispert zacht.
// Geeft { sound: true } als het knisperen het opgelost-geluid vervangt.
export function solved({ reduced }) {
  const layer = document.querySelector('.fx-kampvuur');
  if (layer && !reduced) {
    layer.classList.remove('oplaaien');
    void layer.offsetWidth;
    layer.classList.add('oplaaien');
    setTimeout(() => layer.classList.remove('oplaaien'), 2600);
  }
  return { sound: play('knisper', (sr) => crackle({ sampleRate: sr }), { gain: 0.09, filter: { type: 'highpass', freq: 900 } }) };
}

export const stop = removeLayer;
