// Alle thema's als data: naam, licht of donker, het feestje en de kleuren
// voor het voorproefje in de kiezer. De echte kleuren staan in css/style.css;
// een test controleert dat `swatch` daarmee overeenkomt.

export const THEMES = [
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
    id: 'gran-canaria', name: 'Gran Canaria', scheme: 'light',
    celebrate: ['🌴', '🐚', '💛', '🌺'],
    swatch: { bg: '#fbf3e6', surface: '#fffdf8', accent: '#f29b74', digit: '#17606f' },
  },
  {
    id: 'lelie', name: 'Lelie', scheme: 'light',
    celebrate: ['🌸', '💗', '🐾', '🌷'],
    swatch: { bg: '#fbf6f7', surface: '#ffffff', accent: '#eab3c4', digit: '#96305a' },
  },
];

export const DEFAULT_THEME = 'zonnig';
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);

// Keuzes in de kiezer die zelf geen thema zijn, maar er één uitkiezen.
export const AUTO_CHOICES = [
  { id: 'auto', name: 'Automatisch', previews: ['zonnig', 'nacht'] },
];

// Welk thema hoort bij een instelling? 'auto' volgt licht/donker van het toestel.
export function resolveTheme(setting, prefersDark = false) {
  if (setting === 'auto') return prefersDark ? 'nacht' : 'zonnig';
  return themeById(setting).id;
}
