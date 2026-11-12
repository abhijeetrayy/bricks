// The house: an elevation drawing. Each floor is a band of brick courses in running bond,
// one brick per word, laid from the bottom course up. Laid bricks vary slightly in colour, as real ones do.
import { D, FLOORS } from './data.js';
import { statusOf, counts } from './store.js';
import { esc } from './util.js';

const PER = 24;               // bricks per course
const BW = 40, BH = 17, M = 4; // brick width, height, mortar
const STEP = BW + M;
const W = PER * STEP - M;
const REDS = ['#B2512E', '#A9492A', '#BA5A35', '#9F4527', '#B85030', '#A64E2F'];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

function floorSVG(words, just) {
  // Build courses bottom-up; odd courses are offset by half a brick (running bond).
  const slots = [];
  let course = 0;
  const rows = [];
  while (slots.length < words.length) {
    const odd = course % 2 === 1;
    const row = [];
    const start = odd ? -STEP / 2 : 0;
    for (let x = start; x < W; x += STEP) {
      const full = x >= 0 && x + BW <= W;
      const b = { x, w: BW, full };
      row.push(b);
      if (full) slots.push(b);
    }
    rows.push(row);
    course++;
  }
  const n = rows.length;
  const H = n * (BH + M) - M;
  let out = '';
  rows.forEach((row, r) => {
    const y = H - (r + 1) * (BH + M) + M;   // course 0 at the bottom
    for (const b of row) b.y = y;
  });
  words.forEach((w, i) => { slots[i].word = w; });
  for (const row of rows) {
    for (const b of row) {
      if (!b.word) {
        // filler brick: plain wall, not a word
        out += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${BH}" rx="1.5" fill="#E6E8E2"/>`;
        continue;
      }
      const w = b.word, st = statusOf(w.id);
      let rect;
      if (st === 'laid') {
        const c = REDS[hash(w.id) % REDS.length];
        rect = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${BH}" rx="1.5" fill="${c}"/><rect x="${b.x}" y="${b.y + BH - 3}" width="${b.w}" height="3" fill="#000" opacity=".16"/>`;
      } else if (st === 'learning') {
        rect = `<rect x="${b.x + .75}" y="${b.y + .75}" width="${b.w - 1.5}" height="${BH - 1.5}" rx="1.5" fill="#FBF1D8" stroke="#C98A12" stroke-width="1.5"/>`;
      } else {
        rect = `<rect x="${b.x + .5}" y="${b.y + .5}" width="${b.w - 1}" height="${BH - 1}" rx="1.5" fill="#FAFBF8" stroke="#C3C8BD" stroke-width="1"/>`;
      }
      out += `<a href="#/word/${w.id}" class="b${just.has(w.id) ? ' just' : ''}" aria-label="${esc(w.w)}: ${st === 'new' ? 'not yet learned' : st}"><title>${esc(w.w)}</title>${rect}</a>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${words.length} bricks">${out}</svg>`;
}

const SHORT = { 1: 'Ground', 2: 'First', 3: 'Second', 4: 'Third', 5: 'Terrace' };

export function houseHTML(just = new Set()) {
  const floors = FLOORS.slice().reverse();
  let html = '<div class="house" aria-label="Your house of words">';
  html += '<div class="house-floor"><span></span><div class="parapet" aria-hidden="true"></div></div>';
  html += '<div class="house-floor"><span></span><div class="coping" aria-hidden="true"></div></div>';
  floors.forEach((f, i) => {
    const ws = D.byFloor.get(f.n) || [];
    const c = counts(ws.map((w) => w.id));
    html += `<div class="house-floor">
      <a class="lvl" href="#/floor/${f.n}"><span class="lvl-name">${SHORT[f.n]}</span><span class="lvl-n">${c.laid}/${c.total}</span></a>
      <div class="wall">${floorSVG(ws, just)}</div>
    </div>
    <div class="house-floor"><span></span><div class="slab${i === floors.length - 1 ? ' plinth' : ''}" aria-hidden="true"></div></div>`;
  });
  html += `</div>
  <div class="house-key"><span><i style="background:#B2512E"></i>laid — you know it</span><span><i style="background:#FBF1D8;box-shadow:inset 0 0 0 1.5px #C98A12"></i>being learned</span><span><i style="background:#FAFBF8;box-shadow:inset 0 0 0 1px #C3C8BD"></i>not yet</span><span>Tap any brick to open its word.</span></div>`;
  return html;
}
