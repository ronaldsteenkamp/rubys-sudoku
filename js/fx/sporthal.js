// Sporthal (geheim): bij het oplossen een kort fluitsignaal van de scheidsrechter en
// heel even applaus van de tribune (gefilterde ruis, zie lib/klank.js). Met de gewone
// geluidsinstelling: stil als het geluid uit staat. De ledcijfers en het scorebordje
// zijn gewoon CSS. Alleen geladen als Sporthal het thema is.

import { applause, play, tone } from './lib/klank.js';

// Het fluitje: twee keer kort, met het rollende balletje erin. [start (s), duur (s)]
export const WHISTLE = [[0, 0.16], [0.24, 0.42]];

// Geeft { sound: true } als het fluitje en het applaus het opgelost-geluid vervangen.
export function solved() {
  const ok = WHISTLE.every(([at, dur]) => tone(2900, { at, dur, gain: 0.022, wobble: [32, 140] }));
  if (ok) play('applaus', (sr) => applause({ sampleRate: sr }), { at: 0.55, gain: 0.07, filter: { type: 'bandpass', freq: 1700, q: 0.6 } });
  return { sound: ok };
}
