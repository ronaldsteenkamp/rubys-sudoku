// De app-bestanden van de service worker (SHELL in sw.js) en hun vingerafdruk.
// Gebruikt door `npm run release` en door tests/sw.test.js.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname;
const SW = join(ROOT, 'sw.js');

export const readSw = () => readFileSync(SW, 'utf8');

export function shellList(sw = readSw()) {
  const body = /const SHELL = \[([\s\S]*?)\];/.exec(sw)?.[1] ?? '';
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

export const version = (sw = readSw()) => /const VERSION = 'v(\d+)';/.exec(sw)?.[1];
export const recordedHash = (sw = readSw()) => /\/\/ SHELL-HASH: (\S+)/.exec(sw)?.[1];

// Eén hash over alle app-bestanden plus sw.js zelf (zonder de VERSION- en
// hash-regel). Regeleinden tellen niet mee, dus Windows of Mac maakt niets uit.
export function shellHash(sw = readSw()) {
  const h = createHash('sha256');
  const text = (s) => s.replace(/\r\n/g, '\n');
  h.update(text(sw).replace(/^const VERSION = .*$/m, '').replace(/^\/\/ SHELL-HASH: .*$/m, ''));
  for (const f of shellList(sw).filter((f) => f !== './').sort()) {
    const path = join(ROOT, f);
    h.update(`\0${f}\0`);
    if (!existsSync(path)) { h.update('ontbreekt'); continue; }
    const buf = readFileSync(path);
    h.update(/\.(html|js|css|svg|webmanifest)$/.test(f) ? text(buf.toString('utf8')) : buf);
  }
  return h.digest('hex').slice(0, 16);
}
