import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluck, harmonic, noteFreq, SCALE, digitNote, VOICES, createGuitar, G_CHORD, UNLOCK_TUNE, ALL_STRINGS } from '../js/guitar.js';

const SR = 44100;
const rms = (a, from, to) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / (to - from)); };

// Grondtoon via autocorrelatie: de vertraging (in samples) waarbij het signaal het meest op
// zichzelf lijkt, met parabolische interpolatie voor een nauwkeurigheid onder één sample.
function pitch(a, sampleRate, lo = 60, hi = 1500) {
  const from = Math.round(0.05 * sampleRate), size = Math.round(0.08 * sampleRate);
  const corr = (lag) => { let s = 0; for (let i = from; i < from + size; i++) s += a[i] * a[i + lag]; return s; };
  const minLag = Math.floor(sampleRate / hi), maxLag = Math.ceil(sampleRate / lo);
  const r = [];
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) r[lag] = corr(lag);
  const top = Math.max(...r.slice(minLag, maxLag + 1));
  // De kleinste vertraging met (bijna) de hoogste gelijkenis is één periode; een boventoon
  // geeft eerdere, lagere toppen, en veelvouden van de periode komen pas later.
  for (let lag = minLag; lag <= maxLag; lag++) {
    const [y0, y1, y2] = [r[lag - 1], r[lag], r[lag + 1]];
    if (y1 >= 0.9 * top && y1 >= y0 && y1 >= y2) return sampleRate / (lag + (y0 - y2) / (2 * (y0 - 2 * y1 + y2)));
  }
  return NaN;
}

test('noteFreq: A4 is 440 Hz, G3 en D5 kloppen', () => {
  assert.equal(noteFreq('A4'), 440);
  assert.ok(Math.abs(noteFreq('G3') - 196.0) < 0.01);
  assert.ok(Math.abs(noteFreq('D5') - 587.33) < 0.01);
  assert.ok(Math.abs(noteFreq('G2') - 98.0) < 0.01);
  assert.deepEqual([1, 5, 9].map(digitNote), ['G3', 'E4', 'D5']);
  assert.equal(SCALE.length >= 9 + 4, true, 'genoeg tonen boven D5 voor het arpeggio');
});

test('pluck: juiste lengte, geen NaN, piek 1', () => {
  for (const [d, sr] of [[1, 44100], [9, 48000]]) {
    const a = pluck(noteFreq(digitNote(d)), { sampleRate: sr, duration: 1.2 });
    assert.equal(a.length, Math.round(1.2 * sr));
    assert.ok(a.every(Number.isFinite), 'geen NaN of oneindig');
    const peak = a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    assert.ok(Math.abs(peak - 1) < 1e-6, `piek ${peak}`);
  }
});

test('pluck: het geluid sterft uit en eindigt op stilte', () => {
  for (const [name, v] of Object.entries(VOICES)) {
    const a = pluck(noteFreq('G3'), { sampleRate: SR, ...v });
    const n = a.length, part = Math.floor(n / 10);
    const start = rms(a, 0, part), end = rms(a, n - part, n);
    assert.ok(end < start * 0.25, `${name}: begin ${start.toFixed(3)}, eind ${end.toFixed(3)}`);
    assert.equal(Math.abs(a[n - 1]), 0, `${name}: laatste sample stil`);
  }
  // Palm mute is na 0,2 s al bijna weg; een open snaar klinkt dan nog duidelijk. Dat geldt
  // voor lage én hoge tonen, want de nagalm is in seconden.
  const at = (a) => rms(a, Math.round(0.2 * SR), Math.round(0.25 * SR)) / rms(a, 0, Math.round(0.05 * SR));
  for (const name of ['G3', 'D5']) {
    const mute = at(pluck(noteFreq(name), { sampleRate: SR, ...VOICES.mute, duration: 1 }));
    const open = at(pluck(noteFreq(name), { sampleRate: SR, ...VOICES.open, duration: 1 }));
    assert.ok(mute < 0.05 && open > 0.3, `${name}: mute ${mute.toFixed(3)}, open ${open.toFixed(3)}`);
  }
});

