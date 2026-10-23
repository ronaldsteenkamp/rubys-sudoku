import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGrid } from '../js/solver.js';
import { Game } from '../js/game.js';
import { getHint } from '../js/hints.js';
import { TECHNIQUES } from '../js/techniques.js';
import { TECHNIQUE_IDS, TECHNIQUE_TEXT, BOOK, discoverFromHint, discoverTechnique, lockedHint, knownCount, unseen, cleanTechniques } from '../js/boekje.js';
import { EXAMPLES } from '../js/boekje-voorbeelden.js';
import { MILESTONES, newMilestones } from '../js/messages.js';
import * as S from '../js/storage.js';
import { EASY, EASY_SOLUTION } from './fixtures.js';

const rng = () => 0.1;
const stepHint = () => getHint(new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION) }), rng);

test('ontdekken: stap 1 van een hint telt niet, stap 2 wel', () => {
  const st = S.emptyStats();
  const h = stepHint();
  assert.equal(h.kind, 'step');
  assert.ok(TECHNIQUES[h.id], `de hint zegt welke techniek: ${h.id}`);
  assert.equal(discoverFromHint(st, h, 0, '2026-10-23'), null, 'stap 1: alleen waar ze moet kijken');
  assert.deepEqual(st.techniques, {});
  assert.deepEqual(discoverFromHint(st, h, 1, '2026-10-23'), { id: h.id, fresh: true });
  assert.deepEqual(st.techniques, { [h.id]: { since: '2026-10-23', hints: 1 } });
  assert.equal(discoverFromHint(st, h, 2, '2026-10-23'), null, 'stap 3 telt niet nog eens');
  assert.equal(st.techniques[h.id].hints, 1);
});

test('dezelfde techniek nog eens via een hint: teller omhoog, datum blijft', () => {
  const st = S.emptyStats();
  assert.equal(discoverTechnique(st, 'x-wing', '2026-10-23'), true);
  assert.equal(discoverTechnique(st, 'x-wing', '2026-11-02'), false);
  assert.equal(discoverTechnique(st, 'x-wing', '2026-12-01'), false);
  assert.deepEqual(st.techniques['x-wing'], { since: '2026-10-23', hints: 3 });
});

test('Foutje, Notitie en Cadeautje zijn geen techniek', () => {
  const st = S.emptyStats();
  const g = new Game({ givens: parseGrid(EASY), solution: parseGrid(EASY_SOLUTION) });
  const empty = g.values.findIndex((v) => !v);
  g.setDigit(empty, (g.solution[empty] % 9) + 1);
  const mistake = getHint(g, rng);
  assert.equal(mistake.kind, 'mistake');
  for (const hint of [mistake, { kind: 'notes', technique: 'Notitie' }, { kind: 'reveal', technique: 'Cadeautje' }]) {
    assert.equal(discoverFromHint(st, hint, 1, '2026-10-23'), null, hint.technique);
  }
  assert.equal(discoverTechnique(st, 'bestaat-niet', '2026-10-23'), false);
  assert.deepEqual(st.techniques, {});
});

test('een techniek uit een puzzel die ze zelf oplost, telt niet', () => {
  const st = S.emptyStats();
  S.recordSolve(st, { levelId: 'ruby', elapsed: 1000, hints: 0, started: '2026-10-23', hour: 9 }, '2026-10-23');
  assert.deepEqual(st.techniques, {});
});

test('oude opslag zonder stats.techniques werkt gewoon (leeg boekje), kapotte gegevens worden netjes', () => {
  const old = S.migrateStats({ totalSolved: 12, levels: {} });
  assert.deepEqual(old.techniques, {});
  assert.equal(knownCount(old), 0);
  assert.deepEqual(unseen(old, []), []);
  assert.deepEqual(cleanTechniques({
    'x-wing': { since: '2026-10-23', hints: 2 }, pointing: { since: 'gisteren', hints: 1 }, 'naked-pair': { since: '2026-10-01', hints: -4 },
    onzin: { since: '2026-10-01', hints: 1 }, swordfish: 'ja',
  }), { 'x-wing': { since: '2026-10-23', hints: 2 }, 'naked-pair': { since: '2026-10-01', hints: 1 } });
  assert.deepEqual(cleanTechniques([1, 2]), {});
});

test('back-up heen en terug: het boekje gaat mee', () => {
  const stats = { ...S.emptyStats(), totalSolved: 3, techniques: { 'x-wing': { since: '2026-10-23', hints: 2 }, 'full-house': { since: '2026-10-01', hints: 7 } } };
  const backup = JSON.parse(JSON.stringify(S.makeBackup({ settings: { theme: 'zonnig' }, stats, unlocked: [], recentNotes: [], game: null })));
  const res = S.validateBackup(backup);
  assert.equal(res.ok, true);
  assert.deepEqual(res.data.stats.techniques, stats.techniques);
  // Een oude back-up zonder boekje is ook goed.
  const oldBackup = { ...backup, data: { ...backup.data, stats: { totalSolved: 3, levels: {} } } };
  assert.deepEqual(S.validateBackup(oldBackup).data.stats.techniques, {});
});

