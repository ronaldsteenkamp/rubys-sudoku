// Gitaargeluiden zonder geluidsbestanden: getokkelde snaren met het Karplus-Strong-algoritme.
// Het rekenwerk (pluck, harmonic) is puur en draait ook in Node, zodat de tests het kunnen
// controleren. createGuitar() speelt de klanken af in een AudioContext.

// ---------- Tonen ----------

// Frequentie van een toon als 'G3' of 'F#2' (A4 = 440 Hz).
const STEPS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
export function noteFreq(name) {
  const [, letter, sharp, octave] = name.match(/^([A-G])(#?)(\d)$/);
  const semis = STEPS[letter] + (sharp ? 1 : 0) + (Number(octave) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

// G-majeur pentatonisch (G A B D E), oplopend. Cijfer 1–9 = de eerste negen tonen;
// de rest is er voor het arpeggio boven de hoogste cijfers.
export const SCALE = ['G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5'];
export const digitNote = (d) => SCALE[d - 1];

// ---------- Synthese (puur) ----------

// Kleine, voorspelbare ruisgenerator (mulberry32), zodat dezelfde snaar altijd hetzelfde klinkt.
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1;
  };
}

// Eén getokkelde snaar (Karplus-Strong). Een korte ruisstoot loopt rond in een vertraging van
// één trillingsperiode; elke ronde middelt een filter twee opeenvolgende samples, zodat de hoge
// tonen sneller uitsterven dan de grondtoon, net als bij een echte snaar.
//   decay:      nagalmtijd in seconden: na zoveel tijd is de grondtoon 60 dB zachter
//               (kort = palm mute). Hoge boventonen sterven vanzelf sneller uit.
//   brightness: 0–1, hoe fel de aanslag is (lager = warmer, alsof je met de duim tokkelt)
//   duration:   lengte in seconden; de laatste 30 ms worden zacht uitgefaded
// Geeft een Float32Array met een piek van 1 terug (het volume regel je bij het afspelen).
export function pluck(freq, { sampleRate = 44100, decay = 3, brightness = 0.5, duration = 1.5, seed = 1 } = {}) {
  const length = Math.max(1, Math.round(duration * sampleRate));
  const out = new Float32Array(length);
  // Lusvertraging = sampleRate / freq. Het middelende filter vertraagt een halve sample, een
  // allpass-filter vult de rest aan zodat de toon precies klopt (niet afgerond op hele samples).
  const loop = sampleRate / freq;
  const n = Math.max(2, Math.floor(loop - 0.5 - 0.1));
  const frac = loop - 0.5 - n;
  const c = (1 - frac) / (1 + frac);
  // Wat er per ronde overblijft, zodat de nagalm in seconden gelijk is voor hoge en lage snaren.
  const gain = 0.001 ** (1 / (Math.max(0.01, decay) * freq));

  // De ruisstoot, door een eenvoudig laagdoorlaatfilter: minder helderheid = zachtere aanslag.
  const rand = noise(seed);
  const smooth = 1 - Math.min(0.97, Math.max(0, brightness)) * 0.97;
  const line = new Float32Array(n);
  let lp = 0, mean = 0;
  for (let i = 0; i < n; i++) { lp += (rand() - lp) * (1 - smooth); line[i] = lp; mean += lp; }
  mean /= n;
  for (let i = 0; i < n; i++) line[i] -= mean; // geen gelijkstroom, dan sterft hij netjes uit naar 0

  let idx = 0, prev = 0, apIn = 0, apOut = 0, peak = 0;
  for (let i = 0; i < length; i++) {
    const x = line[idx];
    out[i] = x;
    const avg = gain * 0.5 * (x + prev);
    prev = x;
    const ap = c * avg + apIn - c * apOut;
    apIn = avg; apOut = ap;
    line[idx] = ap;
    idx = idx + 1 === n ? 0 : idx + 1;
    const a = Math.abs(x);
    if (a > peak) peak = a;
  }
  return finish(out, peak, sampleRate);
}

// Een flageolet: een heldere, pure toon (sinus met een vleugje octaaf), snelle aanzet, lang uitklinken.
export function harmonic(freq, { sampleRate = 44100, duration = 2.2, attack = 0.006, release = 0.55 } = {}) {
  const length = Math.max(1, Math.round(duration * sampleRate));
  const out = new Float32Array(length);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t / attack) * Math.exp(-t / release);
    const v = env * (Math.sin(2 * Math.PI * freq * t) + 0.12 * Math.sin(4 * Math.PI * freq * t));
    out[i] = v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  return finish(out, peak, sampleRate);
}

// Op piek 1 brengen en de laatste 30 ms uitfaden (geen klik aan het eind).
function finish(out, peak, sampleRate) {
  const scale = peak > 0 ? 1 / peak : 0;
  const fade = Math.min(out.length, Math.round(0.03 * sampleRate));
  for (let i = 0; i < out.length; i++) {
    const left = out.length - 1 - i;
    out[i] *= scale * (left < fade ? left / fade : 1);
  }
  return out;
}

// ---------- Klankkleuren ----------

// Per soort klank de synthese-instellingen. Zie de samenvatting in de commit voor het waarom.
export const VOICES = {
  open: { decay: 2.4, brightness: 0.45, duration: 1.6 }, // een gewone getokkelde snaar
  mute: { decay: 0.16, brightness: 0.18, duration: 0.3 }, // palm mute: kort en dof
  strum: { decay: 3.5, brightness: 0.4, duration: 2.8 }, // akkoord: langer uitklinken
};

// ---------- Afspelen ----------

// Hoeveel klanken er tegelijk mogen klinken. Meer wordt bij snel tikken een harde brij.
export const MAX_VOICES = 8;

// G-majeur op zes snaren (G2 B2 D3 G3 B3 G4), van laag naar hoog zoals bij een downstroke.
export const G_CHORD = ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'];

// Het melodietje bij een nieuw geheim berichtje: zelf bedacht, in G-pentatonisch. Een motiefje
// (D E G) dat terugkomt met een hogere top (D E A) en dan thuiskomt op G. [toon, tijd in s]
export const UNLOCK_TUNE = [['D4', 0], ['E4', 0.14], ['G4', 0.28], ['D4', 0.5], ['E4', 0.64], ['A4', 0.78], ['B4', 1.02], ['G4', 1.26]];

// Alles wat de gitaar kan laten horen, in de volgorde waarin we het alvast maken:
// eerst de cijfers (die hoor je het vaakst), dan notities, dan de rest.
export const ALL_STRINGS = [
  ...SCALE.slice(0, 9).map((n) => [n, 'open']),
  ...SCALE.slice(0, 9).map((n) => [n, 'mute']),
  ['G2', 'mute'], ['G5', 'harmonic'],
  ...G_CHORD.map((n) => [n, 'strum']),
  ...SCALE.slice(9).map((n) => [n, 'open']),
];

// Zachte begrenzer: tanh over het bereik -1..1.
const SOFT_CLIP = Float32Array.from({ length: 1025 }, (_, i) => Math.tanh((i / 512 - 1) * 1.5) / Math.tanh(1.5));

// Een vast zaadje per toon: dezelfde snaar klinkt steeds hetzelfde.
const seedOf = (name) => [...name].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261);

