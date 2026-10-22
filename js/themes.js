// Alle thema's als data: naam, licht of donker, het feestje en de kleuren
// voor het voorproefje in de kiezer. De echte kleuren staan in css/style.css;
// een test controleert dat `swatch` daarmee overeenkomt.
// Seizoensthema's (`season`) komen vrij door te spelen (`unlock`).

export const THEMES = [
  // Volgorde in de kiezer: eerst Zonnig en Nacht, dan het andere donkere
  // thema, dan de persoonlijke thema's.
  {
    id: 'zonnig', name: 'Zonnig', scheme: 'light',
    celebrate: ['💛', '🐾', '🌼', '☀️'],
    swatch: { bg: '#fff8e7', surface: '#ffffff', accent: '#f5c02e', digit: '#8a5300' },
  },
  {
    id: 'nacht', name: 'Nacht', scheme: 'dark',
    celebrate: ['💛', '✨', '🌙', '🐾'],
    swatch: { bg: '#16141d', surface: '#221f2d', accent: '#f5c451', digit: '#ffd36b' },
  },
  {
    id: 'sterren', name: 'Sterren', scheme: 'dark',
    celebrate: ['⭐', '✨', '🌙', '💫'],
    swatch: { bg: '#0f1630', surface: '#18213f', accent: '#ffd977', digit: '#ffd977' },
  },
  {
    id: 'liefde', name: 'Liefde', scheme: 'light',
    celebrate: ['❤️', '💕', '💌', '🌹'],
    swatch: { bg: '#fff1f3', surface: '#ffffff', accent: '#e2557a', digit: '#93204a' },
  },
  {
    id: 'lelie', name: 'Lelie', scheme: 'light',
    celebrate: ['🌸', '💗', '🐾', '🌷'],
    swatch: { bg: '#fbf6f7', surface: '#ffffff', accent: '#eab3c4', digit: '#96305a' },
  },
  {
    id: 'gran-canaria', name: 'Gran Canaria', scheme: 'light',
    celebrate: ['🌴', '🐚', '💛', '🌺'],
    swatch: { bg: '#fbf3e6', surface: '#fffdf8', accent: '#f29b74', digit: '#17606f' },
  },
  {
    id: 'volleybal', name: 'Volleybal', scheme: 'light',
    celebrate: ['🏐', '🙌', '⭐', '💛'],
    swatch: { bg: '#fffaea', surface: '#ffffff', accent: '#ffcc00', digit: '#1d4fa3' },
  },
  {
    id: 'briefje', name: 'Briefje', scheme: 'light',
    celebrate: ['💙', '✏️', '💛', '💌'],
    swatch: { bg: '#fbfaf5', surface: '#ffffff', accent: '#ffe45c', digit: '#2a3d9e' },
  },
  // ---------- Seizoenen ----------
  {
    id: 'lente', name: 'Lente', scheme: 'light', season: 'lente', unlock: { solves: 3 },
    emoji: '🌷', icon: '🌸', when: 'in de lente',
    celebrate: ['🌷', '🌸', '🐣', '🦋'],
    swatch: { bg: '#f6faf0', surface: '#ffffff', accent: '#f2a7bf', digit: '#34601f' },
  },
  {
    id: 'zomer', name: 'Zomer', scheme: 'light', season: 'zomer', unlock: { solves: 3 },
    emoji: '☀️', icon: '🍉', when: 'in de zomer',
    celebrate: ['🍉', '🌻', '🍦', '☀️'],
    swatch: { bg: '#fff8ef', surface: '#ffffff', accent: '#f0607a', digit: '#286029' },
  },
  {
    id: 'herfst', name: 'Herfst', scheme: 'light', season: 'herfst', unlock: { solves: 3 },
    emoji: '🍂', icon: '🍁', when: 'in de herfst',
    celebrate: ['🍂', '🍁', '🍄', '🌰'],
    swatch: { bg: '#fbf3e8', surface: '#fffcf7', accent: '#c8662b', digit: '#4c5a22' },
  },
  {
    id: 'winter', name: 'Winter', scheme: 'light', season: 'winter', unlock: { solves: 3 },
    emoji: '❄️', icon: '⛄', when: 'in de winter',
    celebrate: ['❄️', '⛄', '🧣', '✨'],
    swatch: { bg: '#f3f7fb', surface: '#ffffff', accent: '#7fb0dc', digit: '#2a5b8c' },
  },
];

export const DEFAULT_THEME = 'zonnig';
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
export const SEASON_THEMES = THEMES.filter((t) => t.season);
export const FIXED_THEMES = THEMES.filter((t) => !t.season);

// Een keuze in de kiezer die zelf geen thema is, maar er één uitkiest.
export const SEASON_AUTO = { id: 'seizoen', name: 'Seizoen', previews: ['lente', 'herfst'] };

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

// Kijkt of er een seizoensthema vrijkomt. Voegt het toe aan stats.unlockedThemes
// en geeft de nieuw ontgrendelde thema-id's terug.
export function checkThemeUnlocks(stats, date = new Date()) {
  const unlocked = stats.unlockedThemes || [];
  const { theme, current, target } = seasonProgress(stats, date);
  if (unlocked.includes(theme.id) || current < target) return [];
  stats.unlockedThemes = [...unlocked, theme.id];
  // De dag van vrijspelen: dan is het die dag meteen dat thema (zie themeForDay).
  stats.themeUnlockDates = { ...(stats.themeUnlockDates || {}), [theme.id]: dayKey(date) };
  return [theme.id];
}

// Vroeger kon het thema 'auto' zijn (licht of donker zoals het toestel). Dat
// bestaat niet meer: wie het had, houdt het thema dat ze op dat moment zag.
export const migrateThemeSetting = (setting, prefersDark = false) => (setting === 'auto' ? (prefersDark ? 'nacht' : 'zonnig') : setting);

// Welk thema hoort bij een instelling?
// - 'seizoen' kiest het thema van nu als dat vrij is, anders zonnig;
// - een (nog) vergrendeld seizoensthema of een onbekende keuze valt terug op zonnig.
export function resolveTheme(setting, date = new Date(), unlocked = []) {
  if (setting === 'seizoen') {
    const { season } = seasonOf(date);
    const t = SEASON_THEMES.find((s) => s.season === season);
    return unlocked.includes(t.id) ? t.id : DEFAULT_THEME;
  }
  const t = themeById(setting);
  if (t.season && !unlocked.includes(t.id)) return DEFAULT_THEME;
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
    const accent = other && other.theme !== 'volleybal' ? other.theme : null;
    return { theme: 'volleybal', accent, reason: 'wedstrijd', kind: other?.kind ?? null };
  }
  return other ? { ...other, accent: null } : null;
}

// Het thema dat ze nu ziet: het dagthema, of anders haar eigen keuze.
export function themeToday(setting, date, opts = {}) {
  const day = themeForDay(date, opts);
  return day ? { ...day, own: false } : { theme: resolveTheme(setting, date, opts.unlocked), accent: null, own: true };
}
