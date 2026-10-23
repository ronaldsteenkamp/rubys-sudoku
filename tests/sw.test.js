import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readSw, shellList, shellHash, recordedHash, version } from '../scripts/shell.mjs';

const sw = readSw();
const shell = shellList(sw);
const list = (dir, re) => readdirSync(join(ROOT, dir)).filter((f) => re.test(f)).map((f) => `${dir}/${f}`);

test('elk bestand in SHELL bestaat', () => {
  assert.ok(shell.length > 20);
  for (const f of shell) if (f !== './') assert.ok(existsSync(join(ROOT, f)), `${f} staat in SHELL maar bestaat niet`);
});

test('elk bestand dat de app gebruikt staat in SHELL (anders werkt het offline niet)', () => {
  const needed = [
    'index.html', 'manifest.webmanifest',
    ...list('js', /\.js$/), ...list('js/fx', /\.js$/), ...list('css', /\.css$/), ...list('fonts', /\.woff2$/), ...list('hand', /\.svg$/),
  ];
  // Alles waar index.html, de css en het manifest naar verwijzen.
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) needed.push(m[1]);
  for (const f of list('css', /\.css$/)) {
    for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/url\(["']?\.\.\/([^)"']+)["']?\)/g)) needed.push(m[1]);
  }
  for (const icon of JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8')).icons) needed.push(icon.src);
  for (const f of new Set(needed)) assert.ok(shell.includes(f), `${f} ontbreekt in SHELL in sw.js`);
});

test('na een wijziging aan de app is er een nieuwe release gemaakt (npm run release)', () => {
  assert.ok(version(sw), 'VERSION niet gevonden in sw.js');
  assert.equal(recordedHash(sw), shellHash(sw),
    'De app-bestanden zijn veranderd zonder nieuwe VERSION. Draai `npm run release` en commit sw.js mee.');
});