// Speelt de gitaarklanken af in `ctx`. De buffers worden pas gemaakt als ze nodig zijn
// (de eerste tik) en daarna bewaard; warm() maakt de rest alvast in rustige momenten.
export function createGuitar(ctx) {
  const sr = ctx.sampleRate;
  const cache = new Map();

  function buffer(key, make) {
    let b = cache.get(key);
    if (!b) {
      const data = make();
      b = ctx.createBuffer(1, data.length, sr);
      if (b.copyToChannel) b.copyToChannel(data, 0); else b.getChannelData(0).set(data);
      cache.set(key, b);
    }
    return b;
  }
  // Een snaar in een bepaalde klankkleur ('open', 'mute', 'strum'), of een flageolet ('harmonic').
  function string(name, kind = 'open') {
    return buffer(`${kind}:${name}`, () => (kind === 'harmonic'
      ? harmonic(noteFreq(name), { sampleRate: sr })
      : pluck(noteFreq(name), { sampleRate: sr, ...VOICES[kind], seed: seedOf(name) })));
  }

  // Uitgang: een zachte laagdoorlaat voor een warme toon, en een zachte begrenzer als vangnet.
  // Geen DynamicsCompressor: die drukt elke aanslag plat en blaast de staart op (automatische
  // make-up gain), wat bij snel tikken juist harder klinkt. Een tanh-curve is bij gewone volumes
  // onhoorbaar (tanh(0,1) = 0,0997) en rondt alleen af als er toch veel tegelijk klinkt.
  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 3800;
  warmth.Q.value = 0.5;
  const soft = ctx.createWaveShaper();
  soft.curve = SOFT_CLIP;
  warmth.connect(soft).connect(ctx.destination);

  // Wat er nu klinkt. `key` is de snaar (de toon): een nieuwe toon op dezelfde snaar dempt de
  // vorige, zoals bij een echte gitaar.
  let active = [];
  function choke(v, at) {
    const t = Math.max(at, v.t);
    try {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setTargetAtTime(0, t, 0.02);
      v.src.stop(t + 0.15);
    } catch { /* al gestopt */ }
    v.choked = true;
  }

  function voice(buf, { at = 0, gain = 0.1, key = null } = {}) {
    const t = ctx.currentTime + at;
    active = active.filter((v) => !v.choked && v.t + v.src.buffer.length / sr > ctx.currentTime);
    if (key) for (const v of active) if (v.key === key) choke(v, t);
    active = active.filter((v) => !v.choked);
    while (active.length >= MAX_VOICES) choke(active.shift(), t);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    src.connect(g).connect(warmth);
    src.start(t);
    const v = { src, g, t, key };
    active.push(v);
    return v;
  }

  const note = (d) => SCALE[Math.min(Math.max(1, d || 6), 9) - 1];

  // Aanslag over de snaren, met wat speling in timing en volume zodat het menselijk klinkt.
  function strum(names, { at = 0, gain = 0.08, spacing = 0.024 } = {}) {
    names.forEach((name, k) => {
      const jitter = (Math.random() - 0.5) * 0.008;
      voice(string(name, 'strum'), { at: at + k * spacing + Math.max(0, jitter), gain: gain * (0.85 + Math.random() * 0.3), key: name });
    });
  }

  const SOUNDS = {
    // Cijfer zetten: de eigen toon van dat cijfer.
    place: ({ digit }) => voice(string(note(digit)), { gain: 0.09, key: note(digit) }),
    // Notitie: dezelfde toon, maar gedempt (palm mute).
    note: ({ digit }) => voice(string(note(digit), 'mute'), { gain: 0.07, key: note(digit) }),
    // Gummen of ongedaan maken: een lage, gedempte snaar.
    erase: () => voice(string('G2', 'mute'), { gain: 0.07, key: 'G2' }),
    // Fout: de toon van het cijfer zakt na de aanslag een halve toon, zacht.
    wrong: ({ digit }) => {
      const v = voice(string(note(digit)), { gain: 0.055, key: note(digit) });
      v.src.playbackRate.setValueAtTime(1, v.t + 0.07);
      v.src.playbackRate.linearRampToValueAtTime(2 ** (-1 / 12), v.t + 0.32);
      return v;
    },
    // Hint: een flageolet, helder en puur.
    hint: () => voice(string('G5', 'harmonic'), { gain: 0.028, key: 'flageolet' }),
    // Cijfer compleet: drie tonen omhoog, met steeds één toon van de toonladder ertussen.
    done: ({ digit }) => [0, 2, 4].forEach((step, k) => {
      const name = SCALE[Math.min(Math.max(1, digit || 1), 9) - 1 + step];
      voice(string(name), { at: k * 0.075, gain: 0.065, key: name });
    }),
    // Opgelost: een G-akkoord als downstroke, daarna een zachtere upstroke op de bovenste snaren.
    solved: () => {
      strum(G_CHORD, { gain: 0.055, spacing: 0.025 });
      strum(['G4', 'B3', 'G3'], { at: 0.62, gain: 0.03, spacing: 0.018 });
    },
    // Nieuw geheim berichtje: een eigen melodietje.
    unlock: () => UNLOCK_TUNE.forEach(([name, at], k) => {
      voice(string(name), { at, gain: k === UNLOCK_TUNE.length - 1 ? 0.08 : 0.065, key: name });
    }),
    // Voorproefje bij het kiezen van Gitaar: één zachte, vlotte aanslag.
    preview: () => strum(G_CHORD, { gain: 0.036, spacing: 0.02 }),
  };

  return {
    play(kind, opts = {}) { SOUNDS[kind]?.(opts); },
    // Maakt alvast de snaren die nog ontbreken ([toon, klankkleur]), één per rustig moment.
    warm(list, idle = (fn) => setTimeout(fn, 30)) {
      const todo = list.filter(([name, kind]) => !cache.has(`${kind}:${name}`));
      const next = () => {
        const item = todo.shift();
        if (!item) return;
        string(...item);
        idle(next);
      };
      idle(next);
    },
  };
}
