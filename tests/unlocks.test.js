import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, themeById, checkThemeUnlocks, unlockRuleMet, unlockProgress, unlockHint, unlockTheme, tapCounter, resolveTheme, themeForDay, LOCKED_THEME_IDS } from '../js/themes.js';
import { THEME_UNLOCK_TEXT } from '../js/messages.js';
import { emptyStats, migrateStats, recordSolve } from '../js/storage.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const stats = (extra = {}) => ({ ...emptyStats(), ...extra });
const met = (id, st, date = at(2026, 11, 3)) => unlockRuleMet(themeById(id), st, date);
// Een logboekregel: [dag, niveau, seconden, hints, vlaggen, speciaal, uur].
const rows = (n, hour) => Array.from({ length: n }, (_, k) => [`2026-10-${String(1 + (k % 28)).padStart(2, '0')}`, 'koffie', 300, 0, 0, null, hour]);

test('elk vergrendeld thema heeft een regel, een hint en een tekst voor het "Nieuw thema"-moment', () => {
  for (const t of THEMES.filter((x) => x.unlock)) {
    assert.ok(THEME_UNLOCK_TEXT[t.id], `${t.id}: tekst`);
    assert.ok(t.emoji && t.icon, `${t.id}: emoji`);
    if (!t.unlock.secret) assert.ok(unlockHint(t, emptyStats(), at(2026, 11, 3)), `${t.id}: hint`);
  }
  assert.deepEqual(LOCKED_THEME_IDS.sort(), ['beachvolleybal', 'bos', 'gameboy', 'herfst', 'koffiemonster', 'lente', 'noorderlicht', 'onderwater', 'robijn', 'rubyxcube', 'winter', 'zomer', 'zonnebloem']);
  // Meteen vrij:
  for (const id of ['gitaar', 'dagverloop', 'krant', 'krijtbord', 'hoog-contrast', 'waddenzee', 'regen']) assert.equal(themeById(id).unlock, undefined, id);
});

test('{ total: 25 }: Zonnebloem bij de 25e puzzel (de mijlpaal met 🌻)', () => {
  assert.equal(met('zonnebloem', stats({ totalSolved: 24 })), false);
  assert.equal(met('zonnebloem', stats({ totalSolved: 25 })), true);
  assert.equal(unlockHint(themeById('zonnebloem'), stats({ totalSolved: 24 })), 'Nog 1 puzzel 🌻');
  assert.equal(unlockHint(themeById('zonnebloem'), stats({ totalSolved: 10 })), 'Nog 15 puzzels 🌻');
});

test('{ streak: 6 }: RubyxCube na zes dagen op rij (de langste reeks telt)', () => {
  assert.equal(met('rubyxcube', stats({ bestStreak: 5, streak: 5 })), false);
  assert.equal(met('rubyxcube', stats({ bestStreak: 6, streak: 0 })), true);
  assert.equal(unlockHint(themeById('rubyxcube'), stats()), 'Zes kanten, zes dagen');
});

test('{ level: ruby, solves: 10 }: Robijn na tien keer Ruby-modus', () => {
  assert.equal(met('robijn', stats({ levels: { ruby: { played: 12, solved: 9, best: 1, totalTime: 1 } }, totalSolved: 99 })), false);
  assert.equal(met('robijn', stats({ levels: { ruby: { played: 10, solved: 10, best: 1, totalTime: 1 } } })), true);
  assert.equal(unlockHint(themeById('robijn'), stats({ levels: { ruby: { solved: 7 } } })), 'Nog 3× Ruby-modus 🔥');
});

test('{ before: 10, solves: 50 }: Koffiemonster na 50 puzzels vóór tienen (uit het logboek)', () => {
  assert.equal(met('koffiemonster', stats({ log: rows(49, 9) })), false);
  assert.equal(met('koffiemonster', stats({ log: [...rows(49, 9), ...rows(30, 10), ...rows(5, null).map((r) => r.slice(0, 5))] })), false, '10:00 en oude regels zonder uur tellen niet');
  assert.equal(met('koffiemonster', stats({ log: [...rows(49, 9), [`2026-11-01`, 'zondag', 200, 0, 0, null, 0]] })), true);
  assert.equal(unlockProgress(themeById('koffiemonster'), stats({ log: rows(12, 7) })).current, 12);
});

test('recordSolve schrijft het uur in het logboek, en daarmee telt Koffiemonster', () => {
  const st = emptyStats();
  for (let k = 0; k < 50; k++) recordSolve(st, { levelId: 'koffie', elapsed: 1000, hints: 0, started: '2026-11-03', hour: k % 2 ? 9 : 6 }, '2026-11-03');
  assert.equal(unlockProgress(themeById('koffiemonster'), st).current, 50);
  // (50 puzzels: ook Bos (40), en 50 zonder hints: Onderwater.)
  assert.deepEqual(checkThemeUnlocks(st, at(2026, 11, 3)), ['koffiemonster', 'zonnebloem', 'bos', 'onderwater']);
});

