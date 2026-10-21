// Spelstatus zonder DOM: cijfers, notities, undo/redo en controle.
// Notities zijn bitmaskers per vakje (bit 0 = cijfer 1).

import { PEERS, bit, digitsOf } from './solver.js';
import { computeCandidates } from './techniques.js';

export class Game {
  constructor({ givens, solution, levelId = 'zondag', daily = null, special = null, shape = null, id = null }) {
    this.id = id || `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    this.givens = givens.slice();
    this.solution = solution.slice();
    this.levelId = levelId;
    this.daily = daily;
    this.special = special;
    this.shape = shape;
    this.values = givens.slice();
    this.notes = new Array(81).fill(0);
    this.history = [];
    this.future = [];
    this.elapsed = 0;
    this.mistakes = 0;
    this.hints = 0;
    this.solved = false;
    this.startedAt = Date.now();
  }

  isGiven(i) { return this.givens[i] !== 0; }
  isWrong(i) { return this.values[i] !== 0 && this.values[i] !== this.solution[i]; }
  isSolved() { return this.values.every((v, i) => v === this.solution[i]); }

  // Vakjes in rij/kolom/blok met hetzelfde cijfer: echte regelovertredingen.
  conflicts(i) {
    const v = this.values[i];
    return v ? PEERS[i].filter((p) => this.values[p] === v) : [];
  }

  // Hoe vaak elk cijfer al op het bord staat (index 1..9).
  counts() {
    const c = new Array(10).fill(0);
    for (const v of this.values) if (v) c[v]++;
    return c;
  }

  // ---- wijzigingen, altijd via een "commit" zodat undo/redo werkt ----

  #commit(changes) {
    const real = changes.filter((ch) => ch.from.v !== ch.to.v || ch.from.n !== ch.to.n);
    if (!real.length || this.solved) return false;
    for (const ch of real) { this.values[ch.cell] = ch.to.v; this.notes[ch.cell] = ch.to.n; }
    this.history.push(real);
    if (this.history.length > 500) this.history.shift();
    this.future = [];
    return true;
  }

  #state(i) { return { v: this.values[i], n: this.notes[i] }; }

  // Zet een cijfer. Nogmaals hetzelfde cijfer kiezen haalt het weer weg.
  setDigit(i, d, { autoNotes = true } = {}) {
    if (this.isGiven(i) || this.solved) return { changed: false };
    const removing = this.values[i] === d;
    const changes = [{ cell: i, from: this.#state(i), to: { v: removing ? 0 : d, n: 0 } }];
    if (!removing && autoNotes) {
      for (const p of PEERS[i]) {
        if (this.notes[p] & bit(d)) changes.push({ cell: p, from: this.#state(p), to: { v: this.values[p], n: this.notes[p] & ~bit(d) } });
      }
    }
    const changed = this.#commit(changes);
    const wrong = changed && !removing && d !== this.solution[i];
    if (wrong) this.mistakes++;
    if (changed && !removing && this.isSolved()) this.solved = true;
    return { changed, wrong, removed: removing, solved: this.solved };
  }

  toggleNote(i, d) {
    if (this.isGiven(i) || this.values[i] || this.solved) return { changed: false };
    const changed = this.#commit([{ cell: i, from: this.#state(i), to: { v: 0, n: this.notes[i] ^ bit(d) } }]);
    return { changed };
  }

  erase(i) {
    if (this.isGiven(i)) return { changed: false };
    return { changed: this.#commit([{ cell: i, from: this.#state(i), to: { v: 0, n: 0 } }]) };
  }

  // "Busywork" weghalen: alle mogelijke kandidaten in één keer als notitie.
  fillNotes() {
    const cands = computeCandidates(this.values);
    const changes = [];
    for (let i = 0; i < 81; i++) {
      if (!this.values[i]) changes.push({ cell: i, from: this.#state(i), to: { v: 0, n: cands[i] } });
    }
    return { changed: this.#commit(changes) };
  }

  removeNotes(eliminations) {
    const changes = new Map();
    for (const { cell, digit } of eliminations) {
      if (!(this.notes[cell] & bit(digit))) continue;
      const ch = changes.get(cell) || { cell, from: this.#state(cell), to: this.#state(cell) };
      ch.to = { v: ch.to.v, n: ch.to.n & ~bit(digit) };
      changes.set(cell, ch);
    }
    return { changed: this.#commit([...changes.values()]) };
  }

  addNote(cell, digit) {
    if (this.values[cell] || this.notes[cell] & bit(digit)) return { changed: false };
    return { changed: this.#commit([{ cell, from: this.#state(cell), to: { v: 0, n: this.notes[cell] | bit(digit) } }]) };
  }

  undo() {
    const last = this.history.pop();
    if (!last) return null;
    for (const ch of last) { this.values[ch.cell] = ch.from.v; this.notes[ch.cell] = ch.from.n; }
    this.future.push(last);
    return last;
  }

  redo() {
    const next = this.future.pop();
    if (!next) return null;
    for (const ch of next) { this.values[ch.cell] = ch.to.v; this.notes[ch.cell] = ch.to.n; }
    this.history.push(next);
    if (this.isSolved()) this.solved = true;
    return next;
  }

  reset() {
    this.values = this.givens.slice();
    this.notes = new Array(81).fill(0);
    this.history = [];
    this.future = [];
    this.solved = false;
  }

  noteDigits(i) { return digitsOf(this.notes[i]); }

  toJSON() {
    const { id, givens, solution, levelId, daily, special, shape, values, notes, elapsed, mistakes, hints, solved, startedAt } = this;
    return { v: 1, id, givens, solution, levelId, daily, special, shape, values, notes, elapsed, mistakes, hints, solved, startedAt };
  }

  static fromJSON(data) {
    if (!data || data.v !== 1 || data.givens?.length !== 81) return null;
    const g = new Game(data);
    for (const k of ['values', 'notes']) if (data[k]?.length === 81) g[k] = data[k].slice();
    for (const k of ['elapsed', 'mistakes', 'hints', 'startedAt']) if (typeof data[k] === 'number') g[k] = data[k];
    g.solved = Boolean(data.solved);
    return g;
  }
}
