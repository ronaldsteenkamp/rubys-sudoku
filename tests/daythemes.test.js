import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeForDay, themeToday, checkThemeUnlocks, recordSeasonSolve, DAY_THEMES, VACATIONS, THEMES } from '../js/themes.js';
import { MATCHES } from '../js/matches.js';
import { specialKindsOn, dayThemeLine, DAY_THEME_LINES, THEME_EMOJI } from '../js/messages.js';
import { emptyStats, migrateStats } from '../js/storage.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
// Zoals de app het aanroept: de echte speciale dagen en het echte wedstrijdschema.
const day = (date, extra = {}) => themeForDay(date, { matches: MATCHES, specials: specialKindsOn(date), ...extra });
const themeOn = (date, extra) => day(date, extra)?.theme ?? null;

test('een gewone dag: geen dagthema', () => {
  assert.equal(day(at(2026, 11, 3)), null);
  assert.equal(day(at(2027, 6, 15)), null);
});

test('wedstrijddag: Volleybal', () => {
  assert.deepEqual(day(at(2026, 11, 14)), { theme: 'volleybal', accent: null, reason: 'wedstrijd', kind: null });
  // Ook 's avonds laat en vlak na middernacht telt de kalenderdag.
  assert.equal(themeOn(at(2026, 11, 14, 23)), 'volleybal');
  assert.equal(themeOn(at(2026, 11, 15, 0)), null);
  for (const m of MATCHES) assert.equal(themeOn(new Date(`${m.date}T12:00`)), 'volleybal', m.date);
});

test('wedstrijddag + Halloween (31-10-2026): Volleybal met Nacht-accent', () => {
  assert.deepEqual(day(at(2026, 10, 31)), { theme: 'volleybal', accent: 'nacht', reason: 'wedstrijd', kind: 'halloween' });
});

test('wedstrijddag + jubileum: Volleybal met Liefde-accent', () => {
  const matches = [{ date: '2027-09-26', time: '17:00', home: true, opponent: 'Test DS 1' }];
  assert.deepEqual(day(at(2027, 9, 26), { matches }), { theme: 'volleybal', accent: 'liefde', reason: 'wedstrijd', kind: 'jubileum' });
  // Andere combinaties gaan net zo: verjaardag = Zonnig-accent, eerste winterdag = Winter-accent.
  assert.equal(day(at(2027, 10, 12), { matches: [{ date: '2027-10-12' }] }).accent, 'zonnig');
  assert.equal(day(at(2027, 12, 1), { matches: [{ date: '2027-12-01' }], unlocked: ['winter'] }).accent, 'winter');
  // Een Volleybal-vakantie op een wedstrijddag: gewoon Volleybal.
  assert.equal(day(at(2027, 5, 2), { matches: [{ date: '2027-05-02' }], vacations: [{ van: '2027-05-01', tot: '2027-05-08', thema: 'volleybal' }] }).accent, null);
});

test('persoonlijke dagen en feestdagen', () => {
  const cases = [
    [at(2027, 9, 26), 'liefde', 'jubileum'], [at(2027, 3, 26), 'liefde', 'halfjaar'], [at(2027, 1, 4), 'liefde', 'honderd'],
    [at(2027, 2, 14), 'liefde', 'valentijn'], [at(2027, 10, 12), 'zonnig', 'verjaardag'], [at(2027, 10, 21), 'briefje', 'app-verjaardag'],
    [at(2026, 12, 31), 'sterren', 'oudjaar'], [at(2027, 1, 1), 'sterren', 'nieuwjaar'], [at(2027, 10, 31), 'nacht', 'halloween'],
    [at(2027, 4, 27), 'zonnig', 'koningsdag'],
  ];
  for (const [date, theme, kind] of cases) assert.deepEqual(day(date), { theme, accent: null, reason: 'dag', kind }, kind);
  // De app-verjaardag pas vanaf 2027: op 21 oktober 2026 kreeg ze de app.
  assert.equal(day(at(2026, 10, 21)), null);
});

test('Kerst, Tweede kerstdag en Sinterklaas: Winter als die ooit vrijgespeeld is, anders Sterren', () => {
  for (const date of [at(2026, 12, 25), at(2026, 12, 26), at(2026, 12, 5)]) {
    assert.equal(themeOn(date), 'sterren');
    assert.equal(themeOn(date, { unlocked: ['winter'] }), 'winter');
    assert.equal(themeOn(date, { unlocked: ['winter'], unlockDates: { winter: '2026-12-02' } }), 'winter');
  }
});

test('Pasen: Lente als die vrijgespeeld is, anders Zonnig', () => {
  assert.equal(themeOn(at(2027, 3, 28)), 'zonnig');
  assert.equal(themeOn(at(2027, 3, 28), { unlocked: ['lente'] }), 'lente');
});

