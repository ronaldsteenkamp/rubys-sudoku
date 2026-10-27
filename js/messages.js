// Alles wat persoonlijk is: bijnamen, begroetingen, lieve berichtjes,
// mijlpalen, speciale dagen en wedstrijddagen. Pas gerust aan!

import { LAST_MATCH, shortOpponent, matchStart } from './matches.js';
import { TECHNIQUES } from './techniques.js';

export const NICKNAMES = [
  'Ruby', 'Ruubs', 'RubyxCube', 'Liefje', 'Schatje', 'R', 'Koffiemonster', 'Gehaktballetje',
  'Van der Vegt', 'Vegtie', 'Au Pair', 'Jonkie',
];

// Samen sinds 26 september 2026; jarig op 12 oktober (2005).
export const ANNIVERSARY = { year: 2026, month: 9, day: 26 };
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

// ---------- Slaapstand (zie sleep.js) ----------

// Na een puzzel laat op de avond: geen gewoon berichtje, maar een zacht duwtje richting bed.
export const SLEEP_NOTES = [
  'Telefoon weg, slapen 😴 Ik droom vast van je.',
  'Opgelost! Nu ogen dicht, lieverd 🌙',
  'Dat was de laatste voor vandaag. Welterusten, slaap lekker 💛',
  'Goed gedaan. Je hoofd mag nu uit, net als dit scherm 😴',
  'Puzzel klaar, dag klaar. Droom maar iets moois ✨',
  'Kussen erbij, telefoon eraf. Tot morgen 🌙',
  'Zelfs je hersentjes moeten slapen. Welterusten, slimmerd 💤',
  'Opgelost in je pyjama. Nu nog even slapen in je pyjama 😴',
  'Morgen staat er een nieuwe puzzel. Nu eerst dromen 💛',
  'De honden slapen al. Jij nu ook 🐶💤',
  'Slaap lekker, en droom van een bord vol goede cijfers 🧩',
  'Lichtjes uit, ogen dicht. Ik hou van je, ook in je slaap 🌙',
];
export const sleepNote = (rng = Math.random) => pick(SLEEP_NOTES, rng);

// ---------- Begroeting per dagdeel ----------

// In de grote begroeting alleen bijnamen van minstens 3 tekens ("Goedemorgen R" leest raar).
const GREETING_NICKNAMES = NICKNAMES.filter((n) => n.length >= 3);

// Dagdelen: nacht tot 6 uur, ochtend tot 12, middag tot 18, daarna avond.
export const partOfDay = (date = new Date()) => {
  const h = date.getHours();
  return h < 6 ? 'nacht' : h < 12 ? 'ochtend' : h < 18 ? 'middag' : 'avond';
};

// De begroeting met de preitaart: tik drie keer op de 🥧 en er gebeurt iets (zie ui.js).
export const PIE_GREETING = (n) => `Hé ${n}, preitaart gegeten? 🥧`;
// Altijd deze begroeting (om te testen: ?begroeting=preitaart).
export const pieGreeting = (rng = Math.random) => PIE_GREETING(pick(GREETING_NICKNAMES, rng));

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
    PIE_GREETING,
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
const pad2 = (n) => String(n).padStart(2, '0');
const keyOfDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const noon = (y, m, d) => new Date(y, m - 1, d, 12);

export function daysTogether(date = new Date()) {
  const start = new Date(ANNIVERSARY.year, ANNIVERSARY.month - 1, ANNIVERSARY.day);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86400000);
}

// Hele maanden samen, geteld vanaf de maand van het jubileum.
export const monthsTogether = (date) => (date.getFullYear() - ANNIVERSARY.year) * 12 + (date.getMonth() + 1 - ANNIVERSARY.month);

// De dag waarop Ruby deze app kreeg (de app-verjaardag is elk jaar daarna).
export const APP_GIFT = { year: 2026, month: 10, day: 21 };

// De laatste thuiswedstrijd van het seizoen. Wordt het schema in matches.js
// later aangevuld (een nieuw seizoen), pas deze dan ook aan; een test
// controleert dat hij de laatste thuiswedstrijd in het schema is.
export const LAST_HOME_MATCH = { date: '2027-04-17', time: '17:00', opponent: 'LSV DS 3' };

// Eerste paasdag volgens het algoritme van Meeus/Butcher (gregoriaanse kalender).
export function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return noon(year, month, day);
}

// Koningsdag is 27 april, behalve als dat een zondag is: dan de zaterdag ervoor.
export function kingsDay(year) {
  const d = noon(year, 4, 27);
  return d.getDay() === 0 ? noon(year, 4, 26) : d;
}

