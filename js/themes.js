// Alle thema's als data: naam, licht of donker, het feestje en de kleuren
// voor het voorproefje in de kiezer. De echte kleuren staan in css/style.css;
// een test controleert dat `swatch` daarmee overeenkomt.
// Sommige thema's komen vrij door te spelen (`unlock`, zie Vrijspelen hieronder).

export const THEMES = [
  // Volgorde in de kiezer: de bestaande thema's, dan de nieuwe, dan de
  // seizoenen en als laatste het geheime thema. `group` is het groepje in de
  // kiezer ('jij' = Van jou, 'sfeer', 'seizoen', 'geheim').
  {
    id: 'zonnig', name: 'Zonnig', scheme: 'light', group: 'sfeer',
    celebrate: ['💛', '🐾', '🌼', '☀️'],
    swatch: { bg: '#fff8e7', surface: '#ffffff', accent: '#f5c02e', digit: '#8a5300' },
  },
  {
    id: 'nacht', name: 'Nacht', scheme: 'dark', group: 'sfeer',
    celebrate: ['💛', '✨', '🌙', '🐾'],
    swatch: { bg: '#16141d', surface: '#221f2d', accent: '#f5c451', digit: '#ffd36b' },
  },
  {
    id: 'sterren', name: 'Sterren', scheme: 'dark', group: 'sfeer',
    celebrate: ['⭐', '✨', '🌙', '💫'],
    swatch: { bg: '#0f1630', surface: '#18213f', accent: '#ffd977', digit: '#ffd977' },
  },
  {
    id: 'liefde', name: 'Liefde', scheme: 'light', group: 'jij',
    celebrate: ['❤️', '💕', '💌', '🌹'],
    swatch: { bg: '#fff1f3', surface: '#ffffff', accent: '#e2557a', digit: '#93204a' },
  },
  {
    id: 'lelie', name: 'Lelie', scheme: 'light', group: 'jij',
    celebrate: ['🌸', '💗', '🐾', '🌷'],
    swatch: { bg: '#fbf6f7', surface: '#ffffff', accent: '#eab3c4', digit: '#96305a' },
  },
  {
    id: 'gran-canaria', name: 'Gran Canaria', scheme: 'light', group: 'jij',
    celebrate: ['🌴', '🐚', '💛', '🌺'],
    swatch: { bg: '#fbf3e6', surface: '#fffdf8', accent: '#f29b74', digit: '#17606f' },
  },
  {
    id: 'volleybal', name: 'Volleybal', scheme: 'light', group: 'jij',
    celebrate: ['🏐', '🙌', '⭐', '💛'],
    swatch: { bg: '#fffaea', surface: '#ffffff', accent: '#ffcc00', digit: '#1d4fa3' },
  },
  {
    id: 'briefje', name: 'Briefje', scheme: 'light', group: 'jij',
    celebrate: ['💙', '✏️', '💛', '💌'],
    swatch: { bg: '#fbfaf5', surface: '#ffffff', accent: '#ffe45c', digit: '#2a3d9e' },
  },
  // ---------- Persoonlijk ----------
  {
    id: 'robijn', name: 'Robijn', scheme: 'dark', group: 'jij', emoji: '💎', icon: '💎',
    unlock: { level: 'ruby', solves: 10 }, hint: (left) => `Nog ${left}× Ruby-modus 🔥`,
    celebrate: ['💎', '❤️', '✨', '🔥'],
    swatch: { bg: '#1c0610', surface: '#2a0a17', accent: '#ff4f7e', digit: '#ffa3bd' },
  },
  {
    id: 'rubyxcube', name: 'RubyxCube', scheme: 'light', group: 'jij', emoji: '🧩', icon: '🧩', fx: 'kubus',
    unlock: { streak: 6 }, hint: () => 'Zes kanten, zes dagen',
    celebrate: ['🧩', '🟥', '🟨', '🟦'],
    swatch: { bg: '#f2f3f7', surface: '#ffffff', accent: '#ffcf1f', digit: '#1f48b0' },
  },
  {
    id: 'koffiemonster', name: 'Koffiemonster', scheme: 'light', group: 'jij', emoji: '☕', icon: '☕', fx: 'latte',
    unlock: { before: 10, solves: 50 }, hint: (left) => `Nog ${left} ${left === 1 ? 'puzzel' : 'puzzels'} vóór tienen ☕`,
    celebrate: ['☕', '🥐', '🤎', '💛'],
    swatch: { bg: '#f5ede3', surface: '#fffaf3', accent: '#c98b4f', digit: '#7b4320' },
  },
  // ---------- Hobby's ----------
  {
    // Zolang Gitaar het thema is, klinkt de gitaar (zie applyFeedback in ui.js).
    id: 'gitaar', name: 'Gitaar', scheme: 'light', group: 'jij',
    celebrate: ['🎸', '🎶', '💛', '🎵'],
    swatch: { bg: '#ecd5b0', surface: '#fbf0dc', accent: '#e8932e', digit: '#8a3414' },
  },
  {
    id: 'beachvolleybal', name: 'Beachvolleybal', scheme: 'light', group: 'jij', emoji: '🏖️', icon: '🏐',
    // Het WK Beachvolleybal in Nederland.
    unlock: { window: ['2027-08-13', '2027-08-22'] }, hint: () => 'Tijdens het WK Beachvolleybal, 13–22 aug 2027',
    celebrate: ['🏐', '🏖️', '🌊', '☀️'],
    swatch: { bg: '#fff5dc', surface: '#fffdf6', accent: '#ffb22e', digit: '#0a5e7c' },
  },
  // ---------- Sfeer ----------
  {
    // De kleuren schuiven met de klok mee (js/fx/dagverloop.js); `scheme` en `swatch` zijn die van de middag.
    id: 'dagverloop', name: 'Dagverloop', scheme: 'light', group: 'sfeer', fx: 'dagverloop',
    celebrate: ['🌅', '☀️', '🌇', '🌙'],
    swatch: { bg: '#eef5ff', surface: '#ffffff', accent: '#7db6f2', digit: '#1f57a8' },
  },
  {
    id: 'krant', name: 'Krant', scheme: 'light', group: 'sfeer',
    celebrate: ['📰', '✏️', '☕', '🗞️'],
    swatch: { bg: '#f2ead4', surface: '#f9f4e6', accent: '#6a665e', digit: '#4d4943' },
  },
  {
    id: 'krijtbord', name: 'Krijtbord', scheme: 'dark', group: 'sfeer',
    celebrate: ['🖍️', '⭐', '📚', '💛'],
    swatch: { bg: '#1d362b', surface: '#234236', accent: '#f3d35b', digit: '#fff6d8' },
  },
  {
    id: 'zonnebloem', name: 'Zonnebloem', scheme: 'light', group: 'sfeer', emoji: '🌻', icon: '🌻', fx: 'zonnebloem',
    unlock: { total: 25 }, hint: (left) => `Nog ${left} ${left === 1 ? 'puzzel' : 'puzzels'} 🌻`,
    celebrate: ['🌻', '🐝', '🌱', '💛'],
    swatch: { bg: '#fffae3', surface: '#ffffff', accent: '#ffc816', digit: '#385f10' },
  },
  // ---------- Praktisch ----------
  {
    // Kiest ook 'auto' als het toestel om meer contrast vraagt (zie resolveTheme).
    id: 'hoog-contrast', name: 'Hoog contrast', scheme: 'light', group: 'sfeer',
    celebrate: ['⭐', '✔️', '💛', '🎉'],
    swatch: { bg: '#ffffff', surface: '#ffffff', accent: '#ffd400', digit: '#002a8f' },
  },
  // ---------- Seizoenen ----------
  {
    id: 'lente', name: 'Lente', scheme: 'light', group: 'seizoen', season: 'lente', unlock: { solves: 3 },
    emoji: '🌷', icon: '🌸', when: 'in de lente',
    celebrate: ['🌷', '🌸', '🐣', '🦋'],
    swatch: { bg: '#f6faf0', surface: '#ffffff', accent: '#f2a7bf', digit: '#34601f' },
  },
  {
    id: 'zomer', name: 'Zomer', scheme: 'light', group: 'seizoen', season: 'zomer', unlock: { solves: 3 },
    emoji: '☀️', icon: '🍉', when: 'in de zomer',
    celebrate: ['🍉', '🌻', '🍦', '☀️'],
    swatch: { bg: '#fff8ef', surface: '#ffffff', accent: '#f0607a', digit: '#286029' },
  },
  {
    id: 'herfst', name: 'Herfst', scheme: 'light', group: 'seizoen', season: 'herfst', unlock: { solves: 3 },
    emoji: '🍂', icon: '🍁', when: 'in de herfst',
    celebrate: ['🍂', '🍁', '🍄', '🌰'],
    swatch: { bg: '#fbf3e8', surface: '#fffcf7', accent: '#c8662b', digit: '#4c5a22' },
  },
  {
    id: 'winter', name: 'Winter', scheme: 'light', group: 'seizoen', season: 'winter', unlock: { solves: 3 },
    emoji: '❄️', icon: '⛄', when: 'in de winter',
    celebrate: ['❄️', '⛄', '🧣', '✨'],
    swatch: { bg: '#f3f7fb', surface: '#ffffff', accent: '#7fb0dc', digit: '#2a5b8c' },
  },
  // ---------- Geheim ----------
  {
    // Vrij door 8 keer snel op het logo te tikken (zie tapCounter); tot dan staat hij nergens.
    id: 'gameboy', name: 'Game Boy', scheme: 'light', group: 'geheim', emoji: '👾', icon: '👾', fx: 'gameboy',
    unlock: { secret: true },
    celebrate: ['👾', '🎮', '⭐', '🍄'],
    swatch: { bg: '#88c070', surface: '#e0f8d0', accent: '#88c070', digit: '#081820' },
  },
];

