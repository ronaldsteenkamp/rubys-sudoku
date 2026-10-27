// Onzichtbare inkt (geheim): bij het oplossen gaat het uv-licht over het hele bord
// en verschijnt in uv-gloed het handgeschreven "Ik vind je heel leuk!"
// (hand/ik-vind-je-heel-leuk.svg). Het lampje rond het gekozen vakje is gewoon CSS.
// Niet met minder beweging. Alleen geladen als Onzichtbare inkt het thema is.

let timer = null;

export function solved({ board, reduced }) {
  if (reduced) return;
  const wrap = board.parentElement;
  wrap.querySelector('.uv-briefje')?.remove();
  board.classList.add('uv-vol');
  const note = document.createElement('div');
  note.className = 'uv-briefje';
  note.innerHTML = '<span class="hand-art" role="img" aria-label="Ik vind je heel leuk!"></span>';
  wrap.append(note);
  clearTimeout(timer);
  timer = setTimeout(() => { board.classList.remove('uv-vol'); note.remove(); }, 5200);
}

export function stop() {
  clearTimeout(timer);
  document.querySelector('.uv-briefje')?.remove();
  document.querySelector('#board')?.classList.remove('uv-vol');
}
