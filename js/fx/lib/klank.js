// Kleine geluidjes voor de geheime thema's: applaus, knisperen, het klakken van een
// vertrekbord, een klokslag. Zonder geluidsbestanden: het rekenwerk is puur (een
// Float32Array met een piek van hooguit 1) en draait ook in Node, zodat de tests het
// kunnen controleren. play() speelt zo'n geluid af via themeAudio() uit feedback.js,
// dus alleen als het geluid aan staat, en op half volume in de slaapstand.

import { themeAudio } from '../../feedback.js';

// Een vaste reeks ruis (-1..1), zodat een geluid steeds hetzelfde klinkt.
export function noise(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1;
  };
}

// Op piek `peak` brengen en de laatste 20 ms uitfaden (geen klik aan het eind).
function finish(out, sampleRate, peak = 1) {
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? peak / max : 0;
  const fade = Math.min(out.length, Math.round(0.02 * sampleRate));
  for (let i = 0; i < out.length; i++) out[i] *= scale * Math.min(1, (out.length - 1 - i) / fade);
  return out;
}

// Eén kort tikje ruis dat snel uitsterft, bij sample `at`.
function burst(out, at, rand, { length, decay, gain = 1 }) {
  for (let i = 0; i < length && at + i < out.length; i++) out[at + i] += rand() * gain * Math.exp(-i / decay);
}

// Applaus van de tribune: een hoop korte klapjes, die even aanzwellen en dan wegebben.
export function applause({ sampleRate = 44100, seconds = 1.6, claps = 110, seed = 33 } = {}) {
  const out = new Float32Array(Math.round(seconds * sampleRate));
  const rand = noise(seed);
  for (let k = 0; k < claps; k++) {
    // Meer klapjes in het begin, daarna steeds minder (en zachter).
    const p = ((rand() + 1) / 2) ** 1.6;
    burst(out, Math.floor(p * (out.length - 2000)), rand, { length: 900, decay: 70 + 60 * ((rand() + 1) / 2), gain: 1 - 0.6 * p });
  }
  return finish(out, sampleRate);
}

// Knisperend hout: hier en daar een heel kort tikje, sommige wat harder.
export function crackle({ sampleRate = 44100, seconds = 1.2, pops = 26, seed = 7 } = {}) {
  const out = new Float32Array(Math.round(seconds * sampleRate));
  const rand = noise(seed);
  for (let k = 0; k < pops; k++) {
    const at = Math.floor(((rand() + 1) / 2) * (out.length - 400));
    burst(out, at, rand, { length: 300, decay: 12 + 20 * ((rand() + 1) / 2), gain: 0.3 + 0.7 * ((rand() + 1) / 2) ** 3 });
  }
  return finish(out, sampleRate);
}

// Het klakje van een split-flap-bordje: een droog tikje met een houten ondertoon.
export function clack({ sampleRate = 44100, seed = 3 } = {}) {
  const out = new Float32Array(Math.round(0.05 * sampleRate));
  const rand = noise(seed);
  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate;
    out[i] = (rand() * 0.6 + Math.sin(2 * Math.PI * 1150 * t) * 0.5) * Math.exp(-t / 0.006);
  }
  return finish(out, sampleRate);
}

// Een zachte klokslag: de grondtoon met een paar boventonen die langzaam uitsterven.
export function bell({ sampleRate = 44100, freq = 196, seconds = 2.6 } = {}) {
  const out = new Float32Array(Math.round(seconds * sampleRate));
  const partials = [[1, 1, 1.6], [2, 0.5, 1], [2.76, 0.28, 0.6], [5.4, 0.12, 0.3]];
  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate;
    let v = 0;
    for (const [f, a, d] of partials) v += a * Math.exp(-t / d) * Math.sin(2 * Math.PI * freq * f * t);
    out[i] = v * Math.min(1, t / 0.004);
  }
  return finish(out, sampleRate);
}

// Speelt `make(sampleRate)` af (de buffer wordt één keer gemaakt en bewaard onder `key`).
// Optioneel door een filter (`filter`: { type, freq, q }). Geeft true als het klinkt.
const buffers = new Map();
export function play(key, make, { at = 0, gain = 0.05, filter = null, rate = 1 } = {}) {
  const o = themeAudio();
  if (!o) return false;
  try {
    const { ctx, out } = o;
    let buf = buffers.get(key);
    if (!buf || buf.sampleRate !== ctx.sampleRate) {
      const data = make(ctx.sampleRate);
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      buffers.set(key, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    let node = src;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type;
      f.frequency.value = filter.freq;
      f.Q.value = filter.q ?? 0.7;
      node = node.connect(f);
    }
    node.connect(g).connect(out);
    src.start(ctx.currentTime + at);
    return true;
  } catch { return false; }
}

// Een zuivere toon met een zachte aanzet (voor een fluitje of een belletje).
// `wobble`: [snelheid in Hz, diepte in Hz] voor het rollen van een scheidsrechtersfluitje.
export function tone(freq, { at = 0, dur = 0.3, gain = 0.03, type = 'sine', wobble = null } = {}) {
  const o = themeAudio();
  if (!o) return false;
  try {
    const { ctx, out } = o;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (wobble) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = wobble[0];
      depth.gain.value = wobble[1];
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.setValueAtTime(gain, t + Math.max(0.02, dur - 0.04));
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    return true;
  } catch { return false; }
}