export const DEFAULT_THEME = 'zonnig';
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
export const SEASON_THEMES = THEMES.filter((t) => t.season);
export const FIXED_THEMES = THEMES.filter((t) => !t.season);
// Thema's die eerst vrijgespeeld moeten worden (alles met een `unlock`).
export const LOCKED_THEME_IDS = THEMES.filter((t) => t.unlock).map((t) => t.id);

// Een keuze in de kiezer die zelf geen thema is, maar er één uitkiest.
export const SEASON_AUTO = { id: 'seizoen', name: 'Seizoen', previews: ['lente', 'herfst'] };

// De groepjes in de themakiezer, in deze volgorde.
export const THEME_GROUPS = [
  { id: 'jij', name: 'Van jou' },
  { id: 'sfeer', name: 'Sfeer' },
  { id: 'seizoen', name: 'Seizoenen' },
  { id: 'geheim', name: 'Geheim 🤫' },
];

// ---------- Seizoenen ----------

// Meteorologische seizoenen. December hoort bij de winter van dát jaar, januari
// en februari bij de winter van het jaar ervoor: dec 2026 t/m feb 2027 = 'winter-2026'.
export function seasonOf(date = new Date()) {
  const m = date.getMonth() + 1, y = date.getFullYear();
  const season = m >= 3 && m <= 5 ? 'lente' : m >= 6 && m <= 8 ? 'zomer' : m >= 9 && m <= 11 ? 'herfst' : 'winter';
  const year = season === 'winter' && m <= 2 ? y - 1 : y;
  return { season, key: `${season}-${year}` };
}