test('pluck: de grondtoon klopt voor alle negen cijfers en de akkoordsnaren (binnen 0,5%)', () => {
  for (const name of [...SCALE.slice(0, 9), 'G2', 'B2', 'D3']) {
    const f = noteFreq(name);
    for (const sr of [44100, 48000]) {
      const got = pitch(pluck(f, { sampleRate: sr, duration: 0.3 }), sr);
      assert.ok(Math.abs(got / f - 1) < 0.005, `${name} bij ${sr} Hz: ${got.toFixed(2)} i.p.v. ${f.toFixed(2)}`);
    }
  }
});

test('pluck: minder helderheid geeft een doffere klank', () => {
  // Doffer = minder verschil tussen opeenvolgende samples (minder hoge tonen).
  const roughness = (a) => { let s = 0; for (let i = 1; i < 4000; i++) s += Math.abs(a[i] - a[i - 1]); return s; };
  const bright = pluck(noteFreq('G4'), { sampleRate: SR, brightness: 0.9, duration: 0.2 });
  const dull = pluck(noteFreq('G4'), { sampleRate: SR, brightness: 0.1, duration: 0.2 });
  assert.ok(roughness(dull) < roughness(bright) * 0.7);
});

test('harmonic: pure toon op de goede hoogte, sterft uit', () => {
  const f = noteFreq('G5');
  const a = harmonic(f, { sampleRate: SR, duration: 2 });
  assert.equal(a.length, 2 * SR);
  assert.ok(a.every(Number.isFinite));
  assert.ok(Math.abs(pitch(a, SR, 200, 2000) / f - 1) < 0.005);
  assert.ok(rms(a, a.length - 4410, a.length) < rms(a, 0, 4410) * 0.1);
});

test('pluck is snel genoeg om bij de eerste tik te maken', () => {
  const t = performance.now();
  for (const name of SCALE.slice(0, 9)) pluck(noteFreq(name), { sampleRate: 48000, ...VOICES.open });
  const ms = performance.now() - t;
  assert.ok(ms < 400, `negen snaren in ${ms.toFixed(0)} ms`);
});

// ---------- Afspelen, met een nep-AudioContext ----------

// Net genoeg van Web Audio om te zien welke buffers wanneer en hoe hard starten.
function fakeContext() {
  const param = (v = 0) => ({ value: v, events: [], setValueAtTime(x, t) { this.events.push(['set', x, t]); }, linearRampToValueAtTime(x, t) { this.events.push(['lin', x, t]); }, exponentialRampToValueAtTime(x, t) { this.events.push(['exp', x, t]); }, cancelScheduledValues() {} });
  const node = (extra = {}) => ({ connect(n) { return n; }, disconnect() {}, ...extra });
  const ctx = {
    sampleRate: 22050, currentTime: 10, destination: node(), started: [], made: 0,
    createBuffer(ch, length, sampleRate) { ctx.made++; const data = new Float32Array(length); return { length, sampleRate, data, copyToChannel(d) { data.set(d); }, getChannelData: () => data }; },
    createBufferSource() {
      const src = node({ playbackRate: param(1), start(t) { ctx.started.push({ src, t, gain: src.out?.gain }); }, stop() {} });
      src.connect = (g) => { src.out = g; return g; };
      return src;
    },
    createGain() { return node({ gain: param(1) }); },
    createBiquadFilter() { return node({ type: '', frequency: param(), Q: param() }); },
    createDynamicsCompressor() { return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); },
  };
  return ctx;
}
const startGain = (v) => v.gain.events.find((e) => e[0] === 'set')[1];
// Hoogte van een gestarte buffer, gemeten met dezelfde autocorrelatie als hierboven.
const freqOf = (v) => pitch(v.src.buffer.data, v.src.buffer.sampleRate, 60, 1500);
const near = (f, name) => Math.abs(f / noteFreq(name) - 1) < 0.01;

