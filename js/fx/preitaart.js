// Preitaart (geheim): bij het oplossen wordt er een punt uit het bord "gesneden".
// Een kopie van het bord, bijgesneden tot een taartpunt, schuift even naar buiten
// en glijdt dan weer terug; eronder zie je zolang de vulling. Alleen transform en
// opacity, en niet met minder beweging. De rand van bladerdeeg en het preiringetje
// zijn gewoon CSS. Alleen geladen als Preitaart het thema is.

let timer = null;

export function solved({ board, reduced }) {
  if (reduced) return;
  const wrap = board.parentElement;
  wrap.querySelector('.taartpunt')?.remove();
  const copy = board.cloneNode(true);
  copy.removeAttribute('id');
  copy.removeAttribute('tabindex');
  copy.removeAttribute('role');
  copy.removeAttribute('aria-label');
  copy.classList.remove('solved-glow');
  for (const el of copy.querySelectorAll('[tabindex]')) el.removeAttribute('tabindex');
  const b = board.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  const piece = document.createElement('div');
  piece.className = 'taartpunt';
  piece.setAttribute('aria-hidden', 'true');
  piece.style.cssText = `left:${b.left - w.left}px;top:${b.top - w.top}px;width:${b.width}px;height:${b.height}px`;
  piece.innerHTML = '<div class="taart-gat"></div><div class="taart-stuk"></div>';
  piece.querySelector('.taart-stuk').append(copy);
  wrap.append(piece);
  clearTimeout(timer);
  timer = setTimeout(() => piece.remove(), 2400);
}

export function stop() {
  clearTimeout(timer);
  document.querySelector('.taartpunt')?.remove();
}
