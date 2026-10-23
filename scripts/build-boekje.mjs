// Maakt de mini-voorbeelden voor het Techniekenboekje (js/boekje-voorbeelden.js).
// Eén keer draaien is genoeg; de app genereert niets live.
// Gebruik: node scripts/build-boekje.mjs
//
// Per techniek lossen we een heleboel puzzels stap voor stap logisch op (zoals
// de hints dat doen) en bewaren we de kleinste uitsnede van het bord waarin een
// stap met die techniek helemaal te zien is: het gebied (rij, kolom of blok),
// de betrokken vakjes, de kandidaten die weg mogen, en voor een enige plek de
// cijfers die de andere plekken blokkeren.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generate, LEVELS } from '../js/generator.js';
import { TECHNIQUES, computeCandidates, findStep, applyStep } from '../js/techniques.js';
import { UNITS, PEERS, rowOf, colOf } from '../js/solver.js';

const ROOT = new URL('..', import.meta.url).pathname;
const SEEDS = Number(process.env.SEEDS || 120);

// Wat een hint bij stap 2 laat zien (zie getHint in hints.js), plus het vakje dat het wordt.
function marks(s, grid) {
  if (s.place) {
    const region = UNITS[s.units[0]];
    const digit = s.technique === 'hidden-single' ? s.place.digit : null;
    // Bij een enige plek: de cijfers die de andere lege vakjes in het gebied blokkeren.
    const witnesses = digit ? grid.map((v, i) => i).filter((i) => grid[i] === digit
      && region.some((c) => !grid[c] && c !== s.place.cell && PEERS[c].includes(i))) : [];
    // Bij een enige kandidaat: zijn hele rij, kolom en blok (daar staan de acht andere cijfers).
    const units = s.technique === 'naked-single' ? [rowOf(s.place.cell), 9 + colOf(s.place.cell), 18 + Math.floor(rowOf(s.place.cell) / 3) * 3 + Math.floor(colOf(s.place.cell) / 3)] : s.units.slice(0, 1);
    return { units, focus: [s.place.cell], digit, strike: [], extra: witnesses };
  }
  return { units: s.units, focus: s.cells, digit: s.digits.length === 1 ? s.digits[0] : null, strike: s.eliminations, extra: [] };
}

function bbox(cells) {
  const rs = cells.map(rowOf), cs = cells.map(colOf);
  return { r0: Math.min(...rs), r1: Math.max(...rs), c0: Math.min(...cs), c1: Math.max(...cs) };
}

const best = {};
for (const level of LEVELS) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const p = generate({ levelId: level.id, seed: 7000 + seed * 13, timeBudget: 150 });
    const grid = p.givens.slice();
    const cands = computeCandidates(grid);
    for (let k = 0; k < 120; k++) {
      const s = findStep(grid, cands, 4);
      if (!s) break;
      const m = marks(s, grid);
      const region = m.units.flatMap((u) => UNITS[u]);
      const box = bbox([...region, ...m.focus, ...m.strike.map((e) => e.cell), ...m.extra]);
      // Een enige plek moet helemaal te volgen zijn: elk ander leeg vakje wordt zichtbaar geblokkeerd.
      if (s.technique === 'hidden-single' && UNITS[s.units[0]].some((c) => !grid[c] && c !== s.place.cell
        && !m.extra.some((w) => PEERS[c].includes(w)))) { applyStep(grid, cands, s); continue; }
      // Liever liggend (een rij) dan staand: dat past beter in het boekje.
      const area = (box.r1 - box.r0 + 1) * (box.c1 - box.c0 + 1) + (box.r1 - box.r0 > box.c1 - box.c0 ? 0.5 : 0);
      const cur = best[s.technique];
      // Kleiner is beter; bij gelijke grootte een voorbeeld met wat meer ingevuld (rustiger).
      const empties = region.filter((i) => !grid[i]).length;
      if (!cur || area < cur.area || (area === cur.area && empties < cur.empties)) {
        const cells = [];
        for (let r = box.r0; r <= box.r1; r++) for (let c = box.c0; c <= box.c1; c++) {
          const i = r * 9 + c;
          cells.push(grid[i] ? (p.givens[i] ? grid[i] : -grid[i]) : 0);
        }
        const notes = [];
        for (let r = box.r0; r <= box.r1; r++) for (let c = box.c0; c <= box.c1; c++) notes.push(grid[r * 9 + c] ? 0 : cands[r * 9 + c]);
        best[s.technique] = { area, empties, example: {
          rows: [box.r0, box.r1], cols: [box.c0, box.c1], cells, notes,
          region: [...new Set(region)].sort((a, b) => a - b), focus: m.focus, digit: m.digit,
          strike: m.strike.map(({ cell, digit }) => [cell, digit]), extra: m.extra,
        } };
      }
      applyStep(grid, cands, s);
    }
  }
}

const missing = Object.keys(TECHNIQUES).filter((t) => !best[t]);
if (missing.length) { console.error('Geen voorbeeld gevonden voor', missing.join(', ')); process.exit(1); }

const body = Object.keys(TECHNIQUES).map((t) => `  '${t}': ${JSON.stringify(best[t].example)},`).join('\n');
writeFileSync(join(ROOT, 'js/boekje-voorbeelden.js'), `// Mini-voorbeelden voor het Techniekenboekje. Gemaakt met scripts/build-boekje.mjs; niet met de hand aanpassen.
// Per techniek een uitsnede van een echt bord, op het moment dat die techniek de volgende stap is:
//   rows, cols  de rijen en kolommen van de uitsnede (0–8, allebei meegerekend)
//   cells       per vakje (rij voor rij): 0 = leeg, n = gegeven cijfer, -n = al ingevuld
//   notes       per vakje de kandidaten als bitmasker (bit 0 = 1), alleen bij lege vakjes
//   region      de vakjes (0–80) van het gebied waar de hint naar wijst
//   focus       de vakjes waar het om draait; digit het cijfer (of null)
//   strike      [vakje, cijfer]: kandidaten die weg mogen; extra: cijfers die andere plekken blokkeren
export const EXAMPLES = {
${body}
};
`);
for (const t of Object.keys(TECHNIQUES)) {
  const e = best[t].example;
  console.log(t.padEnd(14), `${e.rows[1] - e.rows[0] + 1}×${e.cols[1] - e.cols[0] + 1}`);
}
