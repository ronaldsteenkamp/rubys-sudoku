import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluck, harmonic, noteFreq, SCALE, digitNote, VOICES } from '../js/guitar.js';

const SR = 44100;
const rms = (a, from, to) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / (to - from)); };

// Grondtoon via autocorrelatie: de vertraging (in samples) waarbij het signaal het meest op
// zichzelf lijkt, met parabolische interpolatie voor een nauwkeurigheid onder één sample.
function pitch(a, sampleRate, lo = 60, hi = 1500) {
  const from = Math.round(0.05 * sampleRate), size = Math.round(0.08 * sampleRate);
  const corr = (lag) => { let s = 0; for (let i = from; i < from + size; i++) s += a[i] * a[i + lag]; return s; };
  const r0 = corr(0);
  const minLag = Math.floor(sampleRate / hi), maxLag = Math.ceil(sampleRate / lo);
  // De eerste top boven de helft van r0 is één periode (latere toppen zijn veelvouden).
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    const [y0, y1, y2] = [corr(lag - 1), corr(lag), corr(lag + 1)];
    if (y1 > 0.5 * r0 && y1 > y0 && y1 >= y2) return sampleRate / (lag + (y0 - y2) / (2 * (y0 - 2 * y1 + y2)));
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
