// Het wedstrijdschema van Donitas DS 14 (Dames 3e Klasse B), waar Ruby
// speelt met rugnummer 33. Op een wedstrijddag krijgt ze vóór de wedstrijd een
// peptalk en een warming-up-puzzel, en daarna een rustige herstelpuzzel.
//
// Aanpassen:
// - Een wedstrijd toevoegen: zet een regel in MATCHES, op datum gesorteerd.
//   `date` is 'JJJJ-MM-DD', `time` is de aanvangstijd 'UU:MM' in lokale tijd
//   (Nederland), `home` is true als Donitas thuis speelt, `opponent` de tegenstander.
// - Een wedstrijd verzetten: pas `date` en/of `time` aan.
// - Een wedstrijd schrappen: haal de regel weg (of zet er // voor).
// Per datum hooguit één wedstrijd. `npm test` controleert het schema.
//
// Alles hier is puur (geen DOM), zodat het ook in Node te testen is.

export const TEAM = 'Donitas DS 14';

export const MATCHES = [
  { date: '2026-10-22', time: '21:00', home: false, opponent: 'DIO Bedum DS 7' },
  { date: '2026-10-31', time: '17:00', home: true, opponent: 'Dovo/Hujades DS 2' },
  { date: '2026-11-07', time: '16:30', home: false, opponent: 'Vc Grijpskerk // Brilmode Zuidhorn DS 5' },
  { date: '2026-11-14', time: '17:00', home: true, opponent: 'Merna DS 2' },
  { date: '2026-11-21', time: '17:00', home: true, opponent: 'Oranje Nassau DS 14' },
  { date: '2026-11-28', time: '11:00', home: false, opponent: 'Kroton DS 5' },
  { date: '2026-12-12', time: '17:00', home: true, opponent: 'Butiq / Set Uppers DS 8' },
  { date: '2027-01-09', time: '17:00', home: true, opponent: 'DIO Bedum DS 7' },
  { date: '2027-01-12', time: '19:45', home: false, opponent: 'Meister SV DS 1' },
  { date: '2027-02-06', time: '14:30', home: false, opponent: 'Dovo/Hujades DS 2' },
  { date: '2027-02-13', time: '17:00', home: true, opponent: 'Vc Grijpskerk // Brilmode Zuidhorn DS 5' },
  { date: '2027-03-12', time: '19:00', home: false, opponent: 'Merna DS 2' },
  { date: '2027-03-20', time: '21:00', home: false, opponent: 'Oranje Nassau DS 14' },
  { date: '2027-04-03', time: '17:00', home: true, opponent: 'Kroton DS 5' },
  { date: '2027-04-10', time: '11:30', home: false, opponent: 'Butiq / Set Uppers DS 8' },
  { date: '2027-04-17', time: '17:00', home: true, opponent: 'LSV DS 3' },
];

// Hoe lang een wedstrijd ongeveer duurt, en wanneer hij "laat" is.
export const MATCH_MINUTES = 120;
const LATE_END = { h: 22, m: 30 }; // eindigt een wedstrijd ná 22:30, dan gaat ze daarna slapen…
const NEXT_DAY_UNTIL = 12; // …en loopt 'na' door tot de volgende dag 12:00.

// De laatste wedstrijd van het seizoen (voor de mijlpaal "Seizoen uitgespeeld").
export const LAST_MATCH = MATCHES[MATCHES.length - 1];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// De wedstrijd op de (lokale) datum van `date`, of null. (`schedule` is er voor de tests.)
export function matchOn(date = new Date(), schedule = MATCHES) {
  const key = keyOf(date);
  return schedule.find((m) => m.date === key) || null;
}

// Aanvang en einde als lokale Date. We rekenen met lokale velden (geen
// UTC-strings), zodat zomer- en wintertijd vanzelf goed gaan.
export function matchStart(match) {
  const [y, mo, d] = match.date.split('-').map(Number);
  const [h, mi] = match.time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi);
}
export function matchEnd(match) {
  const s = matchStart(match);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate(), s.getHours(), s.getMinutes() + MATCH_MINUTES);
}

// Eindigt de wedstrijd na 22:30 (of na middernacht)?
export function isLate(match) {
  const end = matchEnd(match);
  const lateLine = new Date(end.getFullYear(), end.getMonth(), end.getDate(), LATE_END.h, LATE_END.m);
  return keyOf(end) !== match.date || end > lateLine;
}

// Welke wedstrijd er nu speelt en in welke fase:
//   'voor'    vanaf middernacht tot de aanvang,
//   'tijdens' van de aanvang tot 2 uur later,
//   'na'      daarna tot het eind van de dag; bij een late wedstrijd tot de
//             volgende dag 12:00.
// Geeft { match, phase } of null. Een wedstrijd van vandaag gaat voor de
// nasleep van een late wedstrijd van gisteren.
export function currentMatch(now = new Date(), schedule = MATCHES) {
  const today = matchOn(now, schedule);
  if (today) {
    const phase = now < matchStart(today) ? 'voor' : now < matchEnd(today) ? 'tijdens' : 'na';
    return { match: today, phase };
  }
  const y = matchOn(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12), schedule);
  if (y && now < matchEnd(y)) return { match: y, phase: 'tijdens' }; // een wedstrijd die over middernacht heen loopt
  if (y && isLate(y) && now.getHours() < NEXT_DAY_UNTIL) return { match: y, phase: 'na' };
  return null;
}

export const matchPhase = (now = new Date(), schedule = MATCHES) => currentMatch(now, schedule)?.phase ?? null;

// "DIO Bedum DS 7" → "DIO Bedum": korter voor in een kop.
export const shortOpponent = (match) => match.opponent.replace(/\s+DS\s*\d+$/i, '');
