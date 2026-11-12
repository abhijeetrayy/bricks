// Checks every data file. Run: node bricks/scripts/check.mjs
import fs from 'node:fs';
const dir = new URL('../data/', import.meta.url);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const ROOMS = ['think','argue','doubt','feel','people','talk','lead','everyday','link','change','amount','cause','world','society'];
let bad = 0; const fail = (...m) => { bad++; console.log('✗', ...m); };
const seen = new Map(); let n = 0; const floors = [0,0,0,0,0,0];
const wre = (w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\p{L}])`, 'iu');
for (const r of ROOMS) {
  const a = read(`words-${r}.json`);
  for (const x of a) {
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
for (const m of M) { if (m.qs.length !== 3) fail('mixup', m.a, 'qs'); for (const q of m.qs) {
  if (![m.a, m.b].includes(q.a)) fail('mixup', m.a, 'answer', q.a);
  if ((q.s.match(/_{2,}/g) || []).length !== 1) fail('mixup', m.a, 'blank count', q.s); }
  const as = new Set(m.qs.map((q) => q.a)); if (as.size < 2) fail('mixup', m.a + '/' + m.b, 'every answer is the same'); }
const R = read('roots.json'); for (const r of R) if (r.words.length < 4) fail('root', r.root, 'few words');
const I = read('indian.json'); const S = read('say.json');
console.log(`${n} words · floors ${floors.slice(1).join('/')} · ${L.length} ladders · ${R.length} roots · ${M.length} mix-ups · ${I.length} Indian notes · ${S.length} say-it-right`);
console.log(bad ? `${bad} problem(s)` : 'All checks pass.');
process.exit(bad ? 1 : 0);
