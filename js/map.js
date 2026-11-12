// Metro drawings: the network map, one-row line minis, full strip maps, the vertical rail, the learn minimap.
import { D, ROOMS, FLOORS, roomOf } from './data.js';
import { statusOf } from './store.js';
import { esc } from './util.js';

export const ST = (id) => ({ new: 'new', learning: 'learning', laid: 'known' })[statusOf(id)];
const LIGHT = new Set(['talk', 'change', 'world']);          // light line colours need dark text
export const lineStyle = (roomId) => `--c:${roomOf(roomId)?.c || '#121417'}`;
export const roundel = (r, size = '') => `<span class="roundel ${LIGHT.has(r.id) ? 'light' : ''} ${size}" style="--c:${r.c}" aria-hidden="true">${r.code}</span>`;

function dot(cx, cy, r, st, color) {
  if (st === 'known') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#fff" stroke-width="${r * 0.45}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`;
  if (st === 'learning') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFD34D" stroke="${color}" stroke-width="${r * 0.5}"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#C9CCC6" stroke-width="${r * 0.5}"/>`;
}

// ---------------------------------------------------------------- the network (home)
// Four horizontal lines crossed by "Ways of saying", which meets each at an interchange word.
export function networkSVG() {
  const rooms = ['argue', 'think', 'feel', 'lead'].map(roomOf);
  const talk = roomOf('talk');
  const talkWords = D.byRoom.get('talk') || [];
  const ys = [80, 160, 262, 342];
  const xs = [180, 280, 380, 620, 720, 820];
  const shapes = [
    (y) => `M80,${y - 40} L120,${y} H880`, (y) => `M40,${y} H840 L880,${y + 40}`,
    (y) => `M100,${y + 40} L140,${y} H920`, (y) => `M60,${y} H800 L840,${y + 40}`,
  ];
  let lines = '', ticks = '', labels = '', hubs = '';
  rooms.forEach((r, k) => {
    const y = ys[k], up = k % 2 === 0;
    const ws = (D.byRoom.get(r.id) || []).slice(0, 6);
    lines += `<path d="${shapes[k](y)}" stroke="${r.c}" opacity=".2"/>`;
    // colour each stretch that leads into a known station
    const stops = [[k % 2 ? 40 : 120, null], [xs[0], ws[0]], [xs[1], ws[1]], [xs[2], ws[2]], [520, talkWords[k]], [xs[3], ws[3]], [xs[4], ws[4]], [xs[5], ws[5]]];
    for (let i = 1; i < stops.length; i++) {
      const w = stops[i][1];
      if (w && ST(w.id) === 'known') lines += `<path d="M${stops[i - 1][0]},${y} H${stops[i][0]}" stroke="${r.c}"/>`;
    }
    ws.forEach((w, i) => {
      const x = xs[i], st = ST(w.id);
      ticks += `<a href="#/word/${w.id}"><title>${esc(w.w)}</title><path d="M${x},${y} v${up ? -14 : 14}" stroke="${r.c}" stroke-width="5"/>${st === 'known' ? `<circle cx="${x}" cy="${y + (up ? -16 : 16)}" r="3" fill="${r.c}"/>` : ''}</a>`;
      labels += `<a href="#/word/${w.id}"><text x="${x}" y="${up ? y - 26 : y + 34}" text-anchor="middle" class="${st === 'new' ? 'dim' : ''}">${esc(w.w)}</text></a>`;
    });
  });
  // the crossing line
  lines += `<path d="M520,24 V386" stroke="${talk.c}" opacity=".25"/>`;
  ys.forEach((y, k) => {
    const w = talkWords[k];
    if (!w) return;
    const st = ST(w.id);
    if (st === 'known') lines += `<path d="M520,${y - 40} V${y + 40}" stroke="${talk.c}"/>`;
    hubs += `<a href="#/word/${w.id}"><title>${esc(w.w)}</title><circle cx="520" cy="${y}" r="11" fill="${st === 'known' ? '#121417' : '#fff'}" stroke="#121417" stroke-width="4"/>
      <text x="538" y="${y - 8}" class="${st === 'new' ? 'dim' : ''}">${esc(w.w)}</text></a>`;
  });
  return `<div class="map-wrap"><svg class="map" viewBox="0 0 960 400" role="img" aria-label="Map of five word lines">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="10">${lines}</g>
    <g stroke-linecap="round">${ticks}</g>${hubs}${labels}</svg></div>
    <div class="legend">${[...rooms, talk].map((r) => `<a href="#/room/${r.id}" style="--c:${r.c}"><i></i>${esc(r.name)}</a>`).join('')}<a href="#/words" style="--c:#C9CCC6"><i></i>+ ${ROOMS.length - 5} more lines</a></div>`;
}

// ---------------------------------------------------------------- one row per line (the board)
export function miniSVG(ws, color) {
  const step = 24, W = ws.length * step;
  let base = `<path d="M${step / 2},11 H${W - step / 2}" stroke="${color}" stroke-width="6" opacity=".2" stroke-linecap="round"/>`;
  let lit = '', dots = '';
  ws.forEach((w, i) => {
    const x = step / 2 + i * step, st = ST(w.id);
    if (st === 'known') lit += `<path d="M${Math.max(step / 2, x - step / 2)},11 H${Math.min(W - step / 2, x + step / 2)}" stroke="${color}" stroke-width="5"/>`;
    dots += dot(x, 11, 5, st, color);
  });
  return `<svg class="mini" viewBox="0 0 ${W} 22" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${base}${lit}${dots}</svg>`;
}

// ---------------------------------------------------------------- full strip map of one line (desktop)
export function stripSVG(ws, color, here) {
  const step = 44, left = 30, W = left * 2 + (ws.length - 1) * step, Y = 128;
  let lit = '', dots = '', labels = '', zones = '';
  ws.forEach((w, i) => {
    const x = left + i * step, st = ST(w.id);
    if (st === 'known') lit += `<path d="M${Math.max(left, x - step / 2)},${Y} H${Math.min(W - left, x + step / 2)}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`;
    dots += `<a href="#/word/${w.id}"><title>${esc(w.w)} — ${esc(w.mean)}</title>${w.id === here ? `<circle cx="${x}" cy="${Y}" r="15" fill="#FFD34D" opacity=".55"/>` : ''}${dot(x, Y, 8, st, color)}</a>`;
    labels += `<a href="#/word/${w.id}"><text transform="translate(${x + 4},${Y - 18}) rotate(-40)" class="${st === 'new' ? 'dim' : ''}" ${w.id === here ? 'style="font-weight:800"' : ''}>${esc(w.w)}</text></a>`;
  });
  FLOORS.forEach((f) => {
    const idx = ws.map((w, i) => (w.floor === f.n ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return;
    const a = left + idx[0] * step, b = left + idx[idx.length - 1] * step;
    zones += `<text x="${(a + b) / 2}" y="${Y + 40}" text-anchor="middle" class="zone">${f.name}</text>`;
    if (idx[0] > 0) zones += `<path d="M${a - step / 2},${Y + 18} V${Y + 46}" stroke="#C9CCC6" stroke-dasharray="3 3"/>`;
  });
  return `<svg class="stripmap" viewBox="0 0 ${W} ${Y + 54}" role="img" aria-label="Strip map of this line">
    <path d="M${left},${Y} H${W - left}" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity=".2"/>${lit}${zones}${dots}${labels}</svg>`;
}

// ---------------------------------------------------------------- the vertical rail (station lists)
export function railHTML(ws, { here, cols = false, meanings = true } = {}) {
  let html = `<ol class="rail ${cols ? 'cols' : ''}">`;
  let zone = 0;
  ws.forEach((w) => {
    if (w.floor !== zone) { zone = w.floor; const f = FLOORS[zone - 1]; html += `<li class="zone">${f.name} · ${f.tag}</li>`; }
    html += `<li class="${ST(w.id)} ${w.id === here ? 'here' : ''}"><a href="#/word/${w.id}"><i class="dot"></i><div><b>${esc(w.w)}</b>${meanings ? `<span>${esc(w.mean)}</span>` : ''}</div></a></li>`;
  });
  return html + '</ol>';
}

// ---------------------------------------------------------------- today's route as a small strip (learn)
export function minimapSVG(words, i) {
  const step = 130, left = 40, W = left * 2 + (words.length - 1) * step;
  let out = `<path d="M${left},26 H${W - left}" stroke="#121417" stroke-width="6" stroke-linecap="round" opacity=".15"/>`;
  if (i > 0) out += `<path d="M${left},26 H${left + Math.min(i, words.length - 1) * step}" stroke="#121417" stroke-width="6" stroke-linecap="round"/>`;
  words.forEach((w, k) => {
    const x = left + k * step;
    out += k === i ? `<circle cx="${x}" cy="26" r="13" fill="#FFD34D" stroke="#121417" stroke-width="4"/>`
      : `<circle cx="${x}" cy="26" r="8" fill="${k < i ? '#121417' : '#fff'}" stroke="#121417" stroke-width="4"/>`;
    out += `<text x="${x}" y="60" text-anchor="middle" class="${k === i ? 'now' : ''}">${k <= i ? esc(w.w) : '·'}</text>`;
  });
  return `<svg class="minimap" viewBox="0 0 ${W} 70" aria-hidden="true">${out}</svg>`;
}
