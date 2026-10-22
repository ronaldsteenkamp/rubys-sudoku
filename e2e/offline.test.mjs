// Service worker: offline, storingen en updates die pas na een tik binnenkomen.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { open, shutdown } from './helpers.mjs';
import { serve, ROOT } from '../scripts/static-server.mjs';

// Een eigen kopie van de app, zodat we er een 'nieuwe versie' van kunnen maken.
let root, server, base, outage = false, offline = false;
before(async () => {
  root = await mkdtemp(join(tmpdir(), 'rs-app-'));
  const from = process.env.APP_ROOT || ROOT;
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'js', 'css', 'fonts', 'hand', 'icons', 'scripts']) await cp(join(from, f), join(root, f), { recursive: true });
  ({ server, base } = await serve({ root, respond: (path) => {
    if (offline) return 'offline';
    return outage && !path.endsWith('sw.js') ? { status: 503, body: '<title>GitHub fout</title>' } : null;
  } }));
});
after(async () => { await shutdown(); server.close(); });

// Geen internet: zowel de pagina als de service worker kunnen niets ophalen.
async function goOffline(page) {
  offline = true;
  await page.context().setOffline(true);
}

// Wacht tot de service worker de pagina bedient.
beforeEach(() => { offline = false; outage = false; });

async function controlled(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.waitForSelector('#levels .level');
}

test('offline: de app start en een puzzel begint gewoon', async () => {
  const page = await open(base, { serviceWorkers: 'allow' });
  await controlled(page);
  await goOffline(page);
  await page.reload();
  await page.waitForSelector('#levels .level');
  await page.click('#levels .level[data-level="zondag"]');
  await page.waitForSelector('#play:not([hidden])');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('een storing bij GitHub Pages (503) toont toch gewoon de app', async () => {
  const page = await open(base, { serviceWorkers: 'allow' });
  await controlled(page);
  outage = true;
  try {
    await page.reload();
    await page.waitForSelector('#levels .level');
    assert.equal(await page.locator('#levels .level').count(), 4);
  } finally { outage = false; }
  await page.context().close();
});

test('een andere pagina in de map vervangt de bewaarde app niet', async () => {
  const page = await open(base, { serviceWorkers: 'allow' });
  await controlled(page);
  await page.goto(base + 'scripts/gitaar.html');
  await goOffline(page);
  await page.goto(base);
  await page.waitForSelector('#levels .level');
  await page.context().close();
});

test('een nieuwe versie komt pas binnen na een tik op het kaartje, en dan helemaal', async () => {
  const page = await open(base, { serviceWorkers: 'allow' });
  await controlled(page);
  // Nieuwe release: andere VERSION, en een nieuwe regel in ui.js én index.html.
  const sw = await readFile(join(root, 'sw.js'), 'utf8');
  const ui = await readFile(join(root, 'js/ui.js'), 'utf8');
  const html = await readFile(join(root, 'index.html'), 'utf8');
  try {
    await writeFile(join(root, 'sw.js'), sw.replace(/const VERSION = 'v(\d+)'/, (_, n) => `const VERSION = 'v${Number(n) + 100}'`));
    await writeFile(join(root, 'js/ui.js'), `${ui}\ndocument.documentElement.dataset.versie = 'nieuw';\n`);
    await writeFile(join(root, 'index.html'), html.replace('<body', '<body data-html="nieuw"'));

    // Herladen (ook twee keer): nog steeds helemaal de oude versie, met het kaartje.
    for (let k = 0; k < 2; k++) {
      await page.reload();
      await page.waitForSelector('#levels .level');
      assert.equal(await page.evaluate(() => document.documentElement.dataset.versie ?? null), null, 'nieuwe JS mag nog niet draaien');
      assert.equal(await page.evaluate(() => document.body.dataset.html ?? null), null, 'nieuwe HTML mag nog niet getoond worden');
    }
    await page.waitForSelector('#update-slot .card', { timeout: 10000 });
    await Promise.all([page.waitForEvent('load'), page.click('#update-slot .card')]);
    await page.waitForSelector('#levels .level');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.versie), 'nieuw');
    assert.equal(await page.evaluate(() => document.body.dataset.html), 'nieuw');
  } finally {
    await writeFile(join(root, 'sw.js'), sw);
    await writeFile(join(root, 'js/ui.js'), ui);
    await writeFile(join(root, 'index.html'), html);
  }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
