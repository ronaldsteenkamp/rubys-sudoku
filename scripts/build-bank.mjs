// Bouwt js/bank.js: een voorraad lastige puzzels als vangnet voor trage toestellen.
// Gebruik: node scripts/build-bank.mjs [aantal per niveau]
import { writeFileSync } from 'node:fs';
import { generate } from '../js/generator.js';
import { gridToString } from '../js/solver.js';

const per = Number(process.argv[2] || 120);
const bank = {};
for (const levelId of ['nadenken', 'ruby']) {
  const seen = new Set();
  let seed = levelId === 'ruby' ? 1_000_000 : 2_000_000;
  while (seen.size < per) {
    const p = generate({ levelId, seed: seed++, maxAttempts: 400, useBank: false });
    if (p.source === 'generator' && p.rating === (levelId === 'ruby' ? 4 : 3)) seen.add(gridToString(p.givens));
  }
  bank[levelId] = [...seen];
  console.log(levelId, bank[levelId].length);
}
const body = Object.entries(bank)
  .map(([k, list]) => `  ${k}: [\n${list.map((s) => `    '${s}',`).join('\n')}\n  ],`)
  .join('\n');
writeFileSync(new URL('../js/bank.js', import.meta.url),
  `// Automatisch gegenereerd door scripts/build-bank.mjs — niet met de hand aanpassen.\nexport const BANK = {\n${body}\n};\n`);
