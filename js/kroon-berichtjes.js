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
    bericht: 'Een hele Ruby-modus, en geen één hint nodig. Helemaal zelf, Ruubs! Dit is je eerste robijn: nog een beetje dof, maar hij is van jou. Ik ben nu al trots 🔥',
    knop: 'Dankjewel 💛',
  },
  // 5×
  zilver: {
    titel: 'Je robijn begint te glanzen ✨',
    bericht: 'Vijf keer de moeilijkste puzzels verslagen zonder hulp. Dat is geen geluk meer, Schatje, dat is talent. Kijk maar hoe hij glimt, net als jij als je weer een lastige hebt gekraakt 💎',
    knop: 'Dankjewel 💛',
  },
  // 15×
  goud: {
    titel: 'Een fonkelende robijn!',
    bericht: 'Vijftien keer Ruby-modus, zonder één hint. Ik ken niemand die dat kan, behalve jou. Je robijn fonkelt nu net zo hard als jouw ogen als het je lukt. Gouden kroon, gouden meid 💛',
    knop: 'Dankjewel 💛',
  },
  // 33× (haar rugnummer)
  kroon: {
    titel: 'De Robijnen Kroon 👑',
    bericht: 'Drieëndertig. Hetzelfde nummer als op je shirt, en nu ook op je kroon 👑 Drieëndertig keer de allermoeilijkste sudoku, helemaal alleen. Je hebt hem verdiend, Liefje: De Robijnen Kroon is van jou. Voor altijd mijn koningin ❤️',
    knop: 'Wauw 💛',
  },
};
