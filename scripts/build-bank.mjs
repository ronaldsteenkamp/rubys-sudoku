// Bouwt js/bank.js: een voorraad lastige puzzels als vangnet voor trage toestellen.
// Gebruik: node scripts/build-bank.mjs [aantal per niveau]
import { writeFileSync } from 'node:fs';
import { generate, LEVEL_TARGETS, levelById } from '../js/generator.js';
import { gridToString } from '../js/solver.js';

const per = Number(process.argv[2] || 120);
const bank = {};
// Per niveau een even groot deel per doeltechniek, om en om: voorraadpuzzel k
// heeft LEVEL_TARGETS[niveau][k % aantal] nodig (zie targetOf in generator.js).
// Een Verborgen drietal is zeldzaam: dat deel duurt een paar minuten.
const SEEDS = { koffie: 3_000_000, nadenken: 2_000_000, ruby: 1_000_000 };
for (const [levelId, targets] of Object.entries(LEVEL_TARGETS)) {
  const each = Math.ceil(per / targets.length);
  const want = levelById(levelId).level;
  const lists = targets.map((target, t) => {
    const seen = new Set();
    let seed = SEEDS[levelId] + t * 100_000;
    while (seen.size < each) {
      const p = generate({ levelId, seed: seed++, maxAttempts: 400, useBank: false, target });
      if (p.source === 'generator' && p.rating === want && p.techniques.includes(target)) seen.add(gridToString(p.givens));
    }
    console.log(levelId, target, seen.size);
    return [...seen];
  });
  bank[levelId] = [...Array(each)].flatMap((_, k) => lists.map((l) => l[k]));
}
const body = Object.entries(bank)
  .map(([k, list]) => `  ${k}: [\n${list.map((s) => `    '${s}',`).join('\n')}\n  ],`)
  .join('\n');
writeFileSync(new URL('../js/bank.js', import.meta.url),
  `// Automatisch gegenereerd door scripts/build-bank.mjs — niet met de hand aanpassen.\nexport const BANK = {\n${body}\n};\n`);
