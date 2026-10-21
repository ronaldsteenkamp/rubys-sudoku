// Slimme hints in drie stappen, zoals een lieve puzzelcoach:
//   1. waar moet je kijken (regio)
//   2. welke techniek en waarom (1–2 zinnen)
//   3. pas dan: het antwoord
//
// getHint(game) → { kind, technique, stages: [{ text, cells, units, digit }], action }

import { UNITS, bit, rowOf, colOf, boxOf } from './solver.js';
import { computeCandidates, findStep, applyStep, TECHNIQUES } from './techniques.js';
import { maybeNick } from './messages.js';

const BOX_NAMES = ['linksboven', 'middenboven', 'rechtsboven', 'linksmidden', 'in het midden', 'rechtsmidden', 'linksonder', 'middenonder', 'rechtsonder'];

export function unitName(u) {
  if (u < 9) return `rij ${u + 1}`;
  if (u < 18) return `kolom ${u - 8}`;
  const b = u - 18;
  return b === 4 ? 'het middelste blok' : `het blok ${BOX_NAMES[b]}`;
}

const unitKind = (u) => (u < 9 ? 'rij' : u < 18 ? 'kolom' : 'blok');
const list = (xs) => (xs.length <= 1 ? String(xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`);
const pick = (xs, rng) => xs[Math.floor(rng() * xs.length)];

function lookHere(units, rng) {
  const where = list(units.map(unitName));
  return pick([
    `Kijk eens naar ${where}${maybeNick(rng)} 👀`,
    `Psst… in ${where} valt iets te ontdekken${maybeNick(rng)}.`,
    `Ik zou even naar ${where} kijken${maybeNick(rng)} 🔎`,
  ], rng);
}

function explain(s) {
  const d = s.digits;
  const [u0, u1] = s.units;
  switch (s.technique) {
    case 'full-house':
      return `In ${unitName(u0)} is nog maar één vakje leeg. Welk cijfer ontbreekt er nog?`;
    case 'hidden-single':
      return `In ${unitName(u0)} kan de ${d[0]} nog maar op één plek staan; overal anders ziet hij al een ${d[0]} in de rij, kolom of het blok.`;
    case 'naked-single':
      return 'Dit vakje ziet in zijn rij, kolom en blok al acht verschillende cijfers. Er blijft er maar één over.';
    case 'pointing':
      return `In ${unitName(u0)} kan de ${d[0]} alleen in ${unitName(u1)} staan. Dus de rest van ${unitName(u1)} kan geen ${d[0]} meer zijn.`;
    case 'box-line':
      return `In ${unitName(u0)} kan de ${d[0]} alleen binnen ${unitName(u1)} staan. Dan zit de ${d[0]} van dat blok dus in deze ${unitKind(u0)}, en kan hij elders in het blok weg.`;
    case 'naked-pair':
    case 'naked-triple': {
      const n = s.cells.length === 2 ? 'twee' : 'drie';
      return `Deze ${n} vakjes in ${unitName(u0)} kunnen samen alleen ${list(d)} zijn. Die cijfers zijn dus ‘bezet’ en kunnen weg uit de andere vakjes van ${unitName(u0)}.`;
    }
    case 'hidden-pair':
    case 'hidden-triple': {
      const n = s.cells.length === 2 ? 'twee' : 'drie';
      return `In ${unitName(u0)} passen de ${list(d)} alleen in deze ${n} vakjes. Die vakjes zijn voor hen gereserveerd, dus andere notities daar kunnen weg.`;
    }
    case 'x-wing':
    case 'swordfish': {
      const n = s.technique === 'x-wing' ? 2 : 3;
      const base = s.units.slice(0, n), cross = s.units.slice(n);
      const kind = unitKind(base[0]) === 'rij' ? 'rijen' : 'kolommen';
      const other = kind === 'rijen' ? 'kolommen' : 'rijen';
      return `In de ${kind} ${list(base.map((u) => (u < 9 ? u + 1 : u - 8)))} kan de ${d[0]} alleen in dezelfde ${n} ${other} staan. Die ${other} krijgen hun ${d[0]} dus uit deze ${kind}, en elders in ${list(cross.map(unitName))} kan de ${d[0]} weg.`;
    }
    case 'xy-wing': {
      return 'Het middelste vakje heeft maar twee opties, en welke het ook wordt: één van de twee ‘vleugels’ wordt dan het gedeelde cijfer. Vakjes die beide vleugels zien, kunnen dat cijfer dus niet zijn.';
    }
    case 'xyz-wing':
      return 'Het spilvakje en zijn twee vleugels delen één cijfer. Eén van deze drie wordt dat cijfer altijd, dus vakjes die alle drie zien kunnen het niet zijn.';
    default:
      return '';
  }
}

function placementOutro(place, viaElimination, rng) {
  const cheer = pick(['Goed zo! ✨', 'Zie je wel, je kunt het 💛', 'Hop, die staat!', 'Mooi zo 🌼'], rng);
  return viaElimination
    ? `Daardoor blijft voor dit vakje alleen de ${place.digit} over. ${cheer}`
    : `Hier hoort een ${place.digit}. ${cheer}`;
}

const regionCells = (units) => [...new Set(units.flatMap((u) => UNITS[u]))];

export function getHint(game, rng = Math.random) {
  const { values, solution, notes } = game;

  // 1) Eerst eventuele foutjes rechtzetten — anders klopt de rest ook niet.
  const wrong = values.findIndex((v, i) => v && v !== solution[i]);
  if (wrong >= 0) {
    const box = 18 + boxOf(wrong);
    return {
      kind: 'mistake',
      technique: 'Foutje',
      stages: [
        { text: `Hmm, in ${unitName(box)} is iets niet helemaal goed gegaan${maybeNick(rng)}. Kijk nog eens?`, units: [box], cells: [] },
        { text: `Dit vakje klopt niet: er moet een ander cijfer staan. Geeft niks, dat gebeurt de besten 💛`, units: [box], cells: [wrong] },
        { text: 'Ik heb hem voor je weggehaald. Op naar de volgende!', units: [], cells: [wrong] },
      ],
      action: { type: 'erase', cell: wrong },
    };
  }

  // 2) Notities waarin het goede cijfer is weggestreept, zetten je op het verkeerde been.
  const badNote = notes.findIndex((n, i) => n && !values[i] && !(n & bit(solution[i])));
  if (badNote >= 0) {
    return {
      kind: 'notes',
      technique: 'Notitie',
      stages: [
        { text: `Kijk eens naar de notities in ${unitName(18 + boxOf(badNote))}${maybeNick(rng)}.`, units: [18 + boxOf(badNote)], cells: [] },
        { text: 'In dit vakje heb je per ongeluk het juiste cijfer weggestreept. Daardoor raak je straks in de knoop.', units: [], cells: [badNote] },
        { text: 'Ik heb de notitie voor je teruggezet ✏️', units: [], cells: [badNote], digit: solution[badNote] },
      ],
      action: { type: 'note', cell: badNote, digit: solution[badNote] },
    };
  }

  // 3) De volgende logische stap zoeken, op basis van de ingevulde cijfers.
  const grid = values.slice();
  const cands = computeCandidates(grid);
  const chain = [];
  let placing = null;
  for (let k = 0; k < 12; k++) {
    const s = findStep(grid, cands, 4);
    if (!s) break;
    if (s.place) { placing = s; break; }
    chain.push(s);
    applyStep(grid, cands, s);
  }

  if (placing && !chain.length) {
    return {
      kind: 'step',
      technique: TECHNIQUES[placing.technique].name,
      stages: [
        { text: lookHere(placing.units.slice(0, 1), rng), units: placing.units.slice(0, 1), cells: [] },
        {
          text: explain(placing),
          units: placing.units.slice(0, 1),
          cells: placing.technique === 'naked-single' ? [placing.place.cell] : [],
          digit: placing.technique === 'hidden-single' ? placing.place.digit : null,
        },
        { text: placementOutro(placing.place, false, rng), units: [], cells: [placing.place.cell] },
      ],
      action: { type: 'place', ...placing.place },
    };
  }

  if (placing && chain.length) {
    // De moeilijkste stap uit de keten is de "les"; de rest gebeurt op de achtergrond.
    const main = chain.reduce((a, b) => (b.level > a.level ? b : a));
    const extra = chain.length > 1 ? ' (Met nog een klein tussenstapje.)' : '';
    const elims = chain.flatMap((s) => s.eliminations);
    return {
      kind: 'step',
      technique: TECHNIQUES[main.technique].name,
      stages: [
        { text: lookHere(main.units.slice(0, 2), rng), units: main.units.slice(0, 2), cells: [] },
        {
          text: `${TECHNIQUES[main.technique].name}! ${explain(main)}${extra}`,
          units: main.units,
          cells: main.cells,
          strike: main.eliminations,
        },
        { text: placementOutro(placing.place, true, rng), units: [], cells: [placing.place.cell] },
      ],
      action: { type: 'place', ...placing.place, eliminations: elims },
    };
  }

  // 4) Vangnet: logisch te pittig voor onze technieken. Dan krijgt ze er eentje cadeau.
  let best = -1, bestN = 10;
  for (let i = 0; i < 81; i++) {
    if (values[i]) continue;
    let n = 0;
    for (let d = 1; d <= 9; d++) if (cands[i] & bit(d)) n++;
    if (n < bestN) { best = i; bestN = n; }
  }
  if (best < 0) return null;
  const peers = [rowOf(best), 9 + colOf(best), 18 + boxOf(best)];
  return {
    kind: 'reveal',
    technique: 'Cadeautje',
    stages: [
      { text: `Deze is echt pittig${maybeNick(rng)}! Kijk eens naar dit vakje.`, units: peers, cells: [best] },
      { text: `Hier zijn nog maar ${bestN} cijfers mogelijk. Probeer in gedachten wat er gebeurt als je er eentje kiest.`, units: peers, cells: [best] },
      { text: `Ik verklap ‘m: hier hoort een ${solution[best]} 🎁`, units: [], cells: [best] },
    ],
    action: { type: 'place', cell: best, digit: solution[best] },
  };
}

// Voor de UI: alle vakjes die bij de regio van een stap horen.
export const stageCells = (stage) => regionCells(stage.units || []);

