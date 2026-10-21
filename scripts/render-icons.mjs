// Zet de SVG-iconen om naar PNG (iOS wil een PNG voor het beginscherm).
// Gebruik: node scripts/render-icons.mjs   (vereist Playwright + Chromium)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../icons/', import.meta.url);
const jobs = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'maskable-512.png', 512],
  ['maskable.svg', 'apple-touch-icon.png', 180], // iOS rondt zelf de hoeken af
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, out, size] of jobs) {
  const svg = readFileSync(new URL(src, root), 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}`);
  await page.screenshot({ path: new URL(out, root).pathname, omitBackground: true });
}
await browser.close();
console.log('iconen klaar');
