// Alles wat persoonlijk is: bijnamen, begroetingen, lieve berichtjes,
// mijlpalen en speciale dagen. Pas gerust aan!

export const NICKNAMES = ['Ruubs', 'RubyxCube', 'Liefje', 'Schatje', 'R', 'Koffiemonster', 'Gehaktballetje'];

// Samen sinds 29 september 2026; jarig op 12 oktober (2005).
export const ANNIVERSARY = { year: 2026, month: 9, day: 29 };
export const BIRTHDAY = { year: 2005, month: 10, day: 12 };

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
export const nickname = (rng) => pick(NICKNAMES, rng);
// Soms met bijnaam, soms zonder: dan blijft het speciaal.
export const maybeNick = (rng = Math.random, chance = 0.5) => (rng() < chance ? `, ${nickname(rng)}` : '');

// ---------- Lieve berichtjes na het oplossen ----------

export const LOVE_NOTES = [
  'Opgelost! Je bent slimmer dan je zelf denkt, Ruubs 💛',
  'Weer eentje gefikst. Daar hoort eigenlijk een stuk preitaart bij 🥧',
  'Als ik een hond was, zou ik nu héél hard kwispelen voor jou 🐶',
  'Jij maakt van elke dag een zondagochtend ☀️',
  'Elk cijfer op z’n plek, net als jij bij mij 🧩',
  'Mooier dan een lelie en slimmer dan elke sudoku 🌸',
  'Koffiemonster heeft weer toegeslagen ☕✨',
  'Ik ben trots op je. Op deze puzzel, en gewoon op jou.',
  'Gran Canaria-zonnetje in je hoofd: alles valt op z’n plek 🌴',
  'Als beloning krijg je een knuffel. Kom maar halen 🤗',
  'Negen bij negen, en toch ben jij nummer één 💛',
  'Gehaktballetje, je bent een genie 🧠',
  'Als jij lacht, lost mijn hele dag zichzelf op 😊',
  'Weer een puzzel de baas. Wat kun jij eigenlijk níét?',
  'Je hebt een aai over je bol verdiend. Hondenstijl 🐾',
  'Dikke kus van de maker van deze app 😘',
  'Alles klopte. Net als wij samen.',
  'Ik hou van je, RubyxCube. Ook als je even vastzit 💛',
  'Volgende stop: zon, zee en Gran Canaria 🏝️',
  'Je brein is goud waard. Je hart nog meer.',
];

// Kiest een berichtje dat ze niet net al gezien heeft.
export function loveNote(recent = [], rng = Math.random) {
  const fresh = LOVE_NOTES.filter((m) => !recent.includes(m));
  return pick(fresh.length ? fresh : LOVE_NOTES, rng);
}

// ---------- Begroeting per dagdeel ----------

export function greeting(date = new Date(), rng = Math.random) {
  const h = date.getHours();
  const nick = nickname(rng);
  if (h < 6) return pick([`Nog wakker, ${nick}? 🌙`, `Hé nachtuiltje ${nick} 🦉`], rng);
  if (h < 12) return pick([`Goedemorgen ${nick} ☀️`, `Goeiemorgen ${nick}, koffie al op? ☕`], rng);
  if (h < 18) return pick([`Goedemiddag ${nick} 🌼`, `Hoi ${nick}, tijd voor een pauze? 🌼`], rng);
  return pick([`Goedenavond ${nick} 🌙`, `Hé ${nick}, lekker op de bank? 🛋️`], rng);
}

export const SUBTITLES = [
  'Zin in een puzzeltje?',
  'Even lekker niks anders doen.',
  'Gemaakt met heel veel liefde, speciaal voor jou.',
  'Rustig aan, er is geen haast.',
  'Eén vakje tegelijk.',
];

// ---------- Speciale dagen ----------

const sameDay = (date, { month, day }) => date.getMonth() + 1 === month && date.getDate() === day;

export function daysTogether(date = new Date()) {
  const start = new Date(ANNIVERSARY.year, ANNIVERSARY.month - 1, ANNIVERSARY.day);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86400000);
}

// Geeft een object terug als vandaag een speciale dag is, anders null.
export function specialDay(date = new Date()) {
  if (sameDay(date, ANNIVERSARY)) {
    const years = date.getFullYear() - ANNIVERSARY.year;
    return {
      id: `jubileum-${date.getFullYear()}`,
      kind: 'jubileum',
      title: years > 0 ? `${years} jaar samen 💛` : 'Vandaag begon het 💛',
      text: years > 0
        ? `Vandaag zijn we precies ${years === 1 ? 'één jaar' : `${years} jaar`} samen. Elk jaar met jou is mijn favoriete puzzel. Deze is speciaal voor jou gemaakt, kijk maar goed naar de vorm 😉`
        : 'Vandaag begon ons verhaal. Deze puzzel is speciaal voor jou gemaakt, kijk maar goed naar de vorm 😉',
      solvedText: years > 0
        ? `Gelukkig ${years === 1 ? 'eenjarig' : `${years}-jarig`} jubileum, lieverd. Op nog heel veel jaren, puzzels en preitaartjes samen. Ik hou van je. 💛`
        : 'Ik ben zo blij dat jij er bent. Ik hou van je. 💛',
      seed: 290900 + date.getFullYear(),
    };
  }
  if (sameDay(date, BIRTHDAY)) {
    const age = date.getFullYear() - BIRTHDAY.year;
    return {
      id: `verjaardag-${date.getFullYear()}`,
      kind: 'verjaardag',
      title: `Gefeliciteerd, ${age} jaar! 🎂`,
      text: `Hiep hiep hoera, ${nickname()}! Vandaag ben je ${age}. Ik heb een puzzel voor je met een verrassing erin. Kijk maar naar de vorm 😉`,
      solvedText: `Van harte gefeliciteerd met je ${age}e verjaardag, mooiste meisje dat er is. Ik hoop dat je dag net zo zonnig is als jij 🎉💛`,
      seed: 121000 + date.getFullYear(),
    };
  }
  return null;
}

