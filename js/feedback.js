// Geluidjes (Web Audio, geen bestanden nodig) en haptische feedback.
// Twee geluidsstijlen: 'zacht' (piepjes, hieronder) en 'gitaar' (getokkelde snaren, zie guitar.js).

import { createGuitar, ALL_STRINGS } from './guitar.js';

let ctx = null;
let master = null; // hoofdvolume: alle geluiden gaan hierdoorheen
let guitar = null;
let enabled = { sound: 'zacht', haptics: true, volume: 1 };

// `volume` (0–1): de slaapstand zet het op de helft.
export function configure(settings, { volume = 1 } = {}) {
  enabled = { sound: settings.sound, haptics: settings.haptics, volume };
  if (master) master.gain.value = volume;
}

function audio() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled.volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { at = 0, dur = 0.12, gain = 0.06, type = 'sine' } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  place: () => tone(740, { dur: 0.09, gain: 0.05 }),
  note: () => tone(1180, { dur: 0.05, gain: 0.025 }),
  erase: () => tone(420, { dur: 0.08, gain: 0.035, type: 'triangle' }),
  wrong: () => { tone(330, { dur: 0.16, gain: 0.04, type: 'triangle' }); tone(277, { at: 0.08, dur: 0.18, gain: 0.035, type: 'triangle' }); },
  hint: () => { tone(880, { dur: 0.18, gain: 0.035 }); tone(1320, { at: 0.07, dur: 0.22, gain: 0.025 }); },
  done: () => [523, 659, 784].forEach((f, k) => tone(f, { at: k * 0.05, dur: 0.18, gain: 0.03 })),
  solved: () => [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, { at: k * 0.11, dur: 0.5, gain: 0.045 })),
  hold: () => {}, // lang drukken: alleen een tikje, geen geluid (de notitie zelf piept al)
};

const PATTERNS = { place: 8, note: 4, erase: 6, wrong: [14, 60, 14], hint: 10, done: [8, 40, 8], solved: [20, 60, 20, 60, 40], hold: 12 };

export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// iOS Safari kent navigator.vibrate niet, maar geeft (vanaf iOS 18) een zachte
// tik bij het omzetten van een <input type="checkbox" switch>. Dat gebruiken we.
const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);
let iosSwitch = null;
function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-9999px;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.append(input);
    document.body.append(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

export const hasHaptics = canVibrate || isIOS;

// De gitaar pas bij de eerste tik maken (iOS start geluid alleen na een tik).
function playGuitar(kind, opts) {
  const a = audio();
  if (!a) return;
  if (!guitar) {
    guitar = createGuitar(a, master);
    // De andere klanken alvast maken, in rustige momenten, zodat geen tik hoeft te wachten.
    const idle = globalThis.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 500 }) : (fn) => setTimeout(fn, 40);
    setTimeout(() => guitar.warm(ALL_STRINGS, idle), 400);
  }
  guitar.play(kind, opts);
}

// `opts.digit`: welk cijfer het is (bij Gitaar heeft elk cijfer een eigen toon).
export function feedback(kind, opts = {}) {
  try {
    if (enabled.sound === 'zacht') SOUNDS[kind]?.();
    else if (enabled.sound === 'gitaar') playGuitar(kind, opts);
  } catch { /* geen geluid, geen probleem */ }
  // 'unlock' en 'preview' zijn alleen geluid; de trilling blijft zoals hij was.
  if (enabled.haptics && kind !== 'unlock' && kind !== 'preview') {
    try {
      if (canVibrate) navigator.vibrate(PATTERNS[kind] ?? 6);
      else if (isIOS && kind !== 'note') iosTick();
    } catch { /* idem */ }
  }
}