// Telt een opgeloste puzzel mee voor het seizoen van `date`.
export function recordSeasonSolve(stats, date = new Date()) {
  const { key } = seasonOf(date);
  stats.seasonSolves = { ...(stats.seasonSolves || {}), [key]: ((stats.seasonSolves || {})[key] || 0) + 1 };
  return stats;
}

// Hoeveel puzzels er dit seizoen al zijn opgelost, en hoeveel er nodig zijn.
export function seasonProgress(stats, date = new Date()) {
  const { season, key } = seasonOf(date);
  const theme = SEASON_THEMES.find((t) => t.season === season);
  return { theme, current: (stats.seasonSolves || {})[key] || 0, target: theme.unlock.solves };
}

// ---------- Vrijspelen ----------
//
// Elk thema met een `unlock` heeft één regel:
//   { solves: n } + season   n puzzels in dat seizoen (alleen in dat seizoen te halen)
//   { total: n }             n puzzels opgelost in totaal
//   { streak: n }            n dagen op rij gepuzzeld (de langste reeks ooit)
//   { level: id, solves: n } n keer dat niveau opgelost
//   { before: uur, solves: n }  n puzzels opgelost vóór dat uur (uit het logboek)
//   { window: [van, tot] }   de app geopend tussen die dagen (allebei meegerekend)
//   { secret: true }         alleen via een easter egg (zie unlockTheme)
// Eenmaal vrij blijft vrij: het staat in stats.unlockedThemes, met de dag in stats.themeUnlockDates.