// ---------- Mijlpalen met geheime berichtjes ----------

export const MILESTONES = [
  { id: 'eerste', title: 'De allereerste', icon: '🌱',
    hint: 'Los je eerste puzzel op',
    text: 'Je allereerste puzzel in jouw eigen app! Ik heb hem gemaakt met heel veel liefde (en een beetje te veel koffie). Fijn dat je er bent. 💛',
    check: (s) => s.totalSolved >= 1 },
  { id: 'dag1', title: 'Goedemorgen, dagpuzzel', icon: '📅',
    hint: 'Los een dagpuzzel op',
    text: 'Je eerste dagpuzzel! Elke dag staat hier een nieuwe voor je klaar, net zoals ik er elke dag voor jou ben.',
    check: (s) => s.dailySolved >= 1 },
  { id: 'zonderhint', title: 'Helemaal zelf', icon: '🧠',
    hint: 'Los een puzzel op zonder hints',
    text: 'Zonder één hint! Ik zei het toch: jij bent slimmer dan je denkt. Gehaktballetje met hersens van goud. 🏅',
    check: (s) => s.noHintSolved >= 1 },
  { id: 'tien', title: 'Tien!', icon: '🔟',
    hint: 'Los 10 puzzels op',
    text: 'Tien puzzels opgelost! Als beloning: één keer per week mag jij kiezen wat we eten. Preitaart, ik weet het al 🥧',
    check: (s) => s.totalSolved >= 10 },
  { id: 'streak3', title: 'Drie op een rij', icon: '✨',
    hint: 'Puzzel 3 dagen achter elkaar',
    text: 'Drie dagen op rij! Je bent een gewoontedier, net als een hond die precies weet hoe laat het wandeltijd is 🐶',
    check: (s) => s.bestStreak >= 3 },
  { id: 'streak7', title: 'Een hele week', icon: '🌈',
    hint: 'Puzzel 7 dagen achter elkaar',
    text: 'Een hele week elke dag gepuzzeld! Weet je wat ik elke dag doe? Blij zijn dat ik jou heb. 💛',
    check: (s) => s.bestStreak >= 7 },
  { id: 'ruby', title: 'Ruby-modus verslagen', icon: '🔥',
    hint: 'Los een puzzel op in Ruby-modus',
    text: 'RUBY-MODUS VERSLAGEN 🔥 Officieel: jij bent de baas. Deze modus heet niet voor niks naar jou.',
    check: (s) => (s.levels.ruby?.solved || 0) >= 1 },
  { id: 'vijfentwintig', title: 'Kwart eeuw', icon: '🌻',
    hint: 'Los 25 puzzels op',
    text: '25 puzzels! Dat zijn meer dan 1000 ingevulde vakjes. En ik heb nog steeds niet genoeg van jou.',
    check: (s) => s.totalSolved >= 25 },
  { id: 'streak30', title: 'Een maand lang', icon: '🏆',
    hint: 'Puzzel 30 dagen achter elkaar',
    text: 'Dertig dagen op rij. Dertig! Volgens mij ben jij het meest volhardende mens dat ik ken. Ik ben trots op je.',
    check: (s) => s.bestStreak >= 30 },
  { id: 'vijftig', title: 'Vijftig', icon: '🌺',
    hint: 'Los 50 puzzels op',
    text: '50 puzzels. Tijd voor een echte beloning: een dagje uit, jij kiest. (Dit berichtje telt als officiële bon 🎟️)',
    check: (s) => s.totalSolved >= 50 },
  { id: 'honderd', title: 'Honderd!', icon: '💯',
    hint: 'Los 100 puzzels op',
    text: 'HONDERD PUZZELS. Je bent een legende. En mijn favoriete mens. Laat dit scherm zien voor één enorme knuffel. 🤗',
    check: (s) => s.totalSolved >= 100 },
];

export function newMilestones(stats, unlocked) {
  return MILESTONES.filter((m) => !unlocked.includes(m.id) && m.check(stats));
}

// ---------- Kleine tekstjes ----------

export const LOADING_LINES = [
  'Even een puzzel bakken… 🥧',
  'Cijfers aan het schudden… 🎲',
  'Koffie zetten voor de puzzel… ☕',
];

export const PAUSE_LINES = [
  'Even pauze. Neem rustig je tijd 🌼',
  'Pauze! Tijd om een hond te aaien 🐶',
  'Koffiepauze ☕',
];
