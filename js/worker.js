// Genereert puzzels buiten de hoofdthread, zodat de app nooit hapert.
import { generate, generateDaily, generateHeart, generateMatchPuzzle } from './generator.js';

self.onmessage = ({ data }) => {
  const { id, kind, args } = data;
  try {
    let puzzle;
    if (kind === 'daily') puzzle = generateDaily(new Date(args.date));
    else if (kind === 'heart') puzzle = generateHeart(args.seed);
    else if (kind === 'match') puzzle = generateMatchPuzzle(args.date, args.kind);
    else puzzle = generate(args);
    self.postMessage({ id, puzzle });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
