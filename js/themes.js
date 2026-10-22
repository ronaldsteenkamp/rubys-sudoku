// Alle thema's als data: naam, licht of donker, het feestje en de kleuren
// voor het voorproefje in de kiezer. De echte kleuren staan in css/style.css;
// een test controleert dat `swatch` daarmee overeenkomt.
// Seizoensthema's (`season`) komen vrij door te spelen (`unlock`).

export const THEMES = [
  // Volgorde in de kiezer: eerst Zonnig en Nacht (waar 'Automatisch' tussen wisselt),
  // dan het andere donkere thema, dan de persoonlijke thema's.
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

// Keuzes in de kiezer die zelf geen thema zijn, maar er één uitkiezen.
export const AUTO_CHOICES = [
  { id: 'auto', name: 'Automatisch', previews: ['zonnig', 'nacht'] },
];
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
  return [theme.id];
}

// Welk thema hoort bij een instelling?
// - 'auto' volgt licht/donker van het toestel;
// - 'seizoen' kiest het thema van nu als dat vrij is, anders zonnig;
// - een (nog) vergrendeld seizoensthema valt terug op zonnig.
export function resolveTheme(setting, date = new Date(), unlocked = [], prefersDark = false) {
  if (setting === 'auto') return prefersDark ? 'nacht' : 'zonnig';
  if (setting === 'seizoen') {
    const { season } = seasonOf(date);
    const t = SEASON_THEMES.find((s) => s.season === season);
    return unlocked.includes(t.id) ? t.id : DEFAULT_THEME;
  }
  const t = themeById(setting);
  if (t.season && !unlocked.includes(t.id)) return DEFAULT_THEME;
  return t.id;
}
