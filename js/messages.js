// Alles wat persoonlijk is: bijnamen, begroetingen, lieve berichtjes,
// mijlpalen en speciale dagen. Pas gerust aan!

export const NICKNAMES = [
  'Ruby', 'Ruubs', 'RubyxCube', 'Liefje', 'Schatje', 'R', 'Koffiemonster', 'Gehaktballetje',
  'Van der Vegt', 'Vegtie', 'Au Pair', 'Jonkie',
];

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
  'Jij bent mijn allerliefste puzzel, RubyxCube 💛',
  'Weer een puzzel opgelost. Jij laat mijn hart altijd een beetje sneller kloppen 💓',
  'Je brein is goud waard. Je hart nog meer.',
];

// Kiest een berichtje dat ze niet net al gezien heeft.
export function loveNote(recent = [], rng = Math.random) {
  const fresh = LOVE_NOTES.filter((m) => !recent.includes(m));
  return pick(fresh.length ? fresh : LOVE_NOTES, rng);
}

// ---------- Begroeting per dagdeel ----------

// In de grote begroeting alleen bijnamen van minstens 3 tekens ("Goedemorgen R" leest raar).
const GREETING_NICKNAMES = NICKNAMES.filter((n) => n.length >= 3);

// Dagdelen: nacht tot 6 uur, ochtend tot 12, middag tot 18, daarna avond.
export const partOfDay = (date = new Date()) => {
  const h = date.getHours();
  return h < 6 ? 'nacht' : h < 12 ? 'ochtend' : h < 18 ? 'middag' : 'avond';
};

// Elke begroeting krijgt een bijnaam mee (n).
export const GREETINGS = {
  nacht: [
    (n) => `Nog wakker, ${n}? 🌙`,
    (n) => `Hé nachtuiltje ${n} 🦉`,
    (n) => `Psst, ${n}… de maan kijkt mee 🌙`,
    (n) => `Kun je niet slapen, ${n}? 💤`,
    (n) => `Nachtpuzzeltje, ${n}? 🌌`,
    (n) => `Stiekem nog wakker, ${n}? 🤫`,
    (n) => `Hé ${n}, één puzzel en dan bed 😴`,
    (n) => `Nachtsnack of sudoku, ${n}? 🍪`,
    (n) => `Het is stil buiten, ${n} 🌙`,
    (n) => `Ssst ${n}, de honden slapen al 🐶`,
    (n) => `Hé ${n}, sterrenkijken? ✨`,
    (n) => `Hé ${n}, ook een nachtmens? 🦉`,
  ],
  ochtend: [
    (n) => `Goedemorgen ${n} ☀️`,
    (n) => `Goeiemorgen ${n}, koffie al op? ☕`,
    (n) => `Goeiemorgen, ${n}! 🌞`,
    (n) => `Morgen ${n}, goed geslapen? 😴`,
    (n) => `Hé ${n}, eerst koffie ☕`,
    (n) => `Wakker worden, ${n} 🌅`,
    (n) => `Daar is ze weer: ${n} 🌞`,
    (n) => `Ochtendpuzzel, ${n}? 🧩`,
    (n) => `Hoi ${n}, ontbijt al op? 🥐`,
    (n) => `Morgen ${n}! Klaar voor de dag? 💪`,
    (n) => `Morgen ${n}, wat een mooie dag 🌼`,
    (n) => `Rise and shine, ${n} 🌅`,
    (n) => `Hé ${n}, de zon is er voor jou ☀️`,
    (n) => `Al een beetje wakker, ${n}? 🥱`,
  ],
  middag: [
    (n) => `Goedemiddag ${n} 🌼`,
    (n) => `Hoi ${n}, tijd voor een pauze? 🌼`,
    (n) => `Hé ${n}, even pauze? ☕`,
    (n) => `Middagdipje, ${n}? 🧩`,
    (n) => `Hoi ${n}! Lekker bezig 🌻`,
    (n) => `Theetje erbij, ${n}? 🍵`,
    (n) => `Gezellig dat je er bent, ${n} 💛`,
    (n) => `Puzzelpauze, ${n}? ⏸️`,
    (n) => `Hé ${n}, snackje erbij? 🍪`,
    (n) => `Daar ben je, ${n}! 🌼`,
    (n) => `Hoi ${n}, al buiten geweest? ☀️`,
    (n) => `Hé ${n}, even je hoofd leegmaken 🌿`,
    (n) => `Je doet het goed, ${n} 🌟`,
    (n) => `Hoi ${n}, de honden zwaaien 🐾`,
  ],
  avond: [
    (n) => `Goedenavond ${n} 🌙`,
    (n) => `Hé ${n}, lekker op de bank? 🛋️`,
    (n) => `Goeienavond ${n} ✨`,
    (n) => `Hé ${n}, dekentje erbij? 🧸`,
    (n) => `Avondpuzzeltje, ${n}? 🌙`,
    (n) => `Hoi ${n}, de dag zit erop 🌆`,
    (n) => `Hé ${n}, preitaart gegeten? 🥧`,
    (n) => `Thee en een puzzel, ${n}? 🍵`,
    (n) => `Hé ${n}, pyjama al aan? 🌙`,
    (n) => `Rustig aan, ${n} 🕯️`,
    (n) => `Hoi ${n}, nog even puzzelen? 🧩`,
    (n) => `Na de training, ${n}? 🏐`,
    (n) => `Trots op je vandaag, ${n} 💛`,
    (n) => `Sokken aan, ${n}? 🧦`,
  ],
};

