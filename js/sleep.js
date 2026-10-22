// Slaapstand: 's avonds laat (of als Ruby hem aanzet) wordt alles warmer en
// zachter. Een filter over het hele thema (minder blauw, minder fel), half
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

// Het filter dat over elk thema komt; css/style.css gebruikt precies deze
// waarden (een test controleert dat), en de themetest rekent ermee na of de
// cijfers leesbaar blijven.
// Sterker dimmen kan niet zonder dat cijfers in sommige thema's onder 4.5:1 zakken;
// het beetje extra contrast houdt witte tekst op gekleurde knoppen leesbaar.
export const SLEEP_FILTER = { sepia: 0.4, brightness: 0.88, contrast: 1.15 };
export const SLEEP_VOLUME = 0.5;

// Hoe een kleur eruitziet onder het slaapfilter (CSS sepia(), brightness() en
// contrast(), in die volgorde; nagemeten in Chromium).
export function sleepColor(hex, { sepia = SLEEP_FILTER.sepia, brightness = SLEEP_FILTER.brightness, contrast = SLEEP_FILTER.contrast } = {}) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const a = 1 - sepia;
  const out = [
    (0.393 + 0.607 * a) * r + (0.769 - 0.769 * a) * g + (0.189 - 0.189 * a) * b,
    (0.349 - 0.349 * a) * r + (0.686 + 0.314 * a) * g + (0.168 - 0.168 * a) * b,
    (0.272 - 0.272 * a) * r + (0.534 - 0.534 * a) * g + (0.131 + 0.869 * a) * b,
  ].map((v) => Math.min(255, Math.min(255, v) * brightness))
    .map((v) => Math.round(Math.max(0, Math.min(255, ((v / 255 - 0.5) * contrast + 0.5) * 255))));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
