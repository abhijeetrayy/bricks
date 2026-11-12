// Checks every data file. Run: node bricks/scripts/check.mjs
import fs from 'node:fs';
const dir = new URL('../data/', import.meta.url);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const ROOMS = ['think','argue','doubt','feel','people','talk','phrasal','idioms','lead','everyday','link','change','amount','cause','world','society'];
let bad = 0; const fail = (...m) => { bad++; console.log('✗', ...m); };
const seen = new Map(); let n = 0; const floors = [0,0,0,0,0,0];
const wre = (w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\p{L}])`, 'iu');
for (const r of ROOMS) {
  for (const x of read(`words-${r}.json`)) {
    n++; floors[x.floor]++;
    for (const k of ['w','floor','pos','say','mean','hi','ex']) if (!x[k]) fail(r, x.w, 'missing', k);
    if (x.room !== r) fail(r, x.w, 'room is', x.room);
    if (!(x.floor >= 1 && x.floor <= 5)) fail(r, x.w, 'floor', x.floor);
    if (!Array.isArray(x.with) || x.with.length < 2) fail(r, x.w, 'needs 2+ partners');
    if (!wre(x.w).test(x.ex)) fail(r, x.w, 'example lacks the word');
    if (x.instead && wre(x.w).test(x.instead)) fail(r, x.w, 'instead contains the word');
    if (!/[ऀ-ॿ]/.test(x.hi)) fail(r, x.w, 'hi is not Devanagari');
    if ((x.say.match(/[A-Z]{2,}/g) || []).length > 1) fail(r, x.w, 'more than one stress', x.say);
    const k = x.w.toLowerCase();
    if (seen.has(k)) fail(r, x.w, 'duplicate of', seen.get(k)); else seen.set(k, r);
  }
}
const L = read('ladders.json');
for (const l of L) { if (l.steps.length < 5 || l.steps.length > 7) fail('ladder', l.id, 'steps', l.steps.length);
  if (!l.steps.some((s) => s.w === l.tired)) fail('ladder', l.id, 'lacks tired word');
  if (new Set(l.steps.map((s) => s.w)).size !== l.steps.length) fail('ladder', l.id, 'repeat'); }
const M = read('mixups.json');
for (const m of M) { if (m.qs.length !== 3) fail('mixup', m.a, 'qs');
  for (const q of m.qs) { if (![m.a, m.b].includes(q.a)) fail('mixup', m.a, 'answer', q.a);
    if ((q.s.match(/_{2,}/g) || []).length !== 1) fail('mixup', m.a, 'blank count', q.s); }
  if (new Set(m.qs.map((q) => q.a)).size < 2) fail('mixup', m.a + '/' + m.b, 'every answer is the same'); }
const R = read('roots.json'); for (const r of R) if (r.words.length < 4) fail('root', r.root, 'few words');
const P = read('phrases.json'); const allP = new Set();
for (const s of P) { if (s.phrases.length < 5 || s.avoid.length < 2) fail('phrases', s.id, 'counts');
  for (const p of s.phrases) { if (!['casual','neutral','formal'].includes(p.tone)) fail('phrases', s.id, 'tone', p.tone); if (allP.has(p.p)) fail('phrases', 'repeat', p.p); allP.add(p.p); if (!p.ex) fail('phrases', s.id, 'no ex', p.p); }
  for (const a of s.avoid) if (!a.why || !a.better) fail('phrases', s.id, 'avoid fields', a.p); }
const U = read('upgrades.json');
for (const [i, u] of U.entries()) for (const p of u.parts) if (typeof p !== 'string') {
  if (!p.options.includes(p.pick) || p.options.length !== 3 || new Set(p.options).size !== 3) fail('upgrade', i, 'options', p.pick);
  if (!seen.has(p.pick.toLowerCase())) fail('upgrade', i, 'pick is not a headword', p.pick); }
const PA = read('partners.json');
for (const p of PA) { if ((p.s.match(/_{2,}/g) || []).length !== 1) fail('partner', p.s, 'blank'); if (p.wrong.includes(p.a) || p.wrong.length < 1) fail('partner', p.s, 'options'); }
const T = read('talk.json'); for (const t of T) for (const r of t.rooms) if (!ROOMS.includes(r)) fail('talk', t.t, 'room', r);
const I = read('indian.json'); const SA = read('say.json');
console.log(`${n} words · floors ${floors.slice(1).join('/')} · ${P.length} situations (${allP.size} phrases) · ${U.length} upgrades · ${PA.length} partners · ${T.length} talk prompts · ${L.length} ladders · ${R.length} roots · ${M.length} mix-ups · ${I.length} Indian notes · ${SA.length} say-it-right`);
console.log(bad ? `${bad} problem(s)` : 'All checks pass.');
process.exit(bad ? 1 : 0);