// Soms een begroeting die bij de dag van de week hoort (0 = zondag). Niet 's nachts.
export const WEEKDAY_GREETINGS = {
  0: [(n) => `Zondag, ${n}! Puzzeldag 🧩`, (n) => `Lui zondagje, ${n}? 🛋️`, (n) => `Fijne zondag, ${n} ☀️`],
  1: [(n) => `Hup ${n}, het is maandag 💪`, (n) => `Maandag valt mee, ${n} ☕`],
  2: [(n) => `Dinsdagje, ${n} 🌼`, (n) => `Hoi ${n}, fijne dinsdag 🌷`],
  3: [(n) => `Woensdag: halverwege, ${n}! 🐪`],
  4: [(n) => `Bijna weekend, ${n} 🎈`, (n) => `Bijna vrijdag, ${n} 🌙`],
  5: [(n) => `Vrijdag, ${n}! 🎉`, (n) => `Het is vrijdag, ${n} 💃`],
  6: [(n) => `Geen wekker, ${n} 😴`, (n) => `Fijne zaterdag, ${n} 🌻`],
};

export function greeting(date = new Date(), rng = Math.random) {
  const part = partOfDay(date);
  const nick = pick(GREETING_NICKNAMES, rng);
  const day = WEEKDAY_GREETINGS[date.getDay()];
  const list = part !== 'nacht' && day && rng() < 0.25 ? day : GREETINGS[part];
  return pick(list, rng)(nick);
}