// Hoe ver ze is met de regel van `theme`: { current, target }.
export function unlockProgress(theme, stats, date = new Date()) {
  const r = theme.unlock || {};
  if (theme.season) {
    const { season, key } = seasonOf(date);
    return { current: season === theme.season ? (stats.seasonSolves || {})[key] || 0 : 0, target: r.solves };
  }
  if ('total' in r) return { current: stats.totalSolved || 0, target: r.total };
  if ('streak' in r) return { current: stats.bestStreak || 0, target: r.streak };
  if ('level' in r) return { current: stats.levels?.[r.level]?.solved || 0, target: r.solves };
  if ('before' in r) {
    // Het uur staat in de 7e kolom van het logboek (oude regels hebben er geen).
    const early = (stats.log || []).filter((row) => Number.isInteger(row[6]) && row[6] < r.before).length;
    return { current: early, target: r.solves };
  }
  if (r.window) { const k = dayKey(date); return { current: r.window[0] <= k && k <= r.window[1] ? 1 : 0, target: 1 }; }
  return { current: 0, target: 1 }; // geheim: niet door te spelen
}

// Is de regel van `theme` op `date` gehaald?
export function unlockRuleMet(theme, stats, date = new Date()) {
  if (!theme.unlock || theme.unlock.secret) return false;
  const { current, target } = unlockProgress(theme, stats, date);
  return current >= target;
}

// Zet een thema vrij (met de dag erbij). Geeft true als het nieuw is.
export function unlockTheme(stats, id, date = new Date()) {
  const unlocked = stats.unlockedThemes || [];
  if (unlocked.includes(id) || !LOCKED_THEME_IDS.includes(id)) return false;
  stats.unlockedThemes = [...unlocked, id];
  // De dag van vrijspelen. Bij een seizoen is het die dag meteen dat thema (zie themeForDay).
  stats.themeUnlockDates = { ...(stats.themeUnlockDates || {}), [id]: dayKey(date) };
  return true;
}

// Kijkt welke thema's er vrijkomen, zet ze vrij en geeft de nieuwe id's terug.
// Na een opgeloste puzzel tellen alle regels; bij het openen van de app
// (`opening`) alleen de datumvensters, zodat er niet zomaar iets opduikt.
export function checkThemeUnlocks(stats, date = new Date(), { opening = false } = {}) {
  const fresh = THEMES.filter((t) => t.unlock && !(stats.unlockedThemes || []).includes(t.id)
    && (!opening || t.unlock.window) && unlockRuleMet(t, stats, date));
  for (const t of fresh) unlockTheme(stats, t.id, date);
  return fresh.map((t) => t.id);
}

