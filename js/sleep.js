// Slaapstand: 's avonds laat (of als Ruby hem aanzet) wordt alles zwart-wit en
// rustiger. Een zwart-witfilter over het hele thema, half
// zo hard geluid, geen trillen en rustiger feestjes. Puur, zodat het ook in
// Node te testen is.

export const SLEEP_SETTINGS = ['auto', 'aan', 'uit'];
// Bij 'auto' actief van 23:00 tot 06:00, in lokale tijd.
export const SLEEP_FROM = 23;
export const SLEEP_UNTIL = 6;

export const isSleepTime = (date = new Date()) => {
  const h = date.getHours();
  return h >= SLEEP_FROM || h < SLEEP_UNTIL;
};

export const sleepActive = (setting, date = new Date()) => setting === 'aan' || (setting !== 'uit' && isSleepTime(date));

// Het filter dat over elk thema komt: alleen zwart-wit. css/style.css gebruikt
// precies dit filter (een test controleert dat), en de themetest rekent ermee na
// of de cijfers leesbaar blijven.
export const SLEEP_FILTER = { grayscale: 1 };
export const SLEEP_VOLUME = 0.5;
export const sleepFilterCss = () => `grayscale(${SLEEP_FILTER.grayscale})`;

// Hoe een kleur eruitziet onder het slaapfilter (CSS grayscale(), zoals in de
// Filter Effects-specificatie). brightness en contrast zijn er alleen om mee te rekenen.
export function sleepColor(hex, { grayscale = SLEEP_FILTER.grayscale, brightness = 1, contrast = 1 } = {}) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const a = 1 - grayscale;
  const out = [
    (0.2126 + 0.7874 * a) * r + (0.7152 - 0.7152 * a) * g + (0.0722 - 0.0722 * a) * b,
    (0.2126 - 0.2126 * a) * r + (0.7152 + 0.2848 * a) * g + (0.0722 - 0.0722 * a) * b,
    (0.2126 - 0.2126 * a) * r + (0.7152 - 0.7152 * a) * g + (0.0722 + 0.9278 * a) * b,
  ].map((v) => Math.min(255, Math.min(255, v) * brightness))
    .map((v) => Math.round(Math.max(0, Math.min(255, ((v / 255 - 0.5) * contrast + 0.5) * 255))));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