export const SUBTITLES = [
  'Zin in een puzzeltje?',
  'Even lekker niks anders doen.',
  'Gemaakt met heel veel liefde, speciaal voor jou.',
  'Rustig aan, er is geen haast.',
  'Eén vakje tegelijk.',
  'Jij en negen cijfers. Wat een team.',
  'Geen haast, geen stress, gewoon jij.',
  'Neem een slokje koffie en kies een puzzel.',
  'Vandaag is een goede dag voor een sudoku.',
  'Elk vakje is een klein feestje.',
  'Je brein verdient een knuffel.',
  'Even ontsnappen naar je eigen hoekje.',
  'Hier is het altijd rustig.',
  'Fouten maken mag. Gummen ook.',
  'Notities zijn je beste vriendjes.',
  'Begin bij de makkelijke vakjes.',
  'Vastgelopen? Even wegkijken helpt echt.',
  'Een hint vragen is ook slim.',
  'Klein beetje puzzelen, groot beetje trots.',
  'Op de bank, in de trein of in bed: altijd goed.',
  'De honden hebben deze puzzel aanbevolen.',
  'Jouw hoofd, jouw tempo.',
  'Ademhalen, en dan het eerste cijfer.',
  'Iemand is heel trots op je.',
  'Er wacht een puzzel op je. Hij heeft er zin in.',
  'Vandaag ga je knallen.',
  'Wie heeft er een hoofd van goud? Jij.',
  'Stilte, koffie, cijfers. Heerlijk.',
  'Elke puzzel is op te lossen. Echt waar.',
  'Laat de wereld maar even wachten.',
  'Vakje voor vakje kom je er wel.',
  'Je hoeft niks. Je mag puzzelen.',
  'Telefoon op stil, puzzel aan.',
  'Eén, twee, drie… negen. Kinderspel voor jou.',
  'Lekker bezig, ik zie het heus.',
  'Puzzelen is ook een beetje mediteren.',
  'Eerst de rijtjes, dan de wereld.',
  'Even weg? Ik onthoud waar je was.',
  'Vandaag een record? Of gewoon gezellig?',
  'Het Gran Canaria-zonnetje schijnt ook hier.',
  'Ook kampioenen beginnen met één vakje.',
  'Smash die sudoku, net als op het veld.',
  'Klaar voor een rondje hersengym?',
  'De koffie is warm, de puzzel is vers.',
  'De leukste puzzelaar die ik ken.',
  'Even jij-tijd.',
  'Geen reclame, geen gedoe. Alleen jij.',
  'Je bent geweldig, ook zonder sudoku.',
  'Een kleine uitdaging, een grote glimlach.',
  'Zachtjes nadenken mag ook.',
  'Vandaag een Zondagochtend, of toch Ruby-modus?',
  'Jouw eigen app. Hoe cool is dat.',
  'Gewoon even zitten en kijken waar de 5 moet.',
  'Iedere 9 heeft een plekje. Jij ook, bij mij.',
  'Een puzzel en een glimlach, meer is het niet.',
  'Hier kan niks misgaan, alleen opnieuw beginnen.',
  'Je wordt elke puzzel een beetje beter.',
  'Beloning na afloop: een knuffel.',
  'Kies maar, ik heb er allemaal zin in.',
];

// Ondertitels die bij een dagdeel horen.
export const PART_SUBTITLES = {
  nacht: [
    'Eentje dan, en daarna lekker slapen.',
    'Puzzelen in het donker is extra gezellig.',
    'De rest van de wereld slaapt. Jij bent de baas.',
    'Niet te lang hoor, slapen is ook belangrijk.',
    'Zacht licht, zachte cijfers.',
  ],
  ochtend: [
    'Een puzzel bij het ontbijt.',
    'Wakker worden met een paar cijfers.',
    'Eerst koffie, dan cijfers.',
    'Een frisse start van de dag.',
    'Het ontbijt van kampioenen: koffie en een sudoku.',
  ],
  middag: [
    'Even pauze, die heb je verdiend.',
    'Een middagpuzzel tegen het dipje.',
    'Halverwege de dag, tijd voor jou.',
    'Een kwartiertje voor jezelf.',
  ],
  avond: [
    'De dag zit erop, tijd voor iets fijns.',
    'Lekker onderuit met een puzzeltje.',
    'Een rustige afsluiter van de dag.',
    'Kaarsje aan, puzzel erbij.',
    'Morgen weer een dag. Nu even dit.',
  ],
};

// Een ondertitel: meestal algemeen, soms passend bij het dagdeel.
export function subtitle(date = new Date(), rng = Math.random) {
  return pick(rng() < 0.35 ? PART_SUBTITLES[partOfDay(date)] : SUBTITLES, rng);
}

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

// Zoekt een speciale dag terug aan de hand van z'n id (bijv. 'verjaardag-2027'),
// zodat een hartjespuzzel die na middernacht af is toch het goede berichtje krijgt.
export function specialById(id) {
  const m = /^(jubileum|verjaardag)-(\d{4})$/.exec(id || '');
  if (!m) return null;
  const { month, day } = m[1] === 'jubileum' ? ANNIVERSARY : BIRTHDAY;
  return specialDay(new Date(Number(m[2]), month - 1, day, 12));
}