test('vergrendeld: het hintje noemt het niveau waar de techniek voor het eerst nodig is', () => {
  assert.equal(lockedHint('full-house'), 'Vraag eens om een hint in Zondagochtend');
  assert.equal(lockedHint('pointing'), 'Vraag eens om een hint in Koffie erbij');
  assert.equal(lockedHint('x-wing'), 'Vraag eens om een hint in Even nadenken');
  assert.equal(lockedHint('swordfish'), 'Vraag eens om een hint in Ruby-modus 🔥');
  for (const id of TECHNIQUE_IDS) {
    const level = ['Zondagochtend', 'Koffie erbij', 'Even nadenken', 'Ruby-modus'][TECHNIQUES[id].level - 1];
    assert.ok(lockedHint(id).includes(level), id);
    // Niets verklappen: geen naam of uitleg in het hintje.
    assert.ok(!lockedHint(id).includes(TECHNIQUES[id].name), id);
  }
});

test('het boekje: per niveau, alle 13 technieken, elk met een uitleg van 2–3 zinnen en een voorbeeld', () => {
  assert.equal(TECHNIQUE_IDS.length, 13);
  assert.deepEqual(BOOK.map((b) => b.level.emoji), ['☀️', '☕', '🤔', '🔥']);
  assert.deepEqual(BOOK.flatMap((b) => b.ids).sort(), [...TECHNIQUE_IDS].sort());
  for (const id of TECHNIQUE_IDS) {
    const sentences = TECHNIQUE_TEXT[id].split(/(?<=[.!?])\s+/).length;
    assert.ok(sentences >= 2 && sentences <= 3, `${id}: ${sentences} zinnen`);
    assert.ok(!/\b(fout|langzaam)/i.test(TECHNIQUE_TEXT[id]), id);
  }
});

test('elk voorbeeld klopt: een uitsnede met het gebied, de vakjes en de kandidaten van een echte stap', () => {
  for (const id of TECHNIQUE_IDS) {
    const ex = EXAMPLES[id];
    assert.ok(ex, id);
    const [r0, r1] = ex.rows, [c0, c1] = ex.cols;
    const inside = (i) => Math.floor(i / 9) >= r0 && Math.floor(i / 9) <= r1 && i % 9 >= c0 && i % 9 <= c1;
    const at = (i) => (Math.floor(i / 9) - r0) * (c1 - c0 + 1) + (i % 9 - c0);
    assert.equal(ex.cells.length, (r1 - r0 + 1) * (c1 - c0 + 1), id);
    assert.equal(ex.notes.length, ex.cells.length, id);
    assert.ok(ex.focus.length && ex.focus.every(inside), `${id}: de belangrijke vakjes staan erin`);
    assert.ok(ex.strike.every(([c]) => inside(c)), `${id}: wat weg mag staat erin`);
    // Wat weg mag, is echt een kandidaat in dat lege vakje.
    for (const [c, d] of ex.strike) assert.ok(ex.notes[at(c)] & (1 << (d - 1)), `${id}: ${d} in vakje ${c}`);
    // Technieken die iets wegstrepen hebben iets weg te strepen; de andere vullen een leeg vakje.
    if (TECHNIQUES[id].level >= 2) assert.ok(ex.strike.length > 0, id);
    else assert.equal(ex.cells[at(ex.focus[0])], 0, `${id}: het vakje is nog leeg`);
  }
});

test('mijlpaal: het hele boekje, pas bij alle 13', () => {
  const m = MILESTONES.find((x) => x.id === 'boekje');
  assert.deepEqual([m.title, m.icon], ['Het hele boekje', '📖']);
  assert.ok(m.text.length > 40 && !/hou van je/i.test(m.text));
  const st = S.emptyStats();
  for (const id of TECHNIQUE_IDS.slice(0, 12)) discoverTechnique(st, id, '2026-10-23');
  assert.ok(!newMilestones(st, []).some((x) => x.id === 'boekje'));
  discoverTechnique(st, TECHNIQUE_IDS[12], '2026-10-24');
  assert.ok(newMilestones(st, []).some((x) => x.id === 'boekje'));
});

test('het stipje: wat ontdekt is maar nog niet gezien', () => {
  const st = S.emptyStats();
  discoverTechnique(st, 'x-wing', '2026-10-23');
  discoverTechnique(st, 'pointing', '2026-10-23');
  assert.deepEqual(unseen(st, []), ['pointing', 'x-wing']);
  assert.deepEqual(unseen(st, ['pointing']), ['x-wing']);
  assert.deepEqual(unseen(st, ['pointing', 'x-wing']), []);
});
