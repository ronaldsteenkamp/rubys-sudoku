// Game Boy: bij het oplossen een kort 8-bit-deuntje (blokgolf, via feedback.js,
// dus met de geluidsinstelling en het volume van de slaapstand). Alleen geladen
// als Game Boy het thema is.

import { chiptune } from '../feedback.js';

// Zelf bedacht: een vrolijk loopje omhoog en een "level klaar"-slot. [Hz, start (s), duur (s)]
export const JINGLE = [
  [523.25, 0, 0.09], [659.25, 0.09, 0.09], [783.99, 0.18, 0.09], [1046.5, 0.27, 0.18],
  [783.99, 0.5, 0.09], [1046.5, 0.59, 0.09], [1318.51, 0.68, 0.42],
];

// Geeft { sound: true } als het deuntje het opgelost-geluid vervangt.
export function solved() {
  return { sound: chiptune(JINGLE) };
}