// ---------- Mijlpalen met geheime berichtjes ----------
// `progress` (optioneel) zegt hoe ver ze al is; `unit` is waar ze er nog van nodig heeft.
// Bij reeksen is `s.streak` de reeks van nu, niet de langste ooit.

export const MILESTONES = [
  { id: 'eerste', title: 'De allereerste', icon: '🌱',
    hint: 'Los je eerste puzzel op',
    text: 'Je allereerste puzzel in jouw eigen app! Ik heb hem gemaakt met heel veel liefde (en een beetje te veel koffie). Fijn dat je er bent. 💛',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 1 }),
    check: (s) => s.totalSolved >= 1 },
  { id: 'dag1', title: 'Goedemorgen, dagpuzzel', icon: '📅',
    hint: 'Los een dagpuzzel op',
    text: 'Je eerste dagpuzzel! Elke dag staat hier een nieuwe voor je klaar, net zoals ik er elke dag voor jou ben.',
    unit: ['dagpuzzel', 'dagpuzzels'], progress: (s) => ({ current: s.dailySolved, target: 1 }),
    check: (s) => s.dailySolved >= 1 },
  { id: 'zonderhint', title: 'Helemaal zelf', icon: '🧠',
    hint: 'Los een puzzel op zonder hints',
    text: 'Zonder één hint! Ik zei het toch: jij bent slimmer dan je denkt. Gehaktballetje met hersens van goud. 🏅',
    check: (s) => s.noHintSolved >= 1 },
  { id: 'tien', title: 'Tien!', icon: '🔟',
    hint: 'Los 10 puzzels op',
    text: 'Tien puzzels opgelost! Als beloning: één keer per week mag jij kiezen wat we eten. Preitaart, ik weet het al 🥧',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 10 }),
    check: (s) => s.totalSolved >= 10 },
  { id: 'streak3', title: 'Drie op een rij', icon: '✨',
    hint: 'Puzzel 3 dagen achter elkaar',
    text: 'Drie dagen op rij! Je bent een gewoontedier, net als een hond die precies weet hoe laat het wandeltijd is 🐶',
    unit: ['dag op rij', 'dagen op rij'], badge: ['dag', 'dagen'], progress: (s) => ({ current: s.streak, target: 3 }),
    check: (s) => s.bestStreak >= 3 },
  { id: 'streak7', title: 'Een hele week', icon: '🌈',
    hint: 'Puzzel 7 dagen achter elkaar',
    text: 'Een hele week elke dag gepuzzeld! Weet je wat ik elke dag doe? Blij zijn dat ik jou heb. 💛',
    unit: ['dag op rij', 'dagen op rij'], badge: ['dag', 'dagen'], progress: (s) => ({ current: s.streak, target: 7 }),
    check: (s) => s.bestStreak >= 7 },
  { id: 'ruby', title: 'Ruby-modus verslagen', icon: '🔥',
    hint: 'Los een puzzel op in Ruby-modus',
    text: 'RUBY-MODUS VERSLAGEN 🔥 Officieel: jij bent de baas. Deze modus heet niet voor niks naar jou.',
    check: (s) => (s.levels.ruby?.solved || 0) >= 1 },
  { id: 'vijfentwintig', title: 'Kwart eeuw', icon: '🌻',
    hint: 'Los 25 puzzels op',
    text: '25 puzzels! Dat zijn meer dan 1000 ingevulde vakjes. En ik heb nog steeds niet genoeg van jou.',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 25 }),
    check: (s) => s.totalSolved >= 25 },
  { id: 'streak30', title: 'Een maand lang', icon: '🏆',
    hint: 'Puzzel 30 dagen achter elkaar',
    text: 'Dertig dagen op rij. Dertig! Volgens mij ben jij het meest volhardende mens dat ik ken. Ik ben trots op je.',
    unit: ['dag op rij', 'dagen op rij'], badge: ['dag', 'dagen'], progress: (s) => ({ current: s.streak, target: 30 }),
    check: (s) => s.bestStreak >= 30 },
  { id: 'rugnummer33', title: 'Rugnummer 33', icon: '🏐',
    hint: 'Los 33 puzzels op',
    text: '33 puzzels, precies het nummer op jouw shirt! 🏐 Op het veld ben je nummer 33, maar voor mij ben je altijd nummer 1. Ik blijf je grootste fan langs de lijn. 📣',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 33 }),
    check: (s) => s.totalSolved >= 33 },
  { id: 'vijftig', title: 'Vijftig', icon: '🌺',
    hint: 'Los 50 puzzels op',
    text: '50 puzzels. Tijd voor een echte beloning: een dagje uit, jij kiest. (Dit berichtje telt als officiële bon 🎟️)',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 50 }),
    check: (s) => s.totalSolved >= 50 },
  { id: 'honderd', title: 'Honderd!', icon: '💯',
    hint: 'Los 100 puzzels op',
    text: 'HONDERD PUZZELS. Je bent een legende. Ik hou van je, RubyxCube. Ook als je even vastzit 💛 Laat dit scherm zien voor één enorme knuffel. 🤗',
    unit: ['puzzel', 'puzzels'], progress: (s) => ({ current: s.totalSolved, target: 100 }),
    check: (s) => s.totalSolved >= 100 },
];