// Iets vasts per jaar (na een herstart hetzelfde, volgend jaar iets anders).
const byYear = (list, year, salt = 0) => list[(((year + salt) % list.length) + list.length) % list.length];
const idSeed = (id) => [...id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
const HALVES = ['een half', 'anderhalf', 'tweeënhalf', 'drieënhalf', 'vierenhalf', 'vijfenhalf', 'zesenhalf', 'zevenenhalf', 'achtenhalf', 'negenenhalf'];
const months = (m) => (m === 1 ? '1 maand' : `${m} maanden`);
const yearsText = (n) => (n === 1 ? 'een jaar' : `${n} jaar`);

// Lieve zinnetjes voor de maandversary (elke 26e), vast per maand.
export const MONTHSARY_LINES = [
  ({ m, n }) => `Alweer ${m} samen, ${n}. Elke maand een beetje meer 💛`,
  ({ m }) => `Vandaag ${m} samen. Ik ben nog steeds net zo blij als op dag één 😊`,
  ({ m }) => `${m} samen, en je bent nog steeds mijn favoriete puzzel 🧩`,
  ({ m }) => `Weer een ${ANNIVERSARY.day}e! ${m} met jou voelen als een zondagochtend ☀️`,
  ({ m }) => `${m} samen. Zin in koffie? Ik trakteer ☕`,
  ({ m, n }) => `Fijne maandversary, ${n}: ${m} vol lachen en preitaart 🥧`,
  ({ m }) => `${m} samen, en ik word nog steeds blij als ik je zie 💛`,
  ({ m }) => `Kijk eens wat de kalender zegt: ${m} samen 📅💛`,
  ({ m }) => `${m} samen! De honden kwispelen mee 🐶`,
  ({ m }) => `Vandaag ${m} samen. Dikke knuffel van mij 🤗`,
  ({ m }) => `${m} geleden begon ons verhaal. Ik lees graag verder 📖`,
  ({ m }) => `Alweer ${m}. Op naar de volgende 🌷`,
  ({ m, n }) => `${m} samen, ${n}. Jij maakt elke maand mooier ✨`,
];

// Alle speciale dagen, in volgorde van voorrang: valt er meer op één dag, dan
// wint de bovenste. Per soort: `on(jaar)` geeft de datum in dat jaar (of null),
// `shape` is de figuurpuzzel (null = alleen een kaartje), `celebrate` de
// emoji's bij het oplossen. Teksten krijgen { year, nick, days, stats, ... }
// mee en worden per jaar vast gekozen. Een dag toevoegen = één regel erbij.
// De id is `<soort>-<jaar>`, of `<soort>-<JJJJ-MM-DD>` bij de maandversary.
const LOVE = ['❤️', '💛', '💗', '💕'];
export const SPECIAL_DAYS = [
  { kind: 'jubileum', label: 'ons jubileum 💛', icon: '💛', shape: 'heart', celebrate: LOVE,
    on: (y) => noon(y, ANNIVERSARY.month, ANNIVERSARY.day), seed: ({ year }) => 290900 + year,
    title: ({ years }) => (years > 0 ? `${years} jaar samen 💛` : 'Vandaag begon het 💛'),
    text: ({ years }) => (years > 0
      ? `Vandaag zijn we precies ${years === 1 ? 'één jaar' : `${years} jaar`} samen. Elk jaar met jou is mijn favoriete puzzel. Deze is speciaal voor jou gemaakt, kijk maar goed naar de vorm 😉`
      : 'Vandaag begon ons verhaal. Deze puzzel is speciaal voor jou gemaakt, kijk maar goed naar de vorm 😉'),
    solved: [({ years }) => (years > 0
      ? `Gelukkig ${years === 1 ? 'eenjarig' : `${years}-jarig`} jubileum, lieverd. Op nog heel veel jaren, puzzels en preitaartjes samen. Ik hou van je. 💛`
      : 'Ik ben zo blij dat jij er bent. Ik hou van je. 💛')] },
  { kind: 'verjaardag', label: 'je verjaardag 🎂', icon: '🎂', shape: 'heart', celebrate: LOVE,
    on: (y) => noon(y, BIRTHDAY.month, BIRTHDAY.day), seed: ({ year }) => 121000 + year,
    title: ({ age }) => `Gefeliciteerd, ${age} jaar! 🎂`,
    text: ({ age, nick }) => `Hiep hiep hoera, ${nick}! Vandaag ben je ${age}. Ik heb een puzzel voor je met een verrassing erin. Kijk maar naar de vorm 😉`,
    solved: [({ age }) => `Van harte gefeliciteerd met je ${age}e verjaardag, mooiste meisje dat er is. Ik hoop dat je dag net zo zonnig is als jij 🎉💛`] },
  { kind: 'halfjaar', label: 'een half jaar samen 💞', icon: '💞', shape: 'half-heart', celebrate: ['💞', '💛', '💗', '✨'],
    on: (y) => (y > ANNIVERSARY.year ? noon(y, ((ANNIVERSARY.month + 5) % 12) + 1, ANNIVERSARY.day) : null),
    title: ({ half }) => `${half.charAt(0).toUpperCase()}${half.slice(1)} jaar samen 💞`,
    text: ({ half, nick }) => `Vandaag zijn we ${half} jaar samen, ${nick}. Kijk goed naar dit hart: de ene helft staat al vol. De andere helft ben ik 💞`,
    solved: [
      ({ half }) => `Zie je? Samen is het een heel hart. ${half.charAt(0).toUpperCase()}${half.slice(1)} jaar, en ik wil er nog heel veel 💞`,
      ({ half, nick }) => `Twee helften, één hart. Dank je voor ${half} jaar, ${nick} 💛`,
      () => 'Het hart is weer heel. Net als ik, sinds jij er bent 💞'] },
  { kind: 'honderd', label: '100 dagen samen 🎈', icon: '🎈', shape: 'balloon', celebrate: ['🎈', '💯', '💛', '🎉'],
    on: (y) => { const d = new Date(ANNIVERSARY.year, ANNIVERSARY.month - 1, ANNIVERSARY.day + 100, 12); return d.getFullYear() === y ? d : null; },
    title: () => '100 dagen samen 🎈',
    text: ({ nick }) => `Vandaag zijn we precies 100 dagen samen, ${nick}! Honderd dagen vol koffie, puzzels en jou. Daarom een ballon, gewoon omdat het kan 🎈`,
    solved: [() => 'Honderd dagen, en ik ben nog lang niet uitgepuzzeld. Op de volgende honderd 🎈', () => 'Honderd keer wakker worden en aan jou denken. Op nog veel meer 💛'] },
  { kind: 'app-verjaardag', label: 'de verjaardag van je app 🎁', icon: '🎁', shape: 'gift', celebrate: ['🎁', '🎉', '💛', '🧩'],
    on: (y) => (y > APP_GIFT.year ? noon(y, APP_GIFT.month, APP_GIFT.day) : null),
    title: ({ appYears }) => `${appYears} jaar Ruby's Sudoku 🎁`,
    text: ({ appYears, stats }) => `${stats ? `${appYears} jaar Ruby's Sudoku: ${plural(stats.totalSolved, 'puzzel', 'puzzels')}, langste reeks ${plural(stats.bestStreak, 'dag', 'dagen')} 🔥 ` : ''}Vandaag ${yearsText(appYears)} geleden kreeg je deze app. Tijd voor een cadeautje terug 🎁`,
    solved: [({ nick }) => `Gefeliciteerd met je app-verjaardag, ${nick}! Op nog een jaar vol puzzels 🎁`, ({ appYears }) => `${yearsText(appYears).charAt(0).toUpperCase()}${yearsText(appYears).slice(1)} puzzelen, en je wordt alleen maar slimmer (en liever). Dank je dat je speelt 💛`] },
  { kind: 'thuiswedstrijd', label: 'de laatste thuiswedstrijd 🏐', icon: '🏐', shape: 'volleyball', celebrate: ['🏐', '📣', '💛', '⭐'], replacesWarmup: true,
    on: (y) => { const [yy, m, d] = LAST_HOME_MATCH.date.split('-').map(Number); return yy === y ? noon(yy, m, d) : null; },
    title: () => 'Laatste thuiswedstrijd 🏐',
    text: ({ days }) => `Vandaag om ${LAST_HOME_MATCH.time} de laatste thuiswedstrijd van het seizoen, tegen ${shortOpponent(LAST_HOME_MATCH)}. Nog één keer in jullie eigen zaal, nummer 33. Ik ben zo trots op je${days === 200 ? '. En leuk toeval: vandaag zijn we precies 200 dagen samen 💛' : ' 💛'}`,
    solved: [() => 'Opgewarmd voor de laatste thuiswedstrijd. Dag thuiszaal, tot volgend seizoen 👋🏐', () => 'Nummer 33, de thuiszaal gaat je missen. Ik zit (in gedachten) op de tribune 📣'] },
  { kind: 'valentijn', label: 'Valentijnsdag 💘', icon: '💘', shape: 'heart-arrow', celebrate: ['💘', '❤️', '💌', '🌹'],
    on: (y) => noon(y, 2, 14), title: () => 'Fijne Valentijnsdag 💘',
    text: ({ nick, year }) => byYear([`Voor mijn valentijn, ${nick}: een hart met een pijl erdoor. Raak, want ik ben allang om 💘`, 'Valentijnsdag! Cupido heeft gemikt en precies jou geraakt. Of eigenlijk mij 💘'], year),
    solved: [() => 'Raak! Ik hou van je, valentijn 💘', () => 'Mijn hart had je al, nu ook deze puzzel 💘'] },
  { kind: 'pasen', label: 'Pasen 🐣', icon: '🐣', shape: 'egg', celebrate: ['🐣', '🥚', '🌷', '🐰'],
    on: (y) => easter(y), title: () => 'Vrolijk Pasen 🐣',
    text: ({ nick, year }) => byYear([`Vrolijk Pasen, ${nick}! De paashaas heeft een ei verstopt, maar dan van cijfers 🥚`, 'Paaszondag! Geen eieren zoeken vandaag, alleen cijfers. Deze vind je vast 🐣'], year),
    solved: [() => 'Gevonden! Jij bent de beste eierzoeker 🥚', () => 'Ei-genlijk wist ik al dat je hem zou oplossen 🐣'] },
  { kind: 'koningsdag', label: 'Koningsdag 👑', icon: '👑', shape: 'crown', celebrate: ['🧡', '👑', '🎉'],
    on: (y) => kingsDay(y), title: () => 'Fijne Koningsdag 👑',
    text: ({ nick, year }) => byYear([`Oranje boven, ${nick}! Vandaag ben jij de koningin van de sudoku 👑`, 'Koningsdag! Geen vrijmarkt nodig: deze kroon krijg je gratis, als je hem oplost 🧡'], year),
    solved: [() => 'Koninklijk opgelost! Hoera voor de puzzelkoningin 🧡👑', () => 'Lang leve jij! 🎉👑'] },
  { kind: 'halloween', label: 'Halloween 🎃', icon: '🎃', shape: 'pumpkin', celebrate: ['🎃', '👻', '🍬', '🦇'],
    on: (y) => noon(y, 10, 31), title: () => 'Fijne Halloween 🎃',
    text: ({ nick, year }) => byYear([`Boe! Een pompoen vol cijfers, ${nick}. Griezelig? Nee hoor, gewoon lief 🎃`, 'Halloween! Ik heb een pompoen uitgehold en er een sudoku in verstopt. Niet schrikken 👻'], year),
    solved: [() => 'Je hebt de pompoen helemaal opgelost. Snoepje verdiend 🍬', () => 'Zelfs spookjes vinden jou slim 👻💛'] },
  { kind: 'sinterklaas', label: 'Sinterklaas 🎁', icon: '🎁', shape: 'letter-r', celebrate: ['🎁', '🍫', '🐴', '⭐'],
    on: (y) => noon(y, 12, 5), title: () => 'Sinterklaasavond 🎁',
    text: ({ year }) => byYear([
      'Sint keek in zijn grote boek en las daar dit:\ndat Ruby elke dag weer met een sudoku zit.\nZo slim en zo lief verdient een beloning,\ndus krijgt ze een R van chocola, als een kroning.\n— de Sint 🎁',
      'Piet vond in de schoorsteen een briefje, heel klein:\n‘Wat zou Ruby blij met een sudoku zijn!’\nDus schreef de Sint terug, met zijn pen van goud:\neen letter van chocola, voor iemand van wie men houdt.\n— de Sint 🎁'], year),
    solved: [() => 'De letter is af. Smakelijk eten, zegt de Sint 🍫', () => 'Goed gedaan! Sint en Piet zijn trots op je 🎁'] },
  { kind: 'kerst', label: 'Kerst 🎄', icon: '🎄', shape: 'tree', celebrate: ['🎄', '⭐', '🎁', '❄️'],
    on: (y) => noon(y, 12, 25), title: () => 'Vrolijk kerstfeest 🎄',
    text: ({ nick, year }) => byYear([`Vrolijk kerstfeest, ${nick}! Onder deze boom ligt geen cadeautje, maar een puzzel. En een knuffel van mij 🎄`, 'Het is kerst! Lichtjes aan, warme chocomel erbij, en dan deze boom versieren met cijfers 🎄✨'], year),
    solved: [() => 'De boom staat er prachtig bij. Fijne kerst, lieverd 🎄💛', () => 'Mooiste kerstboom ooit. Net zoals jij het mooiste cadeau bent 🎁'] },
  { kind: 'tweede-kerstdag', label: 'Tweede kerstdag ⭐', icon: '⭐', shape: 'star', celebrate: ['⭐', '✨', '🎄', '💛'],
    on: (y) => noon(y, 12, 26), title: () => 'Tweede kerstdag ⭐',
    text: ({ nick, year }) => byYear([`Nog een beetje kerst over: een ster voor jou, ${nick} ⭐`, 'Tweede kerstdag: restjes eten en een ster oplossen ⭐'], year),
    solved: [() => 'Jij bent mijn ster ⭐', () => 'Stralend opgelost ✨'] },
  { kind: 'nieuwjaar', label: 'Nieuwjaar 🎆', icon: '🎆', shape: 'fireworks', celebrate: ['🎆', '🥂', '✨', '🎉'],
    on: (y) => noon(y, 1, 1), title: ({ year }) => `Gelukkig ${year} 🎆`,
    text: ({ nick, year }) => byYear([`Gelukkig ${year}, ${nick}! Het eerste vuurwerk van het jaar is van cijfers. Op een jaar vol puzzels en ons 🎆`, `Welkom, ${year}! Ik weet nu al dat het een mooi jaar wordt, want jij zit erin 🎆`], year),
    solved: [({ year }) => `De eerste puzzel van ${year} zit erin! 🥂`, ({ year }) => `${year} begint goed. Proost op jou 🥂✨`] },
  // Elke 26e (zou die dag in februari niet bestaan, dan de laatste dag). Geen puzzel, alleen een kaartje.
  { kind: 'maandversary', label: 'de maandversary 💛', icon: '💛', shape: null, celebrate: LOVE, perDay: true,
    matches: (d) => {
      const lastOfFeb = d.getMonth() === 1 && new Date(d.getFullYear(), 2, 0).getDate() === d.getDate();
      return (d.getDate() === ANNIVERSARY.day || (lastOfFeb && d.getDate() < ANNIVERSARY.day)) && monthsTogether(d) >= 1;
    },
    title: ({ months: m }) => `${months(m)} samen 💛`,
    text: ({ months: m, nick }) => MONTHSARY_LINES[m % MONTHSARY_LINES.length]({ m: months(m), n: nick }),
    solved: [] },
];

const specialKind = (kind) => SPECIAL_DAYS.find((s) => s.kind === kind);

// Bouwt het object voor een speciale dag op `date` (die al klopt voor deze soort).
function buildSpecial(def, date, stats = null) {
  const year = date.getFullYear();
  const id = `${def.kind}-${def.perDay ? keyOfDate(date) : year}`;
  const c = {
    date, year, stats, days: daysTogether(date), months: monthsTogether(date),
    nick: byYear(GREETING_NICKNAMES, year, def.kind.length),
    years: year - ANNIVERSARY.year, age: year - BIRTHDAY.year, appYears: year - APP_GIFT.year,
    half: HALVES[Math.round((monthsTogether(date) - 6) / 12)] ?? `${Math.round((monthsTogether(date) - 6) / 12)}½`,
  };
  const solved = def.solved.length ? byYear(def.solved, year)(c) : '';
  return {
    id, kind: def.kind, label: def.label, icon: def.icon, shape: def.shape, celebrate: def.celebrate,
    replacesWarmup: Boolean(def.replacesWarmup),
    title: def.title(c), text: def.text(c), solvedText: solved,
    seed: def.seed ? def.seed(c) : idSeed(id),
  };
}

const isOn = (def, date) => (def.perDay ? def.matches(date) : (() => { const d = def.on(date.getFullYear()); return Boolean(d) && sameDay(date, { month: d.getMonth() + 1, day: d.getDate() }); })());

// Alle soorten speciale dag op `date`, in volgorde van voorrang (voor de tests).
export const specialKindsOn = (date) => SPECIAL_DAYS.filter((def) => isOn(def, date)).map((def) => def.kind);

// Geeft de speciale dag van vandaag terug (de bovenste bij samenvallen), of null.
// `stats` is nodig voor de teksten van de app-verjaardag.
export function specialDay(date = new Date(), stats = null) {
  const def = SPECIAL_DAYS.find((d) => isOn(d, date));
  return def ? buildSpecial(def, date, stats) : null;
}

// Zoekt een speciale dag terug aan de hand van z'n id (bijv. 'verjaardag-2027'
// of 'maandversary-2026-11-29'), zodat een puzzel die na middernacht af is toch
// het goede berichtje krijgt.
export function specialById(id, stats = null) {
  const m = /^([a-z]+(?:-[a-z]+)*)-(\d{4})(?:-(\d{2})-(\d{2}))?$/.exec(id || '');
  const def = m && specialKind(m[1]);
  if (!def || Boolean(def.perDay) !== Boolean(m[3])) return null;
  const date = def.perDay ? noon(Number(m[2]), Number(m[3]), Number(m[4])) : def.on(Number(m[2]));
  return date && isOn(def, date) ? buildSpecial(def, date, stats) : null;
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
  { id: 'boekje', title: 'Het hele boekje', icon: '📖',
    hint: 'Ontdek alle 13 technieken via hints',
    text: 'Alle dertien technieken staan in je boekje, van Laatste vakje tot XYZ-wing! Hint voor hint heb je ze leren kennen. Mijn slimme puzzelaar: er is geen sudoku meer die jou nog bang maakt 📖💛',
    // Geen aftelling op de knop Berichtjes: hoeveel ze er kent, staat al in het boekje zelf.
    check: (s) => Object.keys(TECHNIQUES).every((id) => s.techniques?.[id]) },
  { id: 'seizoen-uit', title: 'Seizoen uitgespeeld', icon: '🏐',
    hint: 'Doe de herstelpuzzel na de laatste wedstrijd van het seizoen',
    text: 'Het seizoen zit erop! Bij elke wedstrijd stond ik (in gedachten) langs de lijn. Op naar het volgende seizoen, nummer 33. Ik blijf je grootste fan 📣💛',
    check: (s) => Boolean(s.matches?.[LAST_MATCH.date]?.herstel) },
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
export const specialLabel = (id) => specialById(id)?.label ?? 'een speciale dag 💛';

// ---------- Wedstrijddag (Donitas DS 14, zie matches.js) ----------

// Iets vasts per wedstrijd (zodat de kop niet bij elke blik verspringt).
const byDate = (list, date, salt = 0) => list[[...date].reduce((a, c) => a + c.charCodeAt(0), salt) % list.length];
export const matchNick = (date) => byDate(GREETING_NICKNAMES, date);

// "Vanavond om 21:00 uit bij DIO Bedum 🏐"
export function matchHeadline(match, phase) {
  const where = match.home ? 'thuis tegen' : 'uit bij';
  const opp = shortOpponent(match);
  if (phase === 'tijdens') return `Nu bezig: ${where} ${opp} 🏐`;
  if (phase === 'na') return `${match.home ? 'Thuis tegen' : 'Uit bij'} ${opp} 🏐`;
  const h = matchStart(match).getHours();
  return `${h < 12 ? 'Vanochtend' : h < 18 ? 'Vanmiddag' : 'Vanavond'} om ${match.time} ${where} ${opp} 🏐`;
}

// Peptalks vóór de wedstrijd. `when` (optioneel): alleen bij 'thuis', 'uit',
// 'ochtend' (aanvang vóór 12 uur) of 'avond' (vanaf 18 uur).
// In de tekst: n = bijnaam, opp = tegenstander.
export const PEPTALKS = [
  { text: ({ n }) => `Vandaag ben jij nummer 33 én nummer 1, ${n}. Laat ze maar zien hoe het moet 🏐` },
  { text: ({ n }) => `Diep ademhalen, ${n}. Je hebt dit al honderd keer gedaan, en je kunt het 💛` },
  { text: ({ n }) => `Eén punt tegelijk, net als één vakje tegelijk. Succes, ${n}! 🧩` },
  { text: () => 'Ik ben nu al trots op je, wat de uitslag ook wordt 💛' },
  { text: ({ n }) => `Hoge ballen, harde smashes en een lach op je gezicht. Zo doe je dat, ${n} 💪` },
  { text: () => 'Rugnummer 33 heeft er zin in. De rest van het team gelukkig ook 😄' },
  { text: () => 'Onthoud: de bal moet óver het net. Dat is eigenlijk het hele geheim 😉' },
  { text: () => 'Wordt het spannend? Denk aan preitaart. Werkt altijd 🥧' },
  { text: () => 'Mis je een bal, zeg dan gewoon dat de zon in je ogen scheen. Ook binnen 😎' },
  { text: () => 'Met Donitas ben je onverslaanbaar gezellig. En misschien ook gewoon onverslaanbaar 🏐' },
  { when: 'thuis', text: ({ n }) => `Thuiswedstrijd! Eigen zaal, eigen net, eigen publiek. Maak er een feestje van, ${n} 🏠` },
  { when: 'thuis', text: ({ opp }) => `Vandaag komt ${opp} bij jullie op bezoek. Laat maar zien wie hier de baas is 📣` },
  { when: 'uit', text: ({ opp }) => `Op naar ${opp}! Neem je beste set mee, en een snack voor onderweg 🚗` },
  { when: 'uit', text: () => 'Uitwedstrijd, maar met jou erbij voelt elke zaal als thuis 🏐' },
  { when: 'ochtend', text: () => 'Ochtendwedstrijd: eerst koffie, dan knallen ☕🏐' },
  { when: 'ochtend', text: ({ n }) => `Vroeg op voor volleybal. Jij bent echt een kampioen, ${n} 🌅` },
  { when: 'avond', text: () => 'Avondwedstrijd: de hele dag om op te laden, en dan vanavond schitteren ✨' },
  { when: 'avond', text: ({ n }) => `Vanavond ben jij de ster in de zaal, ${n} 🌟` },
];

// Welke peptalks passen bij deze wedstrijd (thuis/uit, ochtend/avond)?
export function peptalksFor(match) {
  const h = matchStart(match).getHours();
  const tags = [match.home ? 'thuis' : 'uit', h < 12 ? 'ochtend' : h >= 18 ? 'avond' : 'middag'];
  return PEPTALKS.map((p, i) => i).filter((i) => !PEPTALKS[i].when || tags.includes(PEPTALKS[i].when));
}

// Kiest een peptalk (index) die ze bij de laatste wedstrijden niet al kreeg.
export function pickPeptalk(match, recent = [], rng = Math.random) {
  const fits = peptalksFor(match);
  const fresh = fits.filter((i) => !recent.includes(i));
  return pick(fresh.length ? fresh : fits, rng);
}

export const peptalkText = (i, match) => (PEPTALKS[i] || PEPTALKS[0]).text({ n: matchNick(match.date), opp: shortOpponent(match) });

// Tijdens de wedstrijd (dan speelt ze; de app wacht gewoon).
export const DURING_LINES = [
  'Succes! Ik zit (in gedachten) langs de lijn 📣',
  'Nu even geen sudoku: jij staat te knallen. Ik juich mee 📣',
  'Hup Donitas! Hup nummer 33! 📣',
];
export const duringLine = (match) => byDate(DURING_LINES, match.date);

// Warming-up: op het kaartje als hij gedaan is, en op het opgelost-scherm.
export const WARMUP_READY = 'Een korte warming-up voor je hoofd 🧠';
export const WARMUP_DONE = 'Warming-up gedaan ✓ Hersens staan aan, nu de benen nog 💪';
export const WARMUP_BY_SPECIAL = 'Je warming-up van vandaag is de volleybal hierboven 🏐';
export const WARMUP_NOTES = [
  'Hersens zijn warm, nu de armen nog 💪',
  'Opgewarmd! Je hoofd is er klaar voor, nu de rest van je ook 🏐',
  'Check: hersens aan. Nu nog even rekken en strekken 🤸',
  'Zo, die warming-up zit erin. Succes straks, nummer 33 💛',
  'Snel gefikst! Neem die snelheid mee het veld op ⚡',
];
export const warmupNote = (rng = Math.random) => pick(WARMUP_NOTES, rng);

// Na de wedstrijd vraagt de app hoe het ging. Hij weet de uitslag niet en
// neemt die dus nooit aan; bij verloren troostend en trots, nooit 'volgende
// keer beter'; bij zeg-maar-niks neutraal en lief.
export const HOW_DID_IT_GO = 'Hoe ging het?';
export const OUTCOME_BUTTONS = [
  { id: 'gewonnen', label: 'Gewonnen 🏆' },
  { id: 'verloren', label: 'Verloren 💛' },
  { id: 'stil', label: 'Zeg maar niks 🤫' },
];
export const OUTCOME_REPLIES = {
  gewonnen: [
    'Gewonnen! Ik wist het wel. Wat ben ik trots op je 🏆',
    'Yes! Nummer 33 heeft weer geleverd 🏆',
    'Een overwinning! Die mag je de hele avond vieren 🎉',
    'Gewonnen, natuurlijk. Jullie zijn toppers 🏐',
  ],
  verloren: [
    'Balen, maar ik ben net zo trots op je. Je hebt alles gegeven 💛',
    'Niet gewonnen, wel gespeeld met je hele hart. Dat telt voor mij het meest 💛',
    'Verliezen hoort erbij. In mijn ogen ben jij altijd de beste 💛',
    'Kom maar hier, knuffel. Je hebt het goed gedaan 🤗',
  ],
  stil: [
    'Prima, we hebben het er niet over. Fijn dat je er weer bent 💛',
    'Geheim is geheim 🤫 Tijd om lekker bij te komen.',
    'Het is goed zo. Zin in een rustig puzzeltje? 🛋️',
  ],
};
export const outcomeReply = (uitslag, date) => byDate(OUTCOME_REPLIES[uitslag] || OUTCOME_REPLIES.stil, date, 7);

export const RECOVERY_READY = 'Een rustige puzzel om bij te komen 🛋️';
export const RECOVERY_DONE = 'Herstelpuzzel gedaan. Lekker uitrusten nu 🛋️';
export const RECOVERY_NOTES = {
  gewonnen: [
    'Gewonnen én een puzzel opgelost. Wat een dag, kampioen 🏆',
    'Twee overwinningen op één dag. Jij bent niet te stoppen 💛',
    'Nu lekker uitrusten. Dat heb je dubbel en dwars verdiend 🛋️',
  ],
  verloren: [
    'Zo, je hoofd is weer even rustig. Ik ben trots op je, altijd 💛',
    'Na een zware wedstrijd nog een puzzel gefikst. Dat zegt genoeg over jou 💛',
    'Vandaag was je gewoon geweldig. Kom maar lekker bij 🤗',
  ],
  stil: [
    'Lekker bijgekomen? Fijne avond nog 💛',
    'Rustig puzzeltje, rustig hoofd 🌙',
    'Zo, die zit erin. Nu nog een dekentje en thee 🍵',
  ],
};
export const recoveryNote = (uitslag, rng = Math.random) => pick(RECOVERY_NOTES[uitslag] || RECOVERY_NOTES.stil, rng);

// ---------- Ruby Wrapped (jaaroverzicht, zie wrapped.js) ----------

export const WRAPPED_CARD_TITLE = 'Jouw jaar in puzzels ✨';
const clock = (ms) => { const sec = Math.round(ms / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const longDay = (key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)), 12).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
const monthNameOf = (m) => new Date(2026, m, 1).toLocaleDateString('nl-NL', { month: 'long' });
const thousands = (n) => n.toLocaleString('nl-NL');

const FAVORITE_LINES = {
  zondag: 'Rustig wakker worden is helemaal jouw ding ☀️',
  koffie: 'Altijd met een bakkie erbij. Natuurlijk ☕',
  nadenken: 'Jij houdt van een beetje hersengekraak 🤔',
  ruby: 'Ruby-modus, uiteraard. Hij heet niet voor niks naar jou 🔥',
};
const PART_LINES = {
  ochtend: ['Jij puzzelt het liefst bij het ontbijt ☕', 'Vroege vogel met een vroege sudoku 🐦'],
  middag: ['Een puzzel in de middagpauze, daar word je blij van 🌼', 'Middagdipje? Niet bij jou: dan puzzel je 🧩'],
  avond: ['Op de bank, dekentje erbij, puzzel erop 🛋️', 'De avond is van jou en je sudoku 🌙'],
  nacht: ['Nachtuiltje! De beste puzzels doe jij als iedereen slaapt 🦉', 'Als de maan op is, ben jij aan het puzzelen 🌙'],
};
const PART_NAMES = { ochtend: 'ochtendpuzzelaar', middag: 'middagpuzzelaar', avond: 'avondpuzzelaar', nacht: 'nachtpuzzelaar' };
const PUZZLE_LINES = ['Dat zijn heel wat cijfertjes 🧩', 'Tel ze maar niet na, ik heb het al gedaan 😉', 'Al die vakjes, één voor één. Knap hoor 💛'];
const STREAK_LINES = ['Zo vaak achter elkaar! Dat is pas doorzetten 🔥', 'Dag na dag na dag. Ik ben trots op je 🔥', 'Een reeks om in te lijsten 🖼️🔥'];
const CLOSING_LINES = [
  'Elk vakje dat jij invulde, maakte mij ook een beetje blij. Dank je dat je speelt, en dat je er bent.',
  'Wat een jaar. Al die puzzels, al die koffie, en al die keren dat je glimlachte als het klopte. Ik heb van elke minuut genoten.',
  'Je bent slimmer dan je denkt, liever dan je weet, en mijn favoriete puzzel blijft altijd jij.',
];

// De kaarten van Ruby Wrapped: [{ id, emoji, kicker, big, text }]. `level(id)` geeft
// { name, emoji } van een niveau. Kaarten zonder genoeg gegevens worden overgeslagen.
// Teksten liggen vast per jaar.
export function wrappedCards(w, level) {
  const y = w.year;
  const nick = byYear(GREETING_NICKNAMES, y, 3);
  const when = w.partial ? `Sinds ${longDay(w.since)}` : `Dit jaar`;
  const cards = [{
    id: 'opening', emoji: '✨', kicker: `Ruby Wrapped ${y}`, big: `Hoi ${nick}!`,
    text: w.partial ? `Dit is jouw puzzeljaar sinds ${longDay(w.since)}, toen je deze app kreeg. Tik maar door ✨` : `Dit was jouw ${y} in puzzels. Tik maar door ✨`,
  }];
  if (w.puzzles >= 1) {
    cards.push({ id: 'puzzels', emoji: '🧩', kicker: `${when} opgelost`, big: `${w.puzzles} ${w.puzzles === 1 ? 'puzzel' : 'puzzels'}`,
      text: `Daarvoor vulde je ongeveer ${thousands(w.cells)} vakjes in. ${byYear(PUZZLE_LINES, y)}` });
  }
  if (w.favorite) {
    const l = level(w.favorite.level);
    cards.push({ id: 'favoriet', emoji: l.emoji, kicker: 'Je favoriete niveau', big: l.name,
      text: `${w.favorite.count} keer gespeeld. ${FAVORITE_LINES[w.favorite.level] || ''}`.trim() });
  }
  if (w.fastest) {
    const l = level(w.fastest.level);
    cards.push({ id: 'snelste', emoji: '⚡', kicker: 'Je snelste puzzel', big: clock(w.fastest.ms),
      text: `${l.emoji} ${l.name}, op ${longDay(w.fastest.day)}. Bliksemsnel!` });
  }
  if (w.longestStreak >= 2) {
    cards.push({ id: 'reeks', emoji: '🔥', kicker: 'Je langste reeks', big: `${w.longestStreak} dagen`, text: byYear(STREAK_LINES, y) });
  }
  if (w.hours) {
    cards.push({ id: 'uur', emoji: { ochtend: '🌅', middag: '🌼', avond: '🛋️', nacht: '🦉' }[w.hours.part], kicker: 'Jouw puzzeluur',
      big: `Een ${PART_NAMES[w.hours.part]}`, text: `Je drukste uur was ${w.hours.peak}:00. ${byYear(PART_LINES[w.hours.part], y)}` });
  }
  if (w.busiestMonth && w.busiestDay) {
    const month = monthNameOf(w.busiestMonth.month);
    // De drukste dag alleen als er een dag met meer dan één puzzel was.
    const dayLine = w.busiestDay.count >= 2 ? ` Je drukste dag was ${longDay(w.busiestDay.day)}, met ${w.busiestDay.count} puzzels.` : '';
    cards.push({ id: 'maand', emoji: '📅', kicker: 'Je drukste maand', big: `${month.charAt(0).toUpperCase()}${month.slice(1)}`,
      text: `In ${month} loste je ${w.busiestMonth.count} ${w.busiestMonth.count === 1 ? 'puzzel' : 'puzzels'} op.${dayLine}` });
  }
  const specials = w.specials.map((id) => specialById(id)).filter(Boolean);
  if (specials.length) {
    cards.push({ id: 'speciaal', emoji: specials.map((s) => s.icon).join(' '), kicker: 'Speciale dagen',
      big: `${specials.length} ${specials.length === 1 ? 'figuurpuzzel' : 'figuurpuzzels'}`,
      text: `Je loste ${specials.length === 1 ? 'hem' : 'ze'} op voor ${specials.map((s) => s.label.replace(/\s+\S+$/u, '')).join(', ').replace(/, ([^,]*)$/, ' en $1')}. Stuk voor stuk speciaal, net als jij 💛` });
  }
  if (w.puzzles >= 2) {
    cards.push({ id: 'koffie', emoji: '☕', kicker: 'Koppen koffie', big: `± ${w.coffee}`,
      text: `Ongeveer 1 kop per 2 puzzels ☕ Het Koffiemonster in jou heeft goed gewerkt 😉` });
  }
  cards.push({ id: 'afsluiter', emoji: '💛', kicker: `Van mij, voor jou`, big: `Op naar ${y + 1} 💛`, text: byYear(CLOSING_LINES, y) });
  return cards;
}

// ---------- Nieuwe thema's (vrijgespeeld) ----------

export const THEME_UNLOCK_TEXT = {
  lente: 'Alles gaat weer bloeien. Ik ook, elke keer als ik jou zie 🦋',
  zomer: 'Voor lange avonden, ijsjes op het terras en jouw zonnige humeur 🍦',
  herfst: 'Voor de gezelligste tijd van het jaar, met jou op de bank 🛋️',
  winter: 'Voor koude dagen en warme knuffels. Kruip maar lekker onder de deken 🧣',
  robijn: 'Tien keer Ruby-modus verslagen! Daar hoort een robijn bij: zeldzaam, stralend en keihard. Net als jij 💎',
  rubyxcube: 'Zes dagen op rij, voor elke kant van de kubus één. Voor mijn RubyxCube, die ik nooit helemaal uitgepuzzeld raak 🧩',
  koffiemonster: 'Vijftig puzzels vóór tienen. Het Koffiemonster is wakker ☕ Deze is van mij, met extra melkschuim en een hartje erin 🤎',
  beachvolleybal: 'Het WK Beachvolleybal is in Nederland! Zand tussen je tenen, zon op je snoet en ik langs de lijn. Dit thema blijft van jou 🏖️',
  zonnebloem: 'Kwart eeuw aan puzzels, en kijk: er is iets gaan groeien 🌱 Op je startscherm staat nu een zonnebloem. Elke dag dat je puzzelt, groeit hij een stukje. Net als ik, elke dag een beetje meer gek op jou 🌻',
  bos: 'Veertig puzzels! Tijd voor een wandeling door het bos: mos onder je voeten, zon door de bladeren, en als je goed kijkt een eekhoorntje met een nootje 🐿️',
  noorderlicht: 'Vijf keer laat op de avond nog gepuzzeld, nachtuil van me. Als beloning het noorderlicht, speciaal voor jou aangezet 🌌💚',
  onderwater: 'Tien puzzels zonder één hint! Je bent zo diep gedoken dat je bij de visjes bent beland. Blub, wat ben je slim 🐠🫧',
  gameboy: 'Psst… je hebt het geheime level gevonden! 👾 Press Start, Player 1. (Niet verder vertellen.)',
  sporthal: 'Drieëndertig keer hooggehouden, net als het nummer op je shirt! De tribune staat op z’n kop 📣 Welkom in de sporthal, nummer 33. (Ssst, geheim.)',
  kampvuur: 'Alle zes snaren, van laag naar hoog! Daar gaat het vuurtje aan 🔥 Pak een dekentje en een marshmallow, liefje. Ik zing vals mee.',
  preitaart: 'Je hebt de preitaart gevonden! 🥧 Bladerdeeg, romige vulling en een ringetje prei, net als bij ons thuis. Eet smakelijk, Gehaktballetje.',
  vertrekhal: 'Een kokosnoot! Dat kan maar één ding betekenen: we gaan weer naar Las Palmas ✈️ Je instapkaart ligt klaar, Schatje. Gate 33, on time 💛',
  'onzichtbare-inkt': 'Je liet niet los, en kijk: er stond al die tijd iets geschreven, in onzichtbare inkt 🔦 Schijn maar eens met het lampje, Liefje. Het staat er echt.',
  wandeltijd: 'Vijf pootjes gevangen! Iemand staat al kwispelend bij de deur met de riem in z’n bek 🐶 Jas aan, Ruubs: het is wandeltijd 🐾',
  middernacht: 'Klokslag twaalf en jij zat nog te puzzelen, nachtuiltje 🕛 Dit thema krijg je alleen op het spookuur. Nu snel slapen, en droom maar van mij 💜',
};

// ---------- Kleine tekstjes ----------

export const LOADING_LINES = [
  'Even een puzzel bakken… 🥧',
  'Cijfers aan het schudden… 🎲',
  'Koffie zetten voor de puzzel… ☕',
];

// Als de 3 hints van een puzzel op zijn.
export const HINTS_UP_LINES = [
  'Je 3 hints zijn op voor deze puzzel. Jij kan dit! 💪',
  'Geen hints meer, wel heel veel vertrouwen in jou 💛',
  'Hints op! Even wegkijken en opnieuw kijken helpt echt 🌿',
  'Vanaf hier ben jij de hint 🧩',
];

export const PAUSE_LINES = [
  'Even pauze. Neem rustig je tijd 🌼',
  'Pauze! Tijd om een hond te aaien 🐶',
  'Koffiepauze ☕',
];

// ---------- Dagthema's ----------

// Een emoji per thema, voor de regel boven de themakiezer op een dagthema-dag.
export const THEME_EMOJI = {
  zonnig: '☀️', nacht: '🌙', sterren: '⭐', liefde: '❤️', lelie: '🌸', 'gran-canaria': '🌴',
  volleybal: '🏐', briefje: '✏️', lente: '🌷', zomer: '☀️', herfst: '🍂', winter: '❄️',
  robijn: '💎', rubyxcube: '🧩', koffiemonster: '☕', gitaar: '🎸', beachvolleybal: '🏖️', dagverloop: '🌅',
  krant: '📰', krijtbord: '🖍️', zonnebloem: '🌻', 'hoog-contrast': '🔆', gameboy: '👾', sporthal: '🏐', kampvuur: '🔥', preitaart: '🥧', vertrekhal: '✈️', 'onzichtbare-inkt': '🔦', wandeltijd: '🐶', middernacht: '🕛',
  waddenzee: '🦭', bos: '🐿️', noorderlicht: '🌌', regen: '☔', onderwater: '🐠',
};

// Bovenaan de themakiezer als de app vandaag het thema kiest. `name` is het
// thema (bij een wedstrijd op een andere bijzondere dag bijv. "Volleybal met
// Nacht"), `emoji` de emoji's erbij. Vast per dag.
export const DAY_THEME_LINES = [
  ({ name, emoji }) => `Vandaag kies ik je thema: ${name} ${emoji} Morgen mag je weer zelf.`,
  ({ name, emoji }) => `Vandaag heb ik je thema al uitgezocht: ${name} ${emoji} Morgen is de keuze weer aan jou.`,
  ({ name, emoji }) => `Even niet kiezen vandaag: het is ${name} ${emoji} Morgen mag je weer, beloofd.`,
  ({ name, emoji }) => `Speciaal voor vandaag: ${name} ${emoji} Jouw eigen thema wacht gewoon tot morgen.`,
  ({ name, emoji }) => `Vandaag trakteer ik op ${name} ${emoji} Morgen kies je weer helemaal zelf 💛`,
];
export const dayThemeLine = (date, info) => DAY_THEME_LINES[(date.getFullYear() * 400 + (date.getMonth() + 1) * 31 + date.getDate()) % DAY_THEME_LINES.length](info);
