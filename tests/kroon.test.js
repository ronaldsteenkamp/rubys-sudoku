import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROWN_LEVELS, crownLevel, nextCrown, crownSvg, crownCountFromLog, crownToCelebrate, markCrownShown, countsForCrown } from '../js/kroon.js';
import { KROON_BERICHTJES } from '../js/kroon-berichtjes.js';
import { emptyStats, migrateStats, recordSolve, makeBackup, validateBackup } from '../js/storage.js';

const solve = (stats, levelId, hints, today = '2026-12-02') => recordSolve(stats, { levelId, elapsed: 600000, hints, daily: null, special: null, started: today, hour: 20 }, today);

test('niveaus: 1× brons, 5× zilver, 15× goud, 33× de Robijnen Kroon (net wel en net niet)', () => {
  assert.deepEqual(CROWN_LEVELS.map((l) => [l.id, l.at]), [['brons', 1], ['zilver', 5], ['goud', 15], ['kroon', 33]]);
  assert.deepEqual([0, 1, 4, 5, 14, 15, 32, 33, 100].map(crownLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

test('hoeveel er nog nodig zijn voor het volgende niveau', () => {
  assert.deepEqual([0, 1, 4, 14, 32].map((n) => [nextCrown(n).id, nextCrown(n).left]),
    [['brons', 1], ['zilver', 4], ['zilver', 1], ['goud', 1], ['kroon', 1]]);
  assert.equal(nextCrown(33), null);
});

test('alleen Ruby-modus zonder één hint telt mee', () => {
  const s = emptyStats();
  solve(s, 'ruby', 0);
  assert.equal(s.rubyNoHintSolved, 1);
  solve(s, 'ruby', 1);
  solve(s, 'ruby', 3);
  solve(s, 'nadenken', 0);
  solve(s, 'zondag', 0);
  assert.equal(s.rubyNoHintSolved, 1);
  assert.equal(countsForCrown('ruby', 0), true);
  assert.equal(countsForCrown('ruby', 1), false);
  // Een dagpuzzel die al eens is opgelost telt niet nog een keer.
  const d = emptyStats();
  recordSolve(d, { levelId: 'ruby', elapsed: 1, hints: 0, daily: '2026-12-02', started: '2026-12-02' }, '2026-12-02');
  recordSolve(d, { levelId: 'ruby', elapsed: 1, hints: 0, daily: '2026-12-02', started: '2026-12-02' }, '2026-12-02');
  assert.equal(d.rubyNoHintSolved, 1);
});

test('bestaande voortgang: oude opslag zonder teller krijgt de hintloze Ruby-puzzels uit het logboek', () => {
  const log = [
    ['2026-10-22', 'ruby', 900, 0, 0],
    ['2026-10-23', 'ruby', 900, 2, 0],
    ['2026-10-24', 'koffie', 300, 0, 0],
    ['2026-10-25', 'ruby', 800, 0, 2, null, 21],
    ['2026-10-26', null, null, null, 1], // oude dagpuzzel: hints onbekend, telt niet
  ];
  assert.equal(crownCountFromLog(log), 2);
  const s = migrateStats({ totalSolved: 5, levels: {}, log });
  assert.equal(s.rubyNoHintSolved, 2);
  assert.equal(s.crownShown, 0);
  assert.equal(crownToCelebrate(s), 1, 'brons wordt één keer gevierd');
  // Staat de teller er al, dan blijft hij zoals hij is (ook als het logboek korter is).
  assert.equal(migrateStats({ rubyNoHintSolved: 40, crownShown: 4, log }).rubyNoHintSolved, 40);
  // Rommel wordt netjes.
  const bad = migrateStats({ rubyNoHintSolved: -3, crownShown: 99 });
  assert.equal(bad.rubyNoHintSolved, 0);
  assert.equal(bad.crownShown, 4);
  assert.equal(migrateStats({ rubyNoHintSolved: 'x' }).rubyNoHintSolved, 0);
  // Niets anders aan de oude opslag verandert.
  assert.equal(s.totalSolved, 5);
  assert.equal(s.log.length, 5);
});

test('de teller en het gevierde niveau gaan mee in de back-up', () => {
  const stats = { ...emptyStats(), rubyNoHintSolved: 16, crownShown: 3 };
  const res = validateBackup(JSON.parse(JSON.stringify(makeBackup({ settings: {}, stats, unlocked: [], recentNotes: [], game: null }))));
  assert.ok(res.ok);
  assert.equal(res.data.stats.rubyNoHintSolved, 16);
  assert.equal(res.data.stats.crownShown, 3);
});

test('elk niveau wordt één keer gevierd, en bij een sprong alleen het hoogste', () => {
  const s = emptyStats();
  assert.equal(crownToCelebrate(s), 0);
  solve(s, 'ruby', 0);
  assert.equal(crownToCelebrate(s), 1);
  markCrownShown(s, 1);
  assert.equal(crownToCelebrate(s), 0);
  for (let k = 0; k < 3; k++) solve(s, 'ruby', 0);
  assert.equal(crownToCelebrate(s), 0, '4×: nog geen zilver');
  solve(s, 'ruby', 0);
  assert.equal(crownToCelebrate(s), 2, '5×: zilver');
  s.rubyNoHintSolved = 33;
  assert.equal(crownToCelebrate(s), 4, 'van zilver naar 33: alleen de kroon');
  markCrownShown(s, 4);
  markCrownShown(s, 2);
  assert.equal(s.crownShown, 4, 'nooit terug naar lager');
});

test('de trofee als SVG: meer glans per niveau, 33 op de kroon, grijs silhouet', () => {
  const svg = [1, 2, 3, 4].map((l) => crownSvg(l));
  for (const x of svg) assert.match(x, /^<svg class="crown-svg lvl-\d"/);
  assert.ok(!svg[0].includes('crown-shine') && !svg[0].includes('crown-twinkle'), 'brons is dof');
  assert.ok(svg[1].includes('crown-shine') && !svg[1].includes('crown-twinkle'), 'zilver glanst');
  assert.ok(svg[2].includes('crown-twinkle') && !svg[2].includes('crown-rays'), 'goud fonkelt');
  assert.ok(svg[3].includes('crown-rays') && svg[3].includes('>33</text>'), 'de kroon: stralen en 33');
  const count = (x) => (x.match(/crown-twinkle/g) || []).length;
  assert.ok(count(svg[3]) > count(svg[2]));
  const sil = crownSvg(3, { silhouette: true });
  assert.match(sil, /silhouette/);
  assert.ok(!/#[0-9a-f]{6}/i.test(sil), 'een silhouet heeft geen eigen kleuren');
  assert.match(crownSvg(2, { label: 'Zilver' }), /role="img" aria-label="Zilver"/);
});

test('kroon-berichtjes.js: elk niveau heeft een titel, een bericht en een knop', () => {
  assert.deepEqual(Object.keys(KROON_BERICHTJES), CROWN_LEVELS.map((l) => l.id));
  for (const [id, t] of Object.entries(KROON_BERICHTJES)) {
    for (const k of ['titel', 'bericht', 'knop']) assert.ok(typeof t[k] === 'string' && t[k].trim(), `${id}.${k}`);
  }
  assert.equal(KROON_BERICHTJES.brons.titel, 'Eerste keer zonder hulp!');
});
