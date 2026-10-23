// Het Techniekenboekje: de sudokutechnieken die Ruby onderweg leert via hints.
// Een techniek komt erin zodra een hint bij stap 2 (de uitleg) voor het eerst
// die techniek laat zien. Alleen via hints: een puzzel oplossen waarvoor de
// techniek nodig was, telt niet. Alles hier is puur (getest in Node); de
// weergave staat in ui.js, de voorbeelden in boekje-voorbeelden.js.
//
// In de statistieken: stats.techniques = { 'x-wing': { since: '2026-10-23', hints: 2 } }.

import { TECHNIQUES } from './techniques.js';
import { LEVELS } from './generator.js';

export const TECHNIQUE_IDS = Object.keys(TECHNIQUES);

// Per techniek een korte uitleg, in de toon van de hints.
export const TECHNIQUE_TEXT = {
  'full-house': 'Is er in een rij, kolom of blok nog maar één vakje leeg, dan kijk je gewoon welk cijfer er nog ontbreekt. Dat is hem! De makkelijkste, en toch elke keer een fijn moment.',
  'hidden-single': 'Kies een cijfer en kijk in één blok, rij of kolom waar het nog kan. Ziet elk ander leeg vakje dat cijfer al in zijn rij, kolom of blok, dan blijft er maar één plek over. Daar hoort hij.',
  'naked-single': 'Kijk vanuit één vakje naar zijn rij, kolom en blok. Zie je daar samen al acht verschillende cijfers, dan blijft er voor dit vakje maar één over.',
  pointing: 'Kan een cijfer binnen een blok alleen nog in één rij (of kolom) staan, dan ‘wijst’ het blok die kant op. In de rest van die rij mag dat cijfer uit je notities.',
  'box-line': 'Andersom kan ook: kan een cijfer in een rij of kolom alleen nog binnen één blok staan, dan zit het cijfer van dat blok dáár. Elders in het blok mag het uit je notities.',
  'naked-pair': 'Twee vakjes in dezelfde rij, kolom of blok die allebei alleen dezelfde twee cijfers kunnen zijn: die twee cijfers zijn dan bezet. Uit de andere vakjes daar mogen ze weg.',
  'hidden-pair': 'Passen twee cijfers in een rij, kolom of blok alleen in dezelfde twee vakjes, dan zijn die vakjes voor hen gereserveerd. Andere notities in die twee vakjes mogen weg.',
  'naked-triple': 'Net als een naakt paar, maar met drie: drie vakjes die samen maar drie cijfers kunnen zijn. Die drie zijn bezet, dus elders in dat gebied mogen ze weg. Niet elk vakje hoeft alle drie te hebben.',
  'hidden-triple': 'Drie cijfers die in een rij, kolom of blok alleen in dezelfde drie vakjes passen. Die vakjes zijn voor hen gereserveerd, dus andere notities daar mogen weg.',
  'x-wing': 'Kan een cijfer in twee rijen alleen in dezelfde twee kolommen staan, dan vormen die vier vakjes een rechthoek. Het cijfer komt op twee hoeken schuin tegenover elkaar, dus elders in die kolommen mag het weg.',
  swordfish: 'Een X-wing met drie: in drie rijen kan een cijfer alleen in dezelfde drie kolommen. Die kolommen krijgen hun cijfer dus uit deze rijen, en elders in die kolommen mag het weg.',
  'xy-wing': 'Een spilvakje met twee opties, en twee ‘vleugels’ die elk één optie met hem delen. Wat de spil ook wordt, één vleugel wordt het cijfer dat de vleugels samen hebben. Vakjes die beide vleugels zien, kunnen dat cijfer dus niet zijn.',
  'xyz-wing': 'Bijna een XY-wing, maar de spil heeft drie opties, ook het gedeelde cijfer. Eén van de drie vakjes wordt dat cijfer altijd, dus vakjes die alle drie zien, kunnen het niet zijn.',
};

// Het niveau (uit de app) waar een techniek voor het eerst nodig is.
export const levelOf = (id) => LEVELS.find((l) => l.level === TECHNIQUES[id].level);

// Waar ze een nog onbekende techniek kan vinden (zonder te verklappen hoe hij werkt).
export function lockedHint(id) {
  const l = levelOf(id);
  return `Vraag eens om een hint in ${l.name}${l.id === 'ruby' ? ' 🔥' : ''}`;
}

// Een hint is bij stap `stage` (0 = waar kijken, 1 = de uitleg, 2 = het antwoord).
// Pas bij de uitleg ziet ze de techniek; Foutje, Notitie en Cadeautje zijn geen techniek.
// Geeft { id, fresh } als dit een techniek uit het boekje is, anders null.
export function discoverFromHint(stats, hint, stage, day) {
  if (stage !== 1 || hint?.kind !== 'step' || !TECHNIQUES[hint.id]) return null;
  return { id: hint.id, fresh: discoverTechnique(stats, hint.id, day) };
}

// Een hint liet bij stap 2 techniek `id` zien. Nieuw: met de dag erbij; al bekend:
// de teller omhoog (de dag blijft). Geeft true als hij net ontdekt is.
export function discoverTechnique(stats, id, day) {
  if (!TECHNIQUES[id]) return false;
  const known = stats.techniques?.[id];
  stats.techniques = { ...(stats.techniques || {}), [id]: known ? { ...known, hints: known.hints + 1 } : { since: day, hints: 1 } };
  return !known;
}

// "Je kent nu 7 van de 13 technieken".
export const knownCount = (stats) => TECHNIQUE_IDS.filter((id) => stats.techniques?.[id]).length;

// Nieuw in het boekje en nog niet gezien (voor het stipje en de regel op het opgelost-scherm).
export const unseen = (stats, seen = []) => TECHNIQUE_IDS.filter((id) => stats.techniques?.[id] && !seen.includes(id));

// Per niveau de technieken, in de volgorde van de app.
export const BOOK = LEVELS.map((l) => ({ level: l, ids: TECHNIQUE_IDS.filter((id) => TECHNIQUES[id].level === l.level) }));

// Voor de opslag: alleen bekende technieken met een nette datum en teller.
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
export function cleanTechniques(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const id of TECHNIQUE_IDS) {
    const t = raw[id];
    if (!t || typeof t !== 'object' || !isDay(t.since)) continue;
    out[id] = { since: t.since, hints: Number.isInteger(t.hints) && t.hints >= 1 ? t.hints : 1 };
  }
  return out;
}
