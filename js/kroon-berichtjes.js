// ✏️ De berichtjes bij De Robijnen Kroon: hier pas je ze aan.
//
// Elke keer dat Ruby een Ruby-modus-puzzel oplost zonder één hint, telt de kroon
// mee. Bij een nieuw niveau vliegt de trofee in beeld met robijnrode confetti,
// en daaronder staat wat je hier schrijft:
//   titel    de grote regel onder de trofee
//   bericht  het persoonlijke berichtje eronder (mag een paar zinnen zijn)
//   knop     de tekst op de knop om het scherm te sluiten
//
// Na het aanpassen: `npm test` (controleert dat alles is ingevuld) en `npm run release`.

export const KROON_BERICHTJES = {
  // 1× hintloos in Ruby-modus
  brons: {
    titel: 'Eerste keer zonder hulp!',
    bericht: '[Placeholder] Hier komt jouw berichtje voor brons.',
    knop: 'Dankjewel 💛',
  },
  // 5×
  zilver: {
    titel: 'Je robijn begint te glanzen ✨',
    bericht: '[Placeholder] Hier komt jouw berichtje voor zilver.',
    knop: 'Dankjewel 💛',
  },
  // 15×
  goud: {
    titel: 'Een fonkelende robijn!',
    bericht: '[Placeholder] Hier komt jouw berichtje voor goud.',
    knop: 'Dankjewel 💛',
  },
  // 33× (haar rugnummer)
  kroon: {
    titel: 'De Robijnen Kroon 👑',
    bericht: '[Placeholder] Hier komt jouw berichtje voor de Robijnen Kroon.',
    knop: 'Wauw 💛',
  },
};