test('gitaar: elk cijfer zijn eigen toon, notitie gedempt en zachter', () => {
  const ctx = fakeContext();
  const g = createGuitar(ctx);
  for (let d = 1; d <= 9; d++) g.play('place', { digit: d });
  assert.equal(ctx.started.length, 9);
  ctx.started.forEach((v, k) => assert.ok(near(freqOf(v), SCALE[k]), `cijfer ${k + 1}`));
  g.play('note', { digit: 4 });
  const n = ctx.started.at(-1);
  assert.ok(n.src.buffer.length < ctx.started[3].src.buffer.length / 3, 'notitie is korter');
  assert.ok(startGain(n) < startGain(ctx.started[3]), 'notitie is zachter');
});

test('gitaar: buffers worden één keer gemaakt en hergebruikt', () => {
  const ctx = fakeContext();
  const g = createGuitar(ctx);
  g.play('place', { digit: 3 });
  g.play('place', { digit: 3 });
  g.play('place', { digit: 3 });
  assert.equal(ctx.made, 1);
  assert.equal(ctx.started[0].src.buffer, ctx.started[2].src.buffer);
});

test('gitaar: fout cijfer buigt een halve toon omlaag', () => {
  const ctx = fakeContext();
  createGuitar(ctx).play('wrong', { digit: 5 });
  const v = ctx.started[0];
  assert.ok(near(freqOf(v), 'E4'));
  const last = v.src.playbackRate.events.at(-1);
  assert.ok(Math.abs(last[1] - 2 ** (-1 / 12)) < 1e-9 && last[2] > v.t);
});

test('gitaar: opgelost is een G-akkoord als downstroke, 20–30 ms per snaar, plus een upstroke', () => {
  const ctx = fakeContext();
  createGuitar(ctx).play('solved');
  const down = ctx.started.slice(0, 6);
  down.forEach((v, k) => assert.ok(near(freqOf(v), G_CHORD[k]), G_CHORD[k]));
  for (let k = 1; k < 6; k++) {
    const gap = (down[k].t - down[k - 1].t) * 1000;
    assert.ok(gap >= 17 && gap <= 33, `snaar ${k}: ${gap.toFixed(1)} ms`);
  }
  const up = ctx.started.slice(6);
  assert.equal(up.length, 3);
  assert.ok(up[0].t > down[5].t + 0.3, 'upstroke komt erna');
  assert.ok(Math.max(...up.map(startGain)) < Math.min(...down.map(startGain)), 'upstroke is zachter');
});

test('gitaar: cijfer compleet is een arpeggio van drie tonen omhoog', () => {
  for (const d of [1, 9]) {
    const ctx = fakeContext();
    createGuitar(ctx).play('done', { digit: d });
    const f = ctx.started.map(freqOf);
    assert.equal(f.length, 3);
    assert.ok(f[0] < f[1] && f[1] < f[2], `cijfer ${d}: ${f.map(Math.round)}`);
    assert.ok(near(f[0], digitNote(d)));
  }
});

test('gitaar: het melodietje bij een geheim berichtje', () => {
  assert.ok(UNLOCK_TUNE.length >= 6 && UNLOCK_TUNE.length <= 10);
  assert.ok(UNLOCK_TUNE.every(([n]) => SCALE.includes(n)), 'alleen tonen uit G-pentatonisch');
  assert.ok(UNLOCK_TUNE.every(([, t], k) => k === 0 || t > UNLOCK_TUNE[k - 1][1]), 'op volgorde');
  assert.equal(UNLOCK_TUNE.at(-1)[0][0], 'G', 'eindigt thuis op G');
  const ctx = fakeContext();
  createGuitar(ctx).play('unlock');
  assert.equal(ctx.started.length, UNLOCK_TUNE.length);
});

test('gitaar: hint en gum, en warm() maakt alles alvast aan', () => {
  const ctx = fakeContext();
  const g = createGuitar(ctx);
  g.play('hint');
  assert.ok(near(freqOf(ctx.started[0]), 'G5'));
  g.play('erase');
  assert.ok(near(freqOf(ctx.started[1]), 'G2'));
  g.warm(ALL_STRINGS, (fn) => fn());
  assert.equal(ctx.made, ALL_STRINGS.length);
  g.play('solved'); g.play('done', { digit: 9 }); g.play('unlock');
  assert.equal(ctx.made, ALL_STRINGS.length, 'na warm() hoeft er niks meer gemaakt te worden');
});
