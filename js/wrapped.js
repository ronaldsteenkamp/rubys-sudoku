// Ruby Wrapped: haar jaar in puzzels. Alles wordt hier uitgerekend uit het
// puzzellogboek (zie logEntries in storage.js); de teksten staan in messages.js.
// Puur (geen DOM, geen opslag), zodat het in Node te testen is.

// De dag dat Ruby de app kreeg: het eerste jaar is maar een deel van een jaar.
export const APP_START = '2026-10-21';

// Het niveau-id's van het startscherm (voor favoriet niveau en snelste tijd).
const PLAY_LEVELS = ['zondag', 'koffie', 'nadenken', 'ruby'];

// Hoeveel vakjes er ongeveer in te vullen waren, per soort puzzel. Het logboek
// bewaart niet hoeveel cijfers er gegeven waren; dit zijn de gemiddelden.
const EMPTY_CELLS = { zondag: 46, koffie: 53, nadenken: 57, ruby: 59, warmup: 35, herstel: 46 };
const EMPTY_DEFAULT = 50; // oude dagpuzzels (niveau onbekend) en figuurpuzzels

// Dagdeel bij een uur, net als partOfDay in messages.js.
export const partOfHour = (h) => (h < 6 ? 'nacht' : h < 12 ? 'ochtend' : h < 18 ? 'middag' : 'avond');

const dayNumber = (key) => Math.round(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))) / 86400000);

// Welke Wrapped hoort bij vandaag? Van 31 december tot en met 7 januari staat
// het kaartje op het startscherm: op 31 december dat jaar, in januari het vorige.
export function wrappedYearOn(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 12 && d === 31) return date.getFullYear();
  if (m === 1 && d <= 7) return date.getFullYear() - 1;
  return null;
}

// Alle jaren met een Wrapped die al te bekijken is (vanaf 31 december van dat jaar).
export function wrappedYears(years, date = new Date()) {
  const now = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return [...new Set(years)].filter((y) => now >= y * 10000 + 1231).sort((a, b) => b - a);
}

// Het jaaroverzicht. `log` = logEntries(stats), `year` = bijvoorbeeld 2026.
// Velden zijn null als er te weinig gegevens voor zijn; die kaart slaan we dan over.
export function wrapped(log, year) {
  const entries = (log || []).filter((e) => e && typeof e.day === 'string' && e.day.startsWith(`${year}-`));
  const puzzles = entries.length;
  const partial = APP_START.startsWith(`${year}-`);
  const result = {
    year, partial, since: partial ? APP_START : null, puzzles,
    cells: entries.reduce((n, e) => n + (e.special ? EMPTY_DEFAULT : EMPTY_CELLS[e.level] ?? EMPTY_DEFAULT), 0),
    days: new Set(entries.map((e) => e.day)).size,
    favorite: null, fastest: null, longestStreak: 0, hours: null, busiestMonth: null, busiestDay: null,
    specials: [...new Set(entries.map((e) => e.special).filter(Boolean))],
    coffee: Math.round(puzzles / 2),
  };
  if (!puzzles) return result;

  // Favoriete niveau: het vaakst gespeeld (alleen de vier niveaus; bij gelijkspel het moeilijkste).
  const perLevel = {};
  for (const e of entries) if (PLAY_LEVELS.includes(e.level) && !e.special) perLevel[e.level] = (perLevel[e.level] || 0) + 1;
  const levelCount = Object.values(perLevel).reduce((a, b) => a + b, 0);
  if (levelCount >= 3) {
    const [level, count] = Object.entries(perLevel).sort((a, b) => b[1] - a[1] || PLAY_LEVELS.indexOf(b[0]) - PLAY_LEVELS.indexOf(a[0]))[0];
    result.favorite = { level, count };
  }

  // Snelste tijd: op een van de vier niveaus, met een bekende tijd.
  const timed = entries.filter((e) => PLAY_LEVELS.includes(e.level) && !e.special && Number.isFinite(e.ms) && e.ms > 0);
  if (timed.length) {
    const f = timed.reduce((a, b) => (b.ms < a.ms ? b : a));
    result.fastest = { level: f.level, ms: f.ms, day: f.day };
  }

  // Langste reeks: dagen achter elkaar met minstens één puzzel, binnen dit jaar.
  const nums = [...new Set(entries.map((e) => dayNumber(e.day)))].sort((a, b) => a - b);
  let run = 0;
  for (let k = 0; k < nums.length; k++) {
    run = k && nums[k] === nums[k - 1] + 1 ? run + 1 : 1;
    result.longestStreak = Math.max(result.longestStreak, run);
  }

  // Haar puzzeluur: alleen puzzels waarvan we het uur weten (oude regels niet).
  const withHour = entries.filter((e) => Number.isInteger(e.hour));
  if (withHour.length >= 3) {
    const perHour = new Array(24).fill(0), perPart = { nacht: 0, ochtend: 0, middag: 0, avond: 0 };
    for (const e of withHour) { perHour[e.hour]++; perPart[partOfHour(e.hour)]++; }
    const top = perHour.indexOf(Math.max(...perHour));
    // Bij gelijkspel tussen dagdelen telt het dagdeel van het drukste uur.
    const best = Math.max(...Object.values(perPart));
    const part = perPart[partOfHour(top)] === best ? partOfHour(top) : Object.keys(perPart).find((p) => perPart[p] === best);
    // Het drukste uur binnen dat dagdeel, zodat uur en dagdeel bij elkaar passen.
    const peak = perHour.reduce((b, n, h) => (partOfHour(h) === part && (b < 0 || n > perHour[b]) ? h : b), -1);
    result.hours = { known: withHour.length, peak, peakCount: perHour[peak], part, parts: perPart };
  }

  // Drukste maand en drukste dag (bij gelijkspel de vroegste).
  if (puzzles >= 3) {
    const perMonth = new Array(12).fill(0), perDay = {};
    for (const e of entries) { perMonth[Number(e.day.slice(5, 7)) - 1]++; perDay[e.day] = (perDay[e.day] || 0) + 1; }
    const month = perMonth.indexOf(Math.max(...perMonth));
    result.busiestMonth = { month, count: perMonth[month] };
    const [day, count] = Object.entries(perDay).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    result.busiestDay = { day, count };
  }
  return result;
}