// De hint bij een vergrendeld thema in de kiezer.
export function unlockHint(theme, stats, date = new Date()) {
  const { current, target } = unlockProgress(theme, stats, date);
  const left = Math.max(1, target - current);
  if (theme.season) {
    return seasonOf(date).season === theme.season
      ? `Nog ${left} ${left === 1 ? 'puzzel' : 'puzzels'} deze ${theme.name.toLowerCase()}`
      : `Los ${target} puzzels op ${theme.when} ${theme.emoji}`;
  }
  return theme.hint ? theme.hint(left) : '';
}

// Het geheime thema: zoveel tikken op het logo, snel achter elkaar. Geeft een
// functie die je bij elke tik de tijd (ms) geeft; die zegt true bij de laatste.
// Langzamer tikken telt niet: alleen tikken binnen `within` ms van elkaar tellen samen.
export const SECRET_TAPS = { taps: 8, within: 3000 };
export function tapCounter({ taps = SECRET_TAPS.taps, within = SECRET_TAPS.within } = {}) {
  let times = [];
  return (t) => {
    times = [...times.filter((x) => t - x < within), t];
    if (times.length < taps) return false;
    times = [];
    return true;
  };
}

// Vroeger kon het thema 'auto' zijn (licht of donker zoals het toestel). Dat
// bestaat niet meer: wie het had, houdt het thema dat ze op dat moment zag.
// Vraagt het toestel om meer contrast (prefers-contrast: more), dan Hoog contrast.
export const migrateThemeSetting = (setting, prefersDark = false, prefersContrast = false) => (setting === 'auto' ? autoTheme({ dark: prefersDark, contrast: prefersContrast }) : setting);
const autoTheme = ({ dark = false, contrast = false } = {}) => (contrast ? 'hoog-contrast' : dark ? 'nacht' : 'zonnig');

// Welk thema hoort bij een instelling?
// - 'seizoen' kiest het thema van nu als dat vrij is, anders zonnig;
// - 'auto' volgt het toestel (`device`: { dark, contrast });
// - een (nog) vergrendeld thema of een onbekende keuze valt terug op zonnig.
export function resolveTheme(setting, date = new Date(), unlocked = [], device = {}) {
  if (setting === 'auto') return autoTheme(device);
  if (setting === 'seizoen') {
    const { season } = seasonOf(date);
    const t = SEASON_THEMES.find((s) => s.season === season);
    return unlocked.includes(t.id) ? t.id : DEFAULT_THEME;
  }
  const t = themeById(setting);
  if (t.unlock && !unlocked.includes(t.id)) return DEFAULT_THEME;
  return t.id;
}

// ---------- Dagthema's ----------
//
// Op sommige dagen kiest de app het thema, niet Ruby. Haar eigen keuze
// (settings.theme) blijft gewoon bewaard: de volgende dag is alles weer zoals
// zij het had. Voorrang, van hoog naar laag:
//   1. een wedstrijddag (js/matches.js): Volleybal. Valt er die dag ook iets
//      van hieronder, dan Volleybal met de accentkleuren van dat andere thema;
//   2. persoonlijke dagen en feestdagen (DAY_THEMES, met de speciale dagen uit
//      messages.js), oudejaarsavond en vakanties (VACATIONS);
//   3. seizoenen: de dag dat ze een seizoen vrijspeelt, en elk jaar daarna de
//      eerste dag van dat seizoen;
//   4. anders haar eigen keuze.

// Vakanties: van en tot (allebei meegerekend) als 'JJJJ-MM-DD', met een thema-id.
// Bijvoorbeeld:
//   { van: '2027-05-01', tot: '2027-05-08', thema: 'gran-canaria' },
export const VACATIONS = [];

