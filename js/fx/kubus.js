// RubyxCube: bij het oplossen draait het bord kort als een kubus.
// Alleen geladen als RubyxCube het thema is (zie loadFx in ui.js).

export function solved({ board, reduced }) {
  if (reduced) return;
  board.classList.remove('cube-turn');
  void board.offsetWidth; // opnieuw beginnen als hij nog draaide
  board.classList.add('cube-turn');
  setTimeout(() => board.classList.remove('cube-turn'), 1400);
}
