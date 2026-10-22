// Een kleine webserver voor de app, voor de screenshots en de e2e-tests.
// Serveert de repo onder `prefix` (standaard '/rubys-sudoku/', net als GitHub Pages).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

export const ROOT = new URL('..', import.meta.url).pathname;

// `respond(path)` kan een eigen antwoord geven ({ status, body }), bijvoorbeeld een storing nadoen.
export async function serve({ root = ROOT, prefix = '/rubys-sudoku/', respond = () => null } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    let path = normalize(decodeURIComponent(url.pathname.slice(prefix.length))).replace(/^\/+/, '');
    if (path === '.' || path === '') path = 'index.html';
    else if (path.endsWith('/')) path += 'index.html';
    const own = respond(path);
    if (own) { res.writeHead(own.status, { 'content-type': 'text/html' }); res.end(own.body || ''); return; }
    try {
      const body = await readFile(join(root, path));
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  // 'localhost' telt als veilige omgeving, dus de service worker werkt ook.
  return { server, base: `http://localhost:${server.address().port}${prefix}` };
}