test('{ window }: Beachvolleybal tijdens het WK (13 t/m 22 augustus 2027), daarna blijft hij vrij', () => {
  const t = themeById('beachvolleybal');
  assert.equal(unlockRuleMet(t, stats(), at(2027, 8, 12, 23)), false);
  assert.equal(unlockRuleMet(t, stats(), at(2027, 8, 13, 0)), true);
  assert.equal(unlockRuleMet(t, stats(), at(2027, 8, 22, 23)), true);
  assert.equal(unlockRuleMet(t, stats(), at(2027, 8, 23, 0)), false);
  // Gewoon de app openen is genoeg; daarna blijft hij vrij.
  const st = stats();
  assert.deepEqual(checkThemeUnlocks(st, at(2027, 8, 12), { opening: true }), []);
  assert.deepEqual(checkThemeUnlocks(st, at(2027, 8, 13), { opening: true }), ['beachvolleybal']);
  assert.deepEqual(st.themeUnlockDates, { beachvolleybal: '2027-08-13' });
  assert.deepEqual(checkThemeUnlocks(st, at(2027, 8, 23), { opening: true }), []);
  assert.equal(resolveTheme('beachvolleybal', at(2027, 8, 23), st.unlockedThemes), 'beachvolleybal');
  assert.equal(resolveTheme('beachvolleybal', at(2028, 1, 5), st.unlockedThemes), 'beachvolleybal');
  assert.equal(resolveTheme('beachvolleybal', at(2027, 8, 12), []), 'zonnig', 'vóór het WK nog niet');
  assert.match(unlockHint(t, stats(), at(2027, 1, 1)), /WK Beachvolleybal/);
});

test('bij het openen tellen alleen datumvensters; na een puzzel alle regels', () => {
  const st = stats({ totalSolved: 30, bestStreak: 8 });
  assert.deepEqual(checkThemeUnlocks(st, at(2026, 11, 3), { opening: true }), []);
  assert.deepEqual(checkThemeUnlocks(st, at(2026, 11, 3)), ['rubyxcube', 'zonnebloem']);
  assert.deepEqual(st.themeUnlockDates, { rubyxcube: '2026-11-03', zonnebloem: '2026-11-03' });
  assert.deepEqual(checkThemeUnlocks(st, at(2026, 11, 4)), [], 'niet nog eens nieuw');
});

test('{ secret }: Game Boy komt nooit vrij door te spelen, wel via unlockTheme', () => {
  const st = stats({ totalSolved: 9999, bestStreak: 999, levels: { ruby: { solved: 999 } }, log: rows(200, 6) });
  assert.ok(!checkThemeUnlocks(st, at(2027, 8, 15)).includes('gameboy'));
  assert.equal(unlockTheme(st, 'gameboy', at(2026, 11, 3)), true);
  assert.equal(unlockTheme(st, 'gameboy', at(2026, 11, 4)), false);
  assert.equal(st.themeUnlockDates.gameboy, '2026-11-03');
  assert.equal(unlockTheme(st, 'zonnig', at(2026, 11, 3)), false, 'een vrij thema hoeft niet vrijgespeeld');
  assert.equal(resolveTheme('gameboy', at(2026, 11, 3), []), 'zonnig');
  assert.equal(resolveTheme('gameboy', at(2026, 11, 3), ['gameboy']), 'gameboy');
});

test('de geheime tik-teller: 8 tikken binnen ~3 seconden, langzamer telt niet', () => {
  const tap = tapCounter();
  const quick = Array.from({ length: 8 }, (_, k) => 1000 + k * 350); // 2,45 s
  assert.deepEqual(quick.map(tap), [false, false, false, false, false, false, false, true]);
  // Daarna begint hij opnieuw.
  assert.equal(tap(3800), false);

  const slow = tapCounter();
  assert.ok(Array.from({ length: 20 }, (_, k) => k * 450).map(slow).every((x) => !x), '8 tikken over 3,15 s is te langzaam');

  // Na een pauze tellen alleen de tikken van daarna.
  const pause = tapCounter();
  for (const t of [0, 100, 200, 300]) pause(t);
  const after = Array.from({ length: 8 }, (_, k) => 5000 + k * 100).map(pause);
  assert.equal(after.indexOf(true), 7);
});