export function newMilestones(stats, unlocked) {
  return MILESTONES.filter((m) => !unlocked.includes(m.id) && m.check(stats));
}

// De dichtstbijzijnde nog geheime mijlpaal waarvan we de voortgang kunnen tellen,
// of null als er niks meer te tellen valt.
export function nextMilestone(stats, unlocked) {
  let best = null;
  for (const m of MILESTONES) {
    if (unlocked.includes(m.id) || !m.progress) continue;
    const { current, target } = m.progress(stats);
    const remaining = Math.max(1, target - (current || 0));
    if (!best || remaining < best.remaining) best = { milestone: m, current: Math.min(current || 0, target), target, remaining };
  }
  return best;
}

// "Nog 7 puzzels tot je volgende geheime berichtje 🔐"
export function milestoneLine(next) {
  if (!next) return '';
  const [one, many] = next.milestone.unit;
  return `Nog ${next.remaining} ${next.remaining === 1 ? one : many} tot je volgende geheime berichtje 🔐`;
}

// Kort, voor het bolletje op de knop Berichtjes: "nog 1 dag 🔐", "nog 3 puzzels 🔐".
export function milestoneBadge(next) {
  if (!next) return '';
  const [one, many] = next.milestone.badge || next.milestone.unit;
  return `nog ${next.remaining} ${next.remaining === 1 ? one : many} 🔐`;
}

// ---------- Persoonlijke records ----------

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Een tijdsverschil zoals je het hardop zou zeggen: "12 seconden",
// "ruim een minuut", "2 min", "bijna een uur".
export function humanDuration(ms) {
  const s = Math.round(Math.max(0, ms) / 1000);
  if (s < 1) return 'een tikje';
  if (s === 1) return '1 seconde';
  if (s < 60) return `${s} seconden`;
  // In hele minuten (of uren), met 'ruim' of 'bijna' voor wat er overblijft.
  const say = (n, rest, part, one, unit, next) => {
    if (rest < part / 4) return n === 1 ? one : `${n} ${unit}`;
    if (rest < (part * 3) / 4) return n === 1 ? `ruim ${one}` : `ruim ${n} ${unit}`;
    return `bijna ${next(n + 1)}`;
  };
  if (s < 3600) {
    return say(Math.floor(s / 60), s % 60, 60, 'een minuut', 'min', (n) => (n === 60 ? 'een uur' : `${n} min`));
  }
  return say(Math.floor(s / 3600), s % 3600, 3600, 'een uur', 'uur', (n) => `${n} uur`);
}

