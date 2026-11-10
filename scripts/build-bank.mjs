// Bouwt js/bank.js: een voorraad lastige puzzels als vangnet voor trage toestellen.
// Gebruik: node scripts/build-bank.mjs [aantal per niveau]
import { writeFileSync } from 'node:fs';
import { generate, RUBY_TARGETS } from '../js/generator.js';
import { gridToString } from '../js/solver.js';

const per = Number(process.argv[2] || 120);
const bank = {};
// Even nadenken: gewoon `per` puzzels van niveau 3.
{
  const seen = new Set();
  let seed = 2_000_000;
  while (seen.size < per) {
    const p = generate({ levelId: 'nadenken', seed: seed++, maxAttempts: 400, useBank: false });
    if (p.source === 'generator' && p.rating === 3) seen.add(gridToString(p.givens));
  }
  bank.nadenken = [...seen];
  console.log('nadenken', bank.nadenken.length);
}
// Ruby-modus: per doeltechniek een even groot deel, om en om (puzzel k heeft
// RUBY_TARGETS[k % 3] nodig; zie rubyTargetOf in generator.js).
{
  const each = Math.ceil(per / RUBY_TARGETS.length);
  const lists = RUBY_TARGETS.map((target, t) => {
    const seen = new Set();
    let seed = 1_000_000 + t * 100_000;
    while (seen.size < each) {
      const p = generate({ levelId: 'ruby', seed: seed++, maxAttempts: 400, useBank: false, target });
      if (p.source === 'generator' && p.rating === 4 && p.techniques.includes(target)) seen.add(gridToString(p.givens));
    }
    console.log('ruby', target, seen.size);
    return [...seen];
  });
  bank.ruby = [...Array(each)].flatMap((_, k) => lists.map((l) => l[k]));
}
const body = Object.entries(bank)
  .map(([k, list]) => `  ${k}: [\n${list.map((s) => `    '${s}',`).join('\n')}\n  ],`)
  .join('\n');
writeFileSync(new URL('../js/bank.js', import.meta.url),
  `// Automatisch gegenereerd door scripts/build-bank.mjs — niet met de hand aanpassen.\nexport const BANK = {\n${body}\n};\n`);
