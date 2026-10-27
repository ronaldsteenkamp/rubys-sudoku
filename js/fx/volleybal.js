// Volleybal: af en toe ligt er een bal op het startscherm. Tik erop en hij gaat de
// lucht in; tik hem opnieuw voordat hij valt. Valt hij, dan begint de telling
// opnieuw. 33 keer hooghouden (haar rugnummer) speelt het geheime thema Sporthal vrij
// (de telling zelf is puur: keepUp in themes.js).
// De bal ligt in een eigen strookje rechts in het kopje van het startscherm (de
// tekst loopt ernaast), dus hij komt nooit over het bord of een knop. Niet in de
// slaapstand en niet met minder beweging. Met ?bal=1 ligt hij er meteen (om te testen).
// Alleen geladen als Volleybal het thema is.

import { keepUp, KEEP_UP } from '../themes.js';
import { reducedMotion, sleeping } from './lib/natuur.js';

// Een volleybal: geel en blauw, in de clubkleuren van Donitas.
export const BALL = `<svg viewBox="0 0 56 56" aria-hidden="true">
  <circle cx="28" cy="28" r="26" fill="#ffffff" stroke="#10265c" stroke-width="2.5"/>
  <path d="M28 2c-6 10-6 22 0 26c8 4 20 2 26-6" fill="#ffcc00"/>
  <path d="M28 28c-8 4-14 14-14 24c-8-4-12-10-12-18c6 0 18-2 26-6z" fill="#1d4fa3"/>
  <path d="M28 2c-6 10-6 22 0 26M28 28c8 4 20 2 26-6M28 28c-8 4-14 14-14 24M8 12c8 6 14 12 20 16M44 50c-2-10-8-18-16-22" fill="none" stroke="#10265c" stroke-width="2" stroke-linecap="round"/>
  <circle cx="28" cy="28" r="26" fill="none" stroke="#10265c" stroke-width="2.5"/>
</svg>`;

const CHANCE = 0.35; // de kans dat hij er ligt als het startscherm getekend wordt
const STAY = 60000;  // ligt hij zo lang stil, dan rolt hij weer weg

let timers = {};
const clear = () => { for (const t of Object.values(timers)) clearTimeout(t); timers = {}; };

export function home(ctx) {
  const head = document.querySelector('.home-head');
  if (!head || head.querySelector('.keepup')) return;
  const forced = new URLSearchParams(location.search).get('bal') === '1';
  if (reducedMotion() || (!forced && (sleeping() || Math.random() > CHANCE))) return;

  const court = document.createElement('div');
  court.className = 'keepup';
  court.style.setProperty('--air', `${KEEP_UP.airtime}ms`);
  court.innerHTML = `<span class="keepup-count" aria-live="polite" hidden></span>
    <button type="button" class="keepup-ball" aria-label="Een volleybal. Tik om hem hoog te houden">${BALL}</button>`;
  head.prepend(court);
  head.classList.add('with-keepup');
  const ball = court.querySelector('.keepup-ball');
  const count = court.querySelector('.keepup-count');
  const game = keepUp();

  const rest = () => { timers.away = setTimeout(() => remove(court), STAY); };
  ball.addEventListener('click', () => {
    clear();
    const r = game.tap(performance.now());
    count.hidden = false;
    count.textContent = r.count;
    ball.classList.remove('up', 'plof');
    void ball.offsetWidth; // de vlucht opnieuw beginnen
    ball.classList.add('up');
    timers.land = setTimeout(() => {
      // Niet op tijd geraakt: hij valt, en de telling begint opnieuw.
      ball.classList.remove('up');
      ball.classList.add('plof');
      count.textContent = '0';
      rest();
    }, KEEP_UP.airtime);
    if (r.done) ctx.secret('sporthal');
  });
  rest();
}

function remove(court) {
  court.classList.add('weg');
  setTimeout(() => { court.remove(); document.querySelector('.home-head')?.classList.remove('with-keepup'); }, 600);
}

export function stop() {
  clear();
  document.querySelector('.keepup')?.remove();
  document.querySelector('.home-head')?.classList.remove('with-keepup');
}