// Welk thema bij welke speciale dag (de soorten uit SPECIAL_DAYS in
// messages.js). Een functie krijgt de vrijgespeelde seizoenen mee.
const winterOr = (fallback) => (unlocked) => (unlocked.includes('winter') ? 'winter' : fallback);
export const DAY_THEMES = {
  jubileum: 'liefde',
  halfjaar: 'liefde',
  honderd: 'liefde',
  valentijn: 'liefde',
  verjaardag: 'zonnig',
  'app-verjaardag': 'briefje',
  kerst: winterOr('sterren'),
  'tweede-kerstdag': winterOr('sterren'),
  sinterklaas: winterOr('sterren'),
  oudjaar: 'sterren', // 31 december; staat niet tussen de speciale dagen
  nieuwjaar: 'sterren',
  halloween: 'nacht',
  pasen: (unlocked) => (unlocked.includes('lente') ? 'lente' : 'zonnig'),
  koningsdag: 'zonnig',
};

// De eerste dag van elk seizoen (dezelfde indeling als seasonOf).
const SEASON_STARTS = { lente: '03-01', zomer: '06-01', herfst: '09-01', winter: '12-01' };

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Het thema van een persoonlijke dag, feestdag of vakantie, of null.
function holidayTheme(date, key, unlocked, specials, vacations) {
  const kinds = [...specials, ...(key.endsWith('-12-31') ? ['oudjaar'] : [])];
  for (const kind of kinds) {
    const rule = DAY_THEMES[kind];
    if (rule) return { theme: typeof rule === 'function' ? rule(unlocked) : rule, reason: 'dag', kind };
  }
  const trip = vacations.find((v) => v.van <= key && key <= v.tot && THEMES.some((t) => t.id === v.thema));
  return trip ? { theme: trip.thema, reason: 'vakantie', kind: 'vakantie' } : null;
}

// Het seizoensthema van vandaag, of null. `unlockDates`: { winter: '2026-12-30' };
// een vrijgespeeld seizoen zonder datum (oude opslag) telt als "vóór vandaag".
function seasonTheme(date, key, unlocked, unlockDates) {
  const fresh = SEASON_THEMES.find((t) => unlocked.includes(t.id) && unlockDates[t.id] === key);
  if (fresh) return { theme: fresh.id, reason: 'vrijgespeeld', kind: fresh.season };
  const first = SEASON_THEMES.find((t) => key.slice(5) === SEASON_STARTS[t.season]);
  if (first && unlocked.includes(first.id) && !(unlockDates[first.id] >= key)) return { theme: first.id, reason: 'seizoen', kind: first.season };
  return null;
}

// Het dagthema voor `date`, of null (dan geldt haar eigen keuze).
// Geeft { theme, accent, reason, kind }: `accent` is een ander thema waarvan de
// accentkleuren over het thema heen komen (alleen op een wedstrijddag), `reason`
// is 'wedstrijd', 'dag', 'vakantie', 'vrijgespeeld' of 'seizoen', en `kind` de
// soort dag (bijv. 'halloween'). `specials` zijn de soorten speciale dag op
// `date` (specialKindsOn in messages.js), `matches` het wedstrijdschema.
export function themeForDay(date = new Date(), { unlocked = [], unlockDates = {}, matches = [], specials = [], vacations = VACATIONS } = {}) {
  const key = dayKey(date);
  const other = holidayTheme(date, key, unlocked, specials, vacations) || seasonTheme(date, key, unlocked, unlockDates);
  if (matches.some((m) => m.date === key)) {
    let accent = other && other.theme !== 'volleybal' ? other.theme : null;
    // Een gewone wedstrijddag in de zomer: met de zon en het zand van Beachvolleybal (als dat vrij is).
    if (!accent && seasonOf(date).season === 'zomer' && unlocked.includes('beachvolleybal')) accent = 'beachvolleybal';
    return { theme: 'volleybal', accent, reason: 'wedstrijd', kind: other?.kind ?? null };
  }
  return other ? { ...other, accent: null } : null;
}

// Het thema dat ze nu ziet: het dagthema, of anders haar eigen keuze.
export function themeToday(setting, date, opts = {}) {
  const day = themeForDay(date, opts);
  return day ? { ...day, own: false } : { theme: resolveTheme(setting, date, opts.unlocked), accent: null, own: true };
}
