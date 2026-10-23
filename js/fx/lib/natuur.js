// Gedeeld door de natuurthema's (Waddenzee, Bos, Noorderlicht, Regenachtige dag,
// Onderwater). Alleen geladen als een van die thema's te zien is.
//
// - Een effectlaag achter alles (druppels, belletjes, licht): nooit over het bord
//   of de knoppen, en nooit klikbaar.
// - Alles beweegt met CSS (alleen transform en opacity). Is de app niet in beeld,
//   dan staat alles stil (html.fx-paused); in de slaapstand op half tempo (zie
//   --fx-tempo in style.css); met prefers-reduced-motion helemaal stil.
// - Dieren (zeehondje, eekhoorntje) komen af en toe om de hoek kijken, op een plek
//   waar geen knop of bord is. Met ?dier=1 meteen (om te testen en voor screenshots).

const html = () => document.documentElement;
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const sleeping = () => html().dataset.sleep === '1';
export const forcedAnimal = () => new URLSearchParams(location.search).get('dier') === '1';

// Een vaste reeks "willekeurige" getallen, zodat de laag er elke keer hetzelfde (en mooi) uitziet.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- De effectlaag ----------

const onVisibility = () => html().classList.toggle('fx-paused', document.visibilityState !== 'visible');

// Maakt de laag (achter alles, z-index -1 in body) met `inner` erin. Staat hij er
// al (het thema wordt opnieuw toegepast), dan blijft hij gewoon doorlopen.
export function createLayer(name, inner) {
  const old = document.querySelector('.fx-layer');
  if (old?.classList.contains(`fx-${name}`)) return old;
  removeLayer();
  const el = document.createElement('div');
  el.className = `fx-layer fx-${name}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = inner;
  document.body.append(el);
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();
  return el;
}

export function removeLayer() {
  document.querySelector('.fx-layer')?.remove();
  document.querySelector('.fx-over')?.remove();
  document.removeEventListener('visibilitychange', onVisibility);
  html().classList.remove('fx-paused');
}

// Een losse laag óver alles (voor even: vallende blaadjes, een visje), nooit klikbaar.
export function overlay(name, inner, ms) {
  document.querySelector(`.fx-over.fx-${name}`)?.remove();
  const el = document.createElement('div');
  el.className = `fx-over fx-${name}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = inner;
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
  return el;
}

// ---------- Dieren ----------

// Wat een dier nooit mag bedekken.
const BUSY = 'button, a, input, label, select, textarea, dialog[open], .board, .cell, .card, .level, .nav-btn, .num, .tool, .brand, .hint-card, .toast, .install-banner, .sunflower, [role="button"]';

// Staat er op (x, y) echt tekst (niet alleen het lege stuk van een kopje)?
function onText(x, y) {
  return document.elementsFromPoint(x, y).some((el) => {
    if (!el.matches('h1, h2, h3, p, .card-title, .card-meta, .card-kicker')) return false;
    const range = document.createRange();
    range.selectNodeContents(el);
    return [...range.getClientRects()].some((r) => x >= r.left - 4 && x <= r.right + 4 && y >= r.top - 4 && y <= r.bottom + 4);
  });
}

// Zoekt een plek aan de linker- of rechterrand waar het zichtbare stuk van een dier
// (`w` × `h` px) niets bedekt waar je op kunt tikken. Liefst ook geen tekst; lukt
// dat nergens, dan mag hij wel even over een stukje tekst. Geeft { side, top } of null.
export function safeSpot(w, h, rng = Math.random) {
  const vw = innerWidth, vh = innerHeight;
  const spots = [];
  for (const side of ['left', 'right']) {
    for (let top = Math.round(vh * 0.12); top + h < vh * 0.92; top += 16) spots.push({ side, top });
  }
  for (let k = spots.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [spots[k], spots[j]] = [spots[j], spots[k]]; }
  const free = ({ side, top }, text) => {
    // Met een randje van 6 px erbij, zodat hij ook niet tegen een knop of het bord aan zit.
    for (let x = 1; x <= w + 6; x += Math.max(4, w / 6)) {
      for (let y = top - 6; y <= top + h + 6; y += Math.max(4, h / 6)) {
        const px = side === 'left' ? x : vw - x;
        if (document.elementsFromPoint(px, y).some((el) => el.matches(BUSY) || el.closest(BUSY))) return false;
        if (text && onText(px, y)) return false;
      }
    }
    return true;
  };
  return spots.find((s) => free(s, true)) || spots.find((s) => free(s, false)) || null;
}

// Laat af en toe een dier zien: de eerste keer na `first` ms (ongeveer), daarna
// hooguit één keer per `every` ms (willekeurig tussen every en 2 × every). Niet
// in de slaapstand, niet met minder beweging en niet als de app niet in beeld is.
// `show()` geeft true als het dier er echt kwam (er was een veilige plek).
export function animalTimer(show, { first = 70000, every = 150000 } = {}) {
  let timer = null;
  const forced = forcedAnimal();
  const plan = (ms) => { clearTimeout(timer); timer = setTimeout(tick, ms); };
  const tick = () => {
    const ok = !reducedMotion() && (forced || (!sleeping() && document.visibilityState === 'visible')) && show(forced);
    // Lukte het niet (geen plek, slaapstand…), dan over een halve minuut nog eens.
    plan(forced ? 8000 : ok ? every * (1 + Math.random()) : 30000);
  };
  plan(forced ? 400 : first * (0.6 + Math.random() * 0.8));
  return () => clearTimeout(timer);
}

// Zet een dier (svg) aan de rand: het schuift naar binnen, blijft `stay` ms en
// duikt weer weg. `onTap` (optioneel) bij een tik op het dier. Geeft het element.
export function peek(name, svg, { w, h, stay = 4000, onTap = null, forced = false }) {
  if (document.querySelector('.fx-animal')) return null;
  const spot = safeSpot(w, h);
  if (!spot) return null;
  const el = document.createElement(onTap ? 'button' : 'div');
  if (onTap) { el.type = 'button'; el.setAttribute('aria-label', `Een ${name}`); el.addEventListener('click', () => onTap(el)); }
  else el.setAttribute('aria-hidden', 'true');
  el.className = `fx-animal fx-${name} from-${spot.side}`;
  el.style.top = `${spot.top}px`;
  el.style.setProperty('--w', `${w}px`);
  el.style.setProperty('--h', `${h}px`);
  el.innerHTML = svg;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  // Scrolt ze of tikt ze ergens anders (een ander scherm, een dialoog), dan schrikt
  // hij en duikt weg: zo kan er nooit iets klikbaars onder hem komen te liggen.
  const away = (e) => { if (!el.contains(e.target)) leave(el); };
  addEventListener('scroll', () => leave(el), { once: true, passive: true });
  document.addEventListener('pointerdown', away, { capture: true, passive: true });
  el.cleanup = () => document.removeEventListener('pointerdown', away, { capture: true });
  if (!forced) setTimeout(() => leave(el), stay);
  return el;
}

export function leave(el) {
  if (!el?.isConnected || el.classList.contains('weg')) return;
  el.classList.add('weg');
  el.cleanup?.();
  el.classList.remove('in');
  setTimeout(() => el.remove(), 900);
}

export function removeAnimal() {
  const el = document.querySelector('.fx-animal');
  el?.cleanup?.();
  el?.remove();
}