test('migratie: oude statistieken zonder vrijspeeldatums blijven werken', () => {
  // Heel oud: geen thema's en geen datums.
  const old = migrateStats({ totalSolved: 40, bestStreak: 9, levels: { ruby: { played: 3, solved: 2 } } });
  assert.deepEqual(old.unlockedThemes, []);
  assert.deepEqual(old.themeUnlockDates, {});
  // Wat al gehaald is, komt vrij bij de volgende puzzel (met de datum van dan).
  assert.deepEqual(checkThemeUnlocks(old, at(2026, 11, 3)), ['rubyxcube', 'zonnebloem', 'bos']);
  // Een seizoen zonder datum (van vóór de datums) blijft vrij en krijgt er geen bij.
  const season = migrateStats({ unlockedThemes: ['herfst', 'robijn', 'robijn', 'bestaat-niet'], themeUnlockDates: { robijn: '2026-11-01', zonnig: '2026-11-01', herfst: 'gisteren' } });
  assert.deepEqual(season.unlockedThemes, ['herfst', 'robijn']);
  assert.deepEqual(season.themeUnlockDates, { robijn: '2026-11-01' });
  assert.equal(resolveTheme('herfst', at(2027, 4, 1), season.unlockedThemes), 'herfst');
  // Geen dagthema voor een niet-seizoen op zijn vrijspeeldag.
  assert.equal(themeForDay(at(2026, 11, 1), { unlocked: season.unlockedThemes, unlockDates: season.themeUnlockDates }), null);
});

test('Beachvolleybal als accent op een gewone wedstrijddag in de zomer (als hij vrij is)', () => {
  const matches = [{ date: '2027-07-10' }, { date: '2027-10-10' }];
  assert.equal(themeForDay(at(2027, 7, 10), { matches }).accent, null);
  assert.deepEqual(themeForDay(at(2027, 7, 10), { matches, unlocked: ['beachvolleybal'] }), { theme: 'volleybal', accent: 'beachvolleybal', reason: 'wedstrijd', kind: null });
  assert.equal(themeForDay(at(2027, 10, 10), { matches, unlocked: ['beachvolleybal'] }).accent, null, 'niet in de herfst');
});

// ---------- Natuur ----------

test('{ between: [22, 2] } werkt over middernacht: 22:00 tot 02:00', async () => {
  const { inHours } = await import('../js/themes.js');
  const hourAt = (h, m) => new Date(2026, 10, 3, h, m).getHours();
  assert.equal(inHours(hourAt(21, 59), [22, 2]), false, '21:59');
  assert.equal(inHours(hourAt(22, 0), [22, 2]), true, '22:00');
  assert.equal(inHours(hourAt(23, 30), [22, 2]), true, '23:30');
  assert.equal(inHours(hourAt(0, 0), [22, 2]), true, '00:00');
  assert.equal(inHours(hourAt(1, 59), [22, 2]), true, '01:59');
  assert.equal(inHours(hourAt(2, 0), [22, 2]), false, '02:00');
  // Zonder middernacht ertussen gewoon van–tot.
  assert.equal(inHours(9, [8, 10]), true);
  assert.equal(inHours(10, [8, 10]), false);
});

test('Noorderlicht: 5 puzzels tussen 22:00 en 02:00 (uit het logboek), net wel en net niet', () => {
  const late = (n, hour) => rows(n, hour);
  assert.equal(met('noorderlicht', stats({ log: [...late(2, 22), ...late(2, 1), ...late(10, 21), ...late(10, 2)] })), false, '4 laat, de rest net te vroeg of te laat');
  assert.equal(met('noorderlicht', stats({ log: [...late(2, 22), ...late(2, 1), ...late(1, 23)] })), true);
  assert.equal(unlockHint(themeById('noorderlicht'), stats({ log: late(3, 0) })), 'Puzzel nog 2 keer laat op de avond 🌙');
});

test('Onderwater: 10 puzzels zonder hints (stats.noHintSolved), net wel en net niet', () => {
  assert.equal(met('onderwater', stats({ noHintSolved: 9, totalSolved: 80 })), false);
  assert.equal(met('onderwater', stats({ noHintSolved: 10 })), true);
  assert.equal(unlockHint(themeById('onderwater'), stats({ noHintSolved: 9 })), 'Nog 1 puzzel zonder hints 🫧');
});

test('Bos: 40 puzzels; Waddenzee en Regenachtige dag meteen vrij', () => {
  assert.equal(met('bos', stats({ totalSolved: 39 })), false);
  assert.equal(met('bos', stats({ totalSolved: 40 })), true);
  assert.equal(resolveTheme('waddenzee', at(2026, 11, 3), []), 'waddenzee');
  assert.equal(resolveTheme('regen', at(2026, 11, 3), []), 'regen');
  assert.equal(resolveTheme('noorderlicht', at(2026, 11, 3), []), 'zonnig');
});
