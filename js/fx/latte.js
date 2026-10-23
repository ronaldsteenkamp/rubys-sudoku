// Koffiemonster: bij het oplossen tekent zich een latte-art-hartje in het
// midden van het bord. Alleen geladen als Koffiemonster het thema is.

// Een kopje crema van bovenaf, met een hartje van melkschuim erin.
const SVG = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <defs><radialGradient id="crema" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#c98b4f"/><stop offset="0.75" stop-color="#9a5f2e"/><stop offset="1" stop-color="#6f4527"/></radialGradient></defs>
  <circle cx="60" cy="60" r="56" fill="#fffaf3"/>
  <circle cx="60" cy="60" r="48" fill="url(#crema)"/>
  <path class="latte-fill" d="M60 92C46 80 28 68 28 50C28 39 36 32 45 32C52 32 57 36 60 42C63 36 68 32 75 32C84 32 92 39 92 50C92 68 74 80 60 92Z" fill="#fdf4e6"/>
  <path class="latte-line" d="M60 92C46 80 28 68 28 50C28 39 36 32 45 32C52 32 57 36 60 42C63 36 68 32 75 32C84 32 92 39 92 50C92 68 74 80 60 92Z" fill="none" stroke="#fdf4e6" stroke-width="4" stroke-linecap="round" pathLength="100"/>
  <path class="latte-line" d="M60 42C60 58 60 74 60 92" fill="none" stroke="#c98b4f" stroke-width="2" stroke-linecap="round" pathLength="100"/>
</svg>`;

let timer = null;

export function solved({ board, reduced }) {
  const wrap = board.parentElement;
  wrap.querySelector('.latte')?.remove();
  const el = document.createElement('div');
  el.className = `latte${reduced ? ' still' : ''}`;
  el.innerHTML = SVG;
  wrap.append(el);
  clearTimeout(timer);
  timer = setTimeout(() => el.remove(), 4200);
}

export function stop() {
  clearTimeout(timer);
  document.querySelector('.latte')?.remove();
}
