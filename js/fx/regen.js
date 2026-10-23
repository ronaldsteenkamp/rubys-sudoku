// Regenachtige dag: zachte druppels glijden langzaam over het scherm (achter het
// bord), af en toe lopen er twee samen. Met de eigen schakelaar (settings.rainSound,
// standaard uit) ook een heel zacht regengeluid: gefilterde ruis via Web Audio,
// alleen als het geluid aan staat en de app in beeld is.
// Alleen geladen als Regenachtige dag het thema is (zie loadFx in ui.js).

import { createLayer, removeLayer, seeded } from './lib/natuur.js';
import { audioOutput } from '../feedback.js';

const MAX_DROPS = 12;

// ---------- Druppels ----------

function drops() {
  const rnd = seeded(5);
  let html = '';
  for (let k = 0; k < MAX_DROPS; k++) {
    html += `<i class="druppel" style="left:${(rnd() * 96).toFixed(1)}%;top:${(rnd() * 70 - 5).toFixed(0)}%;--s:${(8 + rnd() * 8).toFixed(1)}px;--d:${(16 + rnd() * 14).toFixed(1)}s;animation-delay:-${(rnd() * 20).toFixed(1)}s"></i>`;
  }
  // Twee keer een paartje: het kleine druppeltje haalt het grote in en ze gaan samen verder.
  for (const [left, top, delay] of [[18, 8, -3], [74, 22, -14]]) {
    html += `<i class="druppel groot" style="left:${left}%;top:${top}%;--s:14px;--d:22s;animation-delay:${delay}s"></i>`;
    html += `<i class="druppel klein" style="left:${left + 0.6}%;top:${top - 4}%;--s:9px;--d:22s;animation-delay:${delay}s"></i>`;
  }
  return html;
}

// ---------- Regengeluid ----------

let rain = null; // { src, gain }
let ctx = null;

function noiseBuffer(ac) {
  // Twee seconden "bruine" ruis (zachter in de hoogte), die naadloos herhaalt.
  const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; data[i] = last * 3.2; }
  return buf;
}

function rainOn() {
  if (rain) return;
  const o = audioOutput();
  if (!o) return;
  const { ctx: ac, out } = o;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const low = ac.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 1400;
  const high = ac.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 280;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 1.5); // heel zacht, en rustig erin
  src.connect(low).connect(high).connect(gain).connect(out);
  src.start();
  rain = { src, gain, ac };
}

function rainOff() {
  if (!rain) return;
  const { src, gain, ac } = rain;
  rain = null;
  try {
    gain.gain.cancelScheduledValues(ac.currentTime);
    gain.gain.setTargetAtTime(0, ac.currentTime, 0.3);
    src.stop(ac.currentTime + 1.5);
  } catch { /* al gestopt */ }
}

// Regen aan als ze dat wil (en het geluid niet uit staat) en de app in beeld is.
export function update(c = ctx) {
  ctx = c;
  if (ctx?.rainWanted() && document.visibilityState === 'visible') rainOn(); else rainOff();
}
const onVisibility = () => update();

export function start(c) {
  createLayer('regen', drops());
  document.removeEventListener('visibilitychange', onVisibility);
  document.addEventListener('visibilitychange', onVisibility);
  update(c);
}

export function stop() {
  document.removeEventListener('visibilitychange', onVisibility);
  rainOff();
  ctx = null;
  removeLayer();
}

// Voor de tests: klinkt de regen nu?
export const raining = () => Boolean(rain);