// Een nieuw persoonlijk record. `level` = { name, emoji }; `diff` = hoeveel sneller (tekst).
export const RECORD_LINES = [
  ({ name, emoji, diff }) => `Nieuw record op ${name}! ${capital(diff)} sneller dan je vorige beste ${emoji}`,
  ({ name, emoji, diff }) => `${capital(diff)} sneller dan ooit op ${name}. Wat ben jij goed bezig ${emoji}`,
  ({ name, diff }) => `Record op ${name}! Je was ${diff} sneller dan je vorige beste 🏅`,
  ({ name, diff }) => `Zo snel was je nog nooit op ${name}: ${diff} van je record af 💛`,
  ({ name, emoji, diff, nick }) => `Wauw${nick}, een nieuw record op ${name}! ${capital(diff)} sneller dan vorige keer ${emoji}`,
];

// De allereerste op een niveau: nog geen record, wel iets om naar uit te kijken.
export const FIRST_LEVEL_LINES = [
  ({ name, emoji }) => `Je eerste ${name}! Vanaf nu heb je een record om te verbreken ${emoji}`,
  ({ name, emoji }) => `Hoera, je allereerste ${name}! Deze tijd is vanaf nu je record ${emoji}`,
  ({ name, emoji }) => `Je eerste ${name} staat erop. Volgende keer mag je tegen jezelf racen ${emoji}`,
];

// De regel voor het opgelost-scherm, of '' als er niks te melden valt. We zijn
// nooit negatief: langzamer dan je record zeggen we gewoon niet.
export function recordLine({ level, elapsed, previousBest, firstOnLevel }, rng = Math.random) {
  if (firstOnLevel && previousBest == null) return pick(FIRST_LEVEL_LINES, rng)(level);
  if (previousBest == null || !(elapsed < previousBest)) return '';
  return pick(RECORD_LINES, rng)({ ...level, diff: humanDuration(previousBest - elapsed), nick: maybeNick(rng, 0.6) });
}

// ---------- Kalender ----------

export const CALENDAR_WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
export const CALENDAR_PICK_DAY = 'Tik op een dag om te zien wat je toen hebt opgelost.';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Onderaan de maand: "Deze maand: 14 puzzels op 9 dagen 💛".
export function monthSummary({ puzzles, days, current, month }) {
  if (!puzzles) return current ? 'Deze maand nog geen puzzels. Zin in eentje? 💛' : `In ${month} geen puzzels: even pauze, dat mag ook 🌿`;
  return `${current ? 'Deze maand' : `In ${month}`}: ${plural(puzzles, 'puzzel', 'puzzels')} op ${plural(days, 'dag', 'dagen')} 💛`;
}

// Een dag zonder puzzels.
export function emptyDayLine({ isToday, future }) {
  if (future) return 'Deze dag moet nog komen ✨';
  if (isToday) return 'Vandaag nog niks opgelost. De dagpuzzel staat voor je klaar ☀️';
  return 'Deze dag even geen puzzel. Rustdagen horen er ook bij 🌿';
}

// Bij een puzzel waarmee ze een record zette (vast per dag, zodat het niet verspringt).
export const CALENDAR_RECORD_NOTES = ['Hier zette je een nieuw record 🏅', 'Record! Sneller dan ooit op dit niveau 🏅', 'Een record-dag, wat knap 🏅'];
export const calendarRecordNote = (day) => CALENDAR_RECORD_NOTES[Number(day.slice(-2)) % CALENDAR_RECORD_NOTES.length];

// Waar een speciale puzzel bij hoorde, voor de kalender.
export const specialLabel = (id) => (specialById(id)?.kind === 'verjaardag' ? 'je verjaardag 🎂' : 'ons jubileum 💛');

// ---------- Nieuwe thema's (seizoenen) ----------

export const THEME_UNLOCK_TEXT = {
  lente: 'Alles gaat weer bloeien. Ik ook, elke keer als ik jou zie 🦋',
  zomer: 'Voor lange avonden, ijsjes op het terras en jouw zonnige humeur 🍦',
  herfst: 'Voor de gezelligste tijd van het jaar, met jou op de bank 🛋️',
  winter: 'Voor koude dagen en warme knuffels. Kruip maar lekker onder de deken 🧣',
};

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
