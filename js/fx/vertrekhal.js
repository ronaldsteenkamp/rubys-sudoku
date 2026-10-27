// Vertrekhal (geheim): elk cijfer dat ze invult ratelt als een klapbordje (Solari)
// kort door tot het juiste cijfer, met een zacht klakje. Boven het bord staat
// LAS PALMAS · ON TIME; bij het oplossen klapt dat om naar BOARDING 💛.
// Alleen voor de show: de puzzel zelf verandert er niet door. Met minder beweging
// staat alles stil (meteen het goede cijfer, geen geklapper).
// Alleen geladen als Vertrekhal het thema is.

import { clack, play } from './lib/klank.js';

export const ON_TIME = 'LAS PALMAS · ON TIME';
export const BOARDING = 'BOARDING 💛';
export const FLAPS = 4; // zoveel cijfers ratelen voorbij voor het goede

// De cijfers die voorbijkomen, eindigend op `digit`: de bordjes ervoor, op volgorde.
export const flapRun = (digit, n = FLAPS) => Array.from({ length: n + 1 }, (_, k) => ((digit - n + k + 8) % 9) + 1);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sound = () => play('klak', (sr) => clack({ sampleRate: sr }), { gain: 0.05 });

function status(text, animate) {
  const wrap = document.querySelector('.board-wrap');
  if (!wrap) return;
  let el = wrap.querySelector('.flapstatus');
  if (!el) {
    el = document.createElement('div');
    el.className = 'flapstatus';
    el.setAttribute('aria-hidden', 'true');
    wrap.prepend(el);
  }
  if (el.dataset.text === text) return;
  el.dataset.text = text;
  el.innerHTML = [...text].map((ch) => `<span${ch === ' ' ? ' class="leeg"' : ''}>${ch}</span>`).join('');
  if (animate && !reduced()) {
    [...el.children].forEach((span, k) => { span.style.animationDelay = `${k * 35}ms`; span.classList.add('klap'); });
  }
}

export function start() { status(ON_TIME, false); }
export function home() { status(ON_TIME, false); }

export function placed(ctx, { cell }) {
  if (reduced()) return;
  const span = ctx.board.children[cell]?.querySelector('.v');
  if (!span) return;
  const digit = Number(span.textContent);
  const run = flapRun(digit);
  run.forEach((d, k) => setTimeout(() => {
    if (!span.isConnected) return;
    span.textContent = String(d);
    span.classList.remove('klap');
    void span.offsetWidth;
    span.classList.add('klap');
    if (k % 2 === 0 || k === run.length - 1) sound();
  }, k * 55));
}

export function solved() {
  status(BOARDING, true);
  sound();
}

export function stop() {
  document.querySelector('.flapstatus')?.remove();
}
