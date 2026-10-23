// Zonnebloem: op het startscherm staat een kleine zonnebloem die groeit met
// het aantal dagen dat Ruby gepuzzeld heeft: zaadje → kiem → steel → knop →
// bloem → volle bloem, in stapjes tot zo'n 60 dagen. Alleen geladen als
// Zonnebloem het thema is. De rekenfuncties zijn puur (getest in Node).

// De stadia, met vanaf hoeveel gespeelde dagen.
export const STAGES = [
  { id: 'zaadje', name: 'een zaadje', from: 0 },
  { id: 'kiem', name: 'een kiempje', from: 1 },
  { id: 'steel', name: 'een steeltje', from: 5 },
  { id: 'knop', name: 'een knop', from: 15 },
  { id: 'bloem', name: 'een bloem', from: 30 },
  { id: 'volle-bloem', name: 'een volle zonnebloem', from: 45 },
];
export const FULL_DAYS = 60;

// Het aantal verschillende dagen met een opgeloste puzzel (uit het logboek).
export const playedDays = (stats) => new Set((stats.log || []).map((row) => row[0])).size;

// Hoe ver de bloem is: { stage, step (0–12, de groei in stapjes van 5 dagen), next (het volgende stadium of null) }.
export function sunflowerGrowth(days) {
  const d = Math.max(0, Math.floor(days) || 0);
  const k = STAGES.findLastIndex((s) => d >= s.from);
  return { stage: STAGES[k].id, step: Math.min(12, Math.floor(d / 5)), days: d, next: STAGES[k + 1] || null };
}

const r1 = (n) => Math.round(n * 10) / 10;

// De bloem als SVG (60 × 100). Hoe hoger `step`, hoe langer de steel en hoe groter de bloem.
export function sunflowerSvg({ stage, step }) {
  const ground = 92;
  const soil = '<ellipse cx="30" cy="94" rx="20" ry="5" fill="#7a5418"/><ellipse cx="30" cy="92.5" rx="16" ry="3" fill="#946a2a"/>';
  if (stage === 'zaadje') {
    return `${soil}<g transform="translate(30 88) rotate(-20)"><ellipse rx="3.4" ry="5" fill="#3d2a14"/><path d="M-1.2-4V4M1.2-4V4" stroke="#e8dcc0" stroke-width="0.7"/></g>`;
  }
  const h = stage === 'kiem' ? 10 : 18 + step * 4;
  const top = ground - h;
  const lean = r1(Math.min(3, step * 0.3));
  const stem = `<path d="M30 ${ground}C${30 - lean} ${r1(ground - h * 0.4)} ${30 + lean} ${r1(ground - h * 0.7)} 30 ${r1(top)}" fill="none" stroke="#4f7a1e" stroke-width="${r1(2 + step * 0.12)}" stroke-linecap="round"/>`;
  if (stage === 'kiem') {
    return `${soil}${stem}<ellipse cx="25.5" cy="${top + 1}" rx="5" ry="2.8" fill="#7fb03a" transform="rotate(-25 25.5 ${top + 1})"/><ellipse cx="34.5" cy="${top + 1}" rx="5" ry="2.8" fill="#6fa02e" transform="rotate(25 34.5 ${top + 1})"/>`;
  }
  // Blaadjes langs de steel, om en om links en rechts.
  let leaves = '';
  const pairs = Math.min(4, 1 + Math.floor(step / 3));
  for (let k = 0; k < pairs; k++) {
    const y = r1(ground - h * (0.25 + k * 0.17));
    const side = k % 2 ? 1 : -1, s = r1(0.7 + step * 0.04);
    leaves += `<path transform="translate(30 ${y}) scale(${side * s} ${s})" d="M0 0C4-7 13-8 17-5C12 1 5 3 0 0Z" fill="${k % 2 ? '#5f8f25' : '#6fa02e'}"/>`;
  }
  let head = '';
  if (stage === 'knop') {
    const b = r1(4.5 + (step - 3) * 0.7);
    head = `<g transform="translate(30 ${r1(top)})"><path d="M0 ${r1(-b * 1.7)}C${b} ${-b} ${b} ${r1(b * 0.4)} 0 ${r1(b * 0.6)}C${-b} ${r1(b * 0.4)} ${-b} ${-b} 0 ${r1(-b * 1.7)}Z" fill="#5f8f25"/><path d="M0 ${r1(-b * 1.5)}C${r1(b * 0.5)} ${r1(-b * 0.9)} ${r1(b * 0.5)} 0 0 ${r1(b * 0.3)}C${r1(-b * 0.5)} 0 ${r1(-b * 0.5)} ${r1(-b * 0.9)} 0 ${r1(-b * 1.5)}Z" fill="#ffc816"/><path d="M${-b} ${r1(b * 0.2)}L0 ${r1(-b * 0.5)}L${b} ${r1(b * 0.2)}" stroke="#4f7a1e" stroke-width="1.4" fill="none" stroke-linejoin="round"/></g>`;
  } else if (stage === 'bloem' || stage === 'volle-bloem') {
    const full = stage === 'volle-bloem';
    const R = r1(full ? 9 + (step - 9) * 0.9 : 6 + (step - 6) * 0.6);
    const n = full ? 18 : 12;
    let petals = '';
    for (let k = 0; k < n; k++) petals += `<ellipse cx="0" cy="${r1(-R * 1.05)}" rx="${r1(R * 0.32)}" ry="${r1(R * 0.62)}" transform="rotate(${r1((360 / n) * k)})"/>`;
    let seeds = '';
    if (full) for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = Math.sqrt(k / 14) * R * 0.5; seeds += `<circle cx="${r1(Math.cos(a) * rr)}" cy="${r1(Math.sin(a) * rr)}" r="0.7" fill="#c9952a"/>`; }
    head = `<g transform="translate(30 ${r1(top)})">${full ? `<g fill="#f2a900" transform="rotate(10)">${petals}</g>` : ''}<g fill="#ffc816">${petals}</g><circle r="${r1(R * 0.62)}" fill="#6b4416"/>${seeds}</g>`;
  }
  return `${soil}${leaves}${stem}${head}`;
}

// ---------- In de app ----------

const text = ({ stage, days, next }) => {
  const now = STAGES.find((s) => s.id === stage).name;
  const d = `${days} ${days === 1 ? 'dag' : 'dagen'}`;
  if (!days) return 'Er zit een zaadje in de grond. Los een puzzel op en hij gaat groeien 🌱';
  if (!next) return `Al ${d} gepuzzeld, en je zonnebloem staat in volle bloei 🌻`;
  const left = next.from - days;
  return `Al ${d} gepuzzeld: ${now}. Nog ${left} ${left === 1 ? 'dag' : 'dagen'} tot ${next.name} 🌻`;
};

// Tekent of ververst de bloem in het kopje van het startscherm.
export function home({ stats, toast }) {
  const head = document.querySelector('.home-head');
  if (!head) return;
  let btn = head.querySelector('.sunflower');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sunflower';
    btn.addEventListener('click', () => toast(btn.dataset.text, 4200));
    head.append(btn);
    head.classList.add('with-sunflower');
  }
  const g = sunflowerGrowth(playedDays(stats()));
  btn.dataset.stage = g.stage;
  btn.dataset.text = text(g);
  btn.setAttribute('aria-label', `Je zonnebloem. ${text(g)}`);
  btn.innerHTML = `<svg viewBox="0 0 60 100" aria-hidden="true">${sunflowerSvg(g)}</svg>`;
}

export function stop() {
  document.querySelector('.home-head .sunflower')?.remove();
  document.querySelector('.home-head')?.classList.remove('with-sunflower');
}