test('seizoen: de dag van vrijspelen, en het jaar erna de eerste dag van het seizoen', () => {
  const unlocked = ['winter'];
  const unlockDates = { winter: '2026-12-30' };
  // De dag zelf (vanaf het vrijspelen; vóór die tijd stond het er nog niet in).
  assert.deepEqual(day(at(2026, 12, 30), { unlocked, unlockDates }), { theme: 'winter', accent: null, reason: 'vrijgespeeld', kind: 'winter' });
  assert.equal(day(at(2026, 12, 30), {}), null);
  assert.equal(day(at(2026, 12, 29), { unlocked, unlockDates }), null);
  // 1 december 2026 lag vóór het vrijspelen: geen winter.
  assert.equal(day(at(2026, 12, 1), { unlocked, unlockDates }), null);
  // Een jaar later wel.
  assert.deepEqual(day(at(2027, 12, 1), { unlocked, unlockDates }), { theme: 'winter', accent: null, reason: 'seizoen', kind: 'winter' });
  // Zonder vrijgespeeld seizoen niets.
  assert.equal(day(at(2027, 12, 1)), null);
  // De andere seizoenen op hun eerste dag.
  const all = { unlocked: ['lente', 'zomer', 'herfst', 'winter'] };
  assert.equal(themeOn(at(2027, 3, 1), all), 'lente');
  assert.equal(themeOn(at(2027, 6, 1), all), 'zomer');
  assert.equal(themeOn(at(2027, 9, 1), all), 'herfst');
  assert.equal(themeOn(at(2027, 3, 2), all), null);
});

test('seizoen over de jaargrens: winter vrijgespeeld in februari telt voor 1 december', () => {
  const stats = emptyStats();
  for (let k = 0; k < 3; k++) recordSeasonSolve(stats, at(2027, 2, 10));
  assert.deepEqual(checkThemeUnlocks(stats, at(2027, 2, 10)), ['winter']);
  assert.deepEqual(stats.themeUnlockDates, { winter: '2027-02-10' });
  const opts = { unlocked: stats.unlockedThemes, unlockDates: stats.themeUnlockDates };
  assert.equal(themeOn(at(2027, 2, 10), opts), 'winter');
  assert.equal(themeOn(at(2027, 2, 11), opts), null);
  assert.equal(themeOn(at(2027, 12, 1), opts), 'winter');
});

test('oude opslag zonder vrijspeeldatum telt als "vóór vandaag" vrijgespeeld', () => {
  const s = migrateStats({ unlockedThemes: ['herfst'] });
  assert.deepEqual(s.themeUnlockDates, {});
  assert.equal(themeOn(at(2027, 9, 1), { unlocked: s.unlockedThemes, unlockDates: s.themeUnlockDates }), 'herfst');
  // Kapotte of losse datums vallen weg.
  assert.deepEqual(migrateStats({ unlockedThemes: ['herfst'], themeUnlockDates: { herfst: '2026-10-24', winter: '2026-12-30', lente: 'gisteren' } }).themeUnlockDates, { herfst: '2026-10-24' });
});

test('voorrang: wedstrijd > speciale dag > vakantie > seizoen', () => {
  const vacations = [{ van: '2027-05-01', tot: '2027-05-08', thema: 'gran-canaria' }];
  assert.deepEqual(day(at(2027, 5, 1), { vacations }), { theme: 'gran-canaria', accent: null, reason: 'vakantie', kind: 'vakantie' });
  assert.equal(themeOn(at(2027, 5, 8), { vacations }), 'gran-canaria');
  assert.equal(themeOn(at(2027, 5, 9), { vacations }), null);
  // Halloween gaat voor de dag dat ze Herfst vrijspeelt.
  assert.equal(themeOn(at(2027, 10, 31), { unlocked: ['herfst'], unlockDates: { herfst: '2027-10-31' } }), 'nacht');
  // Een speciale dag gaat voor een vakantie, een vakantie voor een seizoen.
  assert.equal(themeOn(at(2027, 4, 27), { vacations: [{ van: '2027-04-20', tot: '2027-04-30', thema: 'gran-canaria' }] }), 'zonnig');
  assert.equal(themeOn(at(2027, 6, 1), { unlocked: ['zomer'], vacations: [{ van: '2027-05-28', tot: '2027-06-04', thema: 'gran-canaria' }] }), 'gran-canaria');
  // Een vakantie met een onbekend thema telt niet.
  assert.equal(themeOn(at(2027, 5, 2), { vacations: [{ van: '2027-05-01', tot: '2027-05-08', thema: 'mars' }] }), null);
});

test('VACATIONS staat standaard leeg; elk dagthema bestaat', () => {
  assert.deepEqual(VACATIONS, []);
  const ids = THEMES.map((t) => t.id);
  for (const [kind, rule] of Object.entries(DAY_THEMES)) {
    for (const unlocked of [[], ['winter', 'lente']]) assert.ok(ids.includes(typeof rule === 'function' ? rule(unlocked) : rule), kind);
  }
});

test('haar eigen keuze (settings.theme) verandert nooit', () => {
  const settings = Object.freeze({ theme: 'lelie' });
  const opts = { matches: MATCHES, specials: specialKindsOn(at(2026, 10, 31)) };
  assert.deepEqual(themeToday(settings.theme, at(2026, 10, 31), opts), { theme: 'volleybal', accent: 'nacht', reason: 'wedstrijd', kind: 'halloween', own: false });
  assert.deepEqual(themeToday(settings.theme, at(2026, 11, 1), { matches: MATCHES, specials: [] }), { theme: 'lelie', accent: null, own: true });
  assert.equal(settings.theme, 'lelie');
});

test('de regel boven de themakiezer', () => {
  assert.ok(DAY_THEME_LINES.length >= 4);
  const line = dayThemeLine(at(2026, 11, 14), { name: 'Volleybal', emoji: '🏐' });
  assert.match(line, /Volleybal 🏐/);
  assert.match(line, /[Mm]orgen/);
  assert.equal(line, dayThemeLine(at(2026, 11, 14, 20), { name: 'Volleybal', emoji: '🏐' }), 'de hele dag dezelfde');
  for (const t of THEMES) assert.ok(THEME_EMOJI[t.id], t.id);
});
