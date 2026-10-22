// Maakt een nieuwe release: verhoogt VERSION in sw.js en zet de SHELL-HASH.
// Gebruik: npm run release   (daarna committen en pushen)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readSw, version, recordedHash, shellHash } from './shell.mjs';

const sw = readSw();
const hash = shellHash(sw);
if (hash === recordedHash(sw)) {
  console.log(`Niets veranderd sinds v${version(sw)}; geen nieuwe release nodig.`);
  process.exit(0);
}
const next = Number(version(sw)) + 1;
const out = sw
  .replace(/const VERSION = 'v\d+';/, `const VERSION = 'v${next}';`)
  .replace(/\/\/ SHELL-HASH: .*$/m, `// SHELL-HASH: ${hash}`);
writeFileSync(join(ROOT, 'sw.js'), out);
console.log(`Release v${next} klaar (hash ${hash}). Commit en push sw.js mee.`);
