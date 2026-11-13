// Say it better — more words, clearer thinking, better expression.
// One daily practice of five real sentences, and all the words organised by what they help you do.
import { D, PARTS, CATS, FLOORS, loadAll, catOf, partOf, floorOf, slug, catForRoom } from './data.js';
import * as S from './store.js';
import { esc, shuffle, sample, gapWord, markWord, speak, speakBtn, toast, share } from './util.js';

const main = document.getElementById('main');
let cleanup = null;
const hindiOn = () => S.setting('hindi') !== false;
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const SESSION_LEN = 5;
const IDEA = 'The more words you have, the more clearly you can think, and the better you can say what you mean.';

// ================================================================ level
function level() {
  const st = S.state();
  for (const f of FLOORS) {
    if (f.n < (st.floor || 1)) continue;
    const c = S.counts(D.byFloor.get(f.n).map((w) => w.id));
    if ((c.laid + c.learning) / Math.max(1, c.total) < 0.6) return f.n;
  }
  return 5;
}
const levelName = (n) => `Level ${n} · ${floorOf(n).tag}`;
const tintOf = (catId) => partOf(catOf(catId)?.part)?.tint || 't3';

// ================================================================ wrong options
const posKey = (w) => (w.pos || '').split(/[\s/,(]/)[0].toLowerCase();
function distract(w, n = 2) {
  const others = D.words.filter((x) => x.id !== w.id && x.mean !== w.mean);
  const tiers = [
    others.filter((x) => posKey(x) === posKey(w) && x.cat === w.cat),
    others.filter((x) => posKey(x) === posKey(w) && Math.abs(x.floor - w.floor) <= 1),
    others.filter((x) => posKey(x) === posKey(w)),
    others,
  ];
  const out = [];
  for (const t of tiers) for (const x of shuffle(t)) if (out.length < n && !out.includes(x)) out.push(x);
  return out;
}

// ================================================================ the daily plan
function pickWords(pool, n, L, used) {
  let fresh = pool.filter((w) => w.floor <= L && S.statusOf(w.id) === 'new' && !used.has(w.id));
  for (let f = L + 1; fresh.length < n && f <= 5; f++) fresh = fresh.concat(pool.filter((w) => w.floor === f && S.statusOf(w.id) === 'new' && !used.has(w.id)));
  fresh.sort((a, b) => Math.abs(a.floor - L) - Math.abs(b.floor - L));
  return sample(fresh.slice(0, Math.max(n * 3, 12)), n);
}

/** kind: 'day' (today's five), 'more', or 'cat' (one category). */
function newPlan(kind = 'day', focus = null) {
  const st = S.state();
  const L = level();
  const pool = kind === 'cat' ? (D.byCat.get(focus) || []) : D.words;
  const inPool = new Set(pool.map((w) => w.id));
  const due = shuffle(S.dueIds().filter((id) => inPool.has(id))).map((id) => D.byId.get(id)).filter(Boolean).slice(0, 2);
  const used = new Set(due.map((w) => w.id));
  let upI = null;
  if (kind !== 'cat' && D.upgrades.length) {
    st.doneUp = st.doneUp || [];
    let ups = D.upgrades.map((u, i) => [u, i]).filter(([, i]) => !st.doneUp.includes(i));
    if (!ups.length) { st.doneUp = []; ups = D.upgrades.map((u, i) => [u, i]); }
    const lv = (u) => { const picks = u.parts.filter((p) => typeof p !== 'string').map((p) => D.byId.get(slug(p.pick))?.floor || 3); return picks.reduce((a, b) => a + Math.abs(b - L), 0) / picks.length; };
    ups.sort((a, b) => lv(a[0]) - lv(b[0]));
    upI = sample(ups.slice(0, 8), 1)[0]?.[1] ?? null;
  }
  const nNew = Math.max(1, SESSION_LEN - due.length - (upI != null ? 1 : 0));
  const fresh = pickWords(pool, nNew, L, used);
  const ws = [...fresh.map((w) => ({ t: 'w', id: w.id })), ...due.map((w) => ({ t: 'w', id: w.id, review: true }))];
  const items = [];
  if (ws.length) items.push(ws.shift());
  if (ws.length) items.push(ws.shift());
  if (upI != null) items.push({ t: 'u', i: upI });
  items.push(...ws);
  const plan = { date: S.today(), kind, focus, items, idx: 0, right: 0, of: 0, learned: [] };
  if (kind === 'day') st.session = plan; else st.extra = plan;
  S.save();
  return plan;
}
function todayPlan() {
  const st = S.state();
  const ok = st.session?.date === S.today() && st.session.kind === 'day' && st.session.items.every((it) => it.t === 'w' || it.t === 'u');
  return ok ? st.session : newPlan('day');
}

// ================================================================ chrome
function render(html) {
  main.innerHTML = `<div class="enter">${html}</div>`;
  main.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); speak(b.dataset.speak); }));
}
function updateChrome(top) {
  const on = { '': 'today', practice: 'today', words: 'words', cat: 'words', word: 'words', me: 'me', about: 'me' }[top] ?? '';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === on));
}

// ================================================================ search
function searchAll(raw) {
  const q = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (q.length < 2) return null;
  const has = (s) => (s || '').toLowerCase().includes(q);
  const qWords = q.split(' ').filter((x) => x.length > 2 && !['very', 'the', 'and', 'too', 'really', 'quite'].includes(x));
  const better = [], words = [];
  for (const w of D.words) {
    const inst = (w.instead || '').toLowerCase();
    const instWords = inst.split(/[^a-z]+/);
    if (inst && (inst.includes(q) || (q.length > 3 && q.includes(inst)) || (instWords.length <= 3 && qWords.some((t) => instWords.includes(t))))) better.push(w);
    else if (w.w.toLowerCase().startsWith(q) || has(w.mean)) words.push(w);
  }
  const ladders = D.ladders.filter((L) => L.tired === q || qWords.includes(L.tired) || L.steps.some((s) => s.w === q));
  return { better: better.slice(0, 10), words: words.slice(0, 8), ladders: ladders.slice(0, 2) };
}
function resultsHTML(r) {
  if (!r) return '';
  const row = (w, lead) => `<a class="res" href="#/word/${w.id}"><b>${esc(w.w)}</b><span>${lead ? `instead of <s>${esc(w.instead)}</s> · ` : ''}${esc(w.mean)}</span></a>`;
  let h = '';
  if (r.ladders.length) h += `<div class="res-group"><h3>FROM MILD TO STRONG</h3>${r.ladders.map((L) => `<div class="res"><b>${esc(L.tired)}</b><span>${L.steps.map((s) => (s.w === L.tired ? `<u>${esc(s.w)}</u>` : esc(s.w))).join(' → ')}</span></div>`).join('')}</div>`;
  if (r.better.length) h += `<div class="res-group"><h3>SAY IT BETTER</h3>${r.better.map((w) => row(w, true)).join('')}</div>`;
  if (r.words.length) h += `<div class="res-group"><h3>WORDS</h3>${r.words.map((w) => row(w)).join('')}</div>`;
  return h || '<p class="muted">Nothing for that yet. Try a word you use too often: good, bad, said, angry, small, very big.</p>';
}
function searchBlock(id = 'q') {
  return `<div class="search">${SEARCH_ICON}<label class="sr" for="${id}">Find a better word</label>
    <input id="${id}" type="search" autocomplete="off" placeholder="Type a word you overuse: very good, said, angry…"></div>
    <p class="try">Try ${['very good', 'said', 'angry', 'very small', 'not sure', 'sad'].map((t) => `<button type="button" data-try="${t}">${t}</button>`).join(' · ')}</p>
    <div class="results" aria-live="polite"></div>`;
}
function wireSearch() {
  const input = main.querySelector('.search input'), out = main.querySelector('.results');
  if (!input) return;
  const go = () => { out.innerHTML = resultsHTML(searchAll(input.value)); };
  input.addEventListener('input', go);
  main.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.try; go(); }));
}

// ================================================================ shared pieces
const started = (ws) => { const c = S.counts(ws.map((w) => w.id)); return c.laid + c.learning; };
const partColor = (catId) => partOf(catOf(catId)?.part)?.color || '#1C1D1F';
const brickCls = (id) => ({ new: 'empty', learning: 'half', laid: '' })[S.statusOf(id)];
let justLaid = new Set();

/** The wall: one brick per word you have started, coloured by part, laid in running bond from the bottom up. */
function wallHTML(per = 24, minRows = 3) {
  const st = S.state();
  const log = st.laidLog || [];
  const rank = (id) => { const i = log.indexOf(id); return i < 0 ? 1e6 : i; };
  const owned = D.words.filter((w) => S.statusOf(w.id) !== 'new')
    .sort((a, b) => (S.statusOf(a.id) === 'laid' ? 0 : 1) - (S.statusOf(b.id) === 'laid' ? 0 : 1) || rank(a.id) - rank(b.id));
  const slots = Math.max(minRows * per, Math.ceil((owned.length + per) / per) * per);
  const bricks = [];
  for (let k = 0; k < slots; k++) {
    const w = owned[k];
    bricks.push(w ? `<i class="p-${catOf(w.cat).part}${S.statusOf(w.id) === 'learning' ? ' learning' : ''}${justLaid.has(w.id) ? ' new-brick' : ''}" title="${esc(w.w)}"></i>` : '<i></i>');
  }
  const courses = [];
  for (let r = 0; r < slots / per; r++) courses.push(`<div class="course ${r % 2 ? 'off' : ''}" style="--n:${per}">${bricks.slice(r * per, (r + 1) * per).join('')}</div>`);
  justLaid = new Set();
  return `<div class="wall" aria-label="${owned.length} words in your wall">${courses.reverse().join('')}</div>`;
}

function areaRow(c) {
  const ws = D.byCat.get(c.id) || [];
  const n = started(ws);
  const samples = ws.filter((w) => w.floor <= 3 && !w.w.includes(' '));
  const pick3 = [samples[1], samples[5], samples[9]].filter(Boolean).map((w) => esc(w.w)).join(' · ');
  return `<li><a href="#/cat/${c.id}"><b>${esc(c.name)}</b><span class="samples">${pick3}</span>
    <span class="meter"><span class="brick ${n ? '' : 'empty'}" style="--c:${partColor(c.id)}"></span>${n}/${ws.length}</span></a></li>`;
}

// ================================================================ views
const V = {};

V.today = () => {
  const p = todayPlan();
  const done = p.idx >= p.items.length;
  const st = S.state();
  const c = S.counts(D.words.map((w) => w.id));
  const L = level();
  render(`
  <div class="home">
    <div class="today">
      <p class="kicker">Today · ${levelName(L)}</p>
      <h1>${done ? 'Done for today.' : p.idx ? 'Pick up where you left off.' : 'Five sentences today.'}</h1>
      <p class="lead">${done ? 'Your new words come back over the next few days, until they are yours.' : 'Each one is said the flat way. You find the exact word, hear it, and say it out loud. About four minutes.'}</p>
      <div class="row"><a class="btn main" href="#/practice${done ? '/more' : ''}">${done ? 'Five more' : p.idx ? `Continue · ${p.idx} of ${p.items.length}` : 'Start'}</a></div>
      <div class="stats"><div><b>${c.laid}</b><span>words yours</span></div><div><b>${c.learning}</b><span>learning</span></div><div><b>${st.streak?.n || 0}</b><span>day streak</span></div></div>
      <div class="parts">${PARTS.map((pt) => { const ws = D.words.filter((w) => catOf(w.cat).part === pt.id); return `<a href="#/words" style="--c:${pt.color}"><span class="sq"></span>${esc(pt.title)}<span>${started(ws)} / ${ws.length}</span></a>`; }).join('')}</div>
    </div>
    <div>
      ${wallHTML(20, 6)}
      <p class="wall-note">${c.laid + c.learning ? `<b>${c.laid + c.learning} bricks</b> in your wall. Every word you learn lays one more.` : 'Your wall is empty. Every word you learn lays one brick.'}</p>
      <p class="quote">“With fewer bricks, you can only build a small house.”<small>After Javed Akhtar, <a href="https://www.ted.com/talks/javed_akhtar_the_gift_of_words" target="_blank" rel="noopener">The gift of words</a>. ${IDEA}</small></p>
    </div>
  </div>
  <div class="block"><h2>Writing something?</h2><p class="sub">Type the word you always end up using. Get the exact one.</p>${searchBlock()}</div>`);
  wireSearch();
};

// ---------------------------------------------------------------- practice
V.practice = (kind, focus) => {
  const st = S.state();
  kind = kind === 'more' ? 'more' : kind === 'cat' && catOf(focus) ? 'cat' : 'day';
  let p;
  if (kind === 'day') p = todayPlan();
  else p = st.extra && st.extra.kind === kind && (st.extra.focus || null) === (focus || null) && st.extra.idx < st.extra.items.length ? st.extra : newPlan(kind, focus || null);
  if (!p.items.length) return render(`<div class="practice"><div class="card"><h1>Nothing new here right now</h1><p class="lead">You have met every word in this set. Try another area, or move up a level in <a href="#/me">You</a>.</p></div></div>`);
  const next = () => { p.idx++; S.save(); step(); };
  const step = () => {
    if (p.idx >= p.items.length) return finish(p, kind !== 'day');
    const it = p.items[p.idx];
    if (it.t === 'u') upgradeItem(p, it, next); else wordItem(p, it, next);
    window.scrollTo({ top: 0 });
  };
  step();
};

function frame(p, kicker, body) {
  const dots = p.items.map((_, k) => `<i class="${k < p.idx ? 'done' : k === p.idx ? 'now' : ''}"></i>`).join('');
  return `<div class="practice">
    <div class="ptop"><div class="dots" aria-label="Sentence ${p.idx + 1} of ${p.items.length}">${dots}</div><a class="close" href="#/" aria-label="Stop for now">✕</a></div>
    <div class="card"><p class="kicker">${kicker}</p>${body}</div></div>`;
}

function wordItem(p, it, next) {
  const w = D.byId.get(it.id);
  if (!w) return next();
  // Revision shows the word in a new situation (ex2), so it is recalled, not just recognised.
  const ex = it.review && w.ex2 && gapWord(w.ex2, w.w) ? w.ex2 : w.ex;
  const g = gapWord(ex, w.w) || { before: '', word: w.w, after: '' };
  const opts = shuffle([w, ...distract(w)]);
  render(frame(p, it.review ? 'Remember this one?' : 'Say it better', `
    <p class="sent">${esc(g.before)}${w.instead ? `<s class="flat">${esc(w.instead)}</s> ` : ''}<span class="blank"></span>${esc(g.after)}</p>
    ${w.instead ? '' : `<p class="hint">Hint: ${esc(w.mean)}</p>`}
    <div class="opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.w)}</button>`).join('')}</div>
    <div class="after" aria-live="polite"></div>`));
  main.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    const chosen = opts[+b.dataset.k], right = chosen === w;
    main.querySelectorAll('.opt').forEach((x, k) => { x.disabled = true; if (opts[k] === w) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    if (it.review) S.answer(w.id, right); else { S.markLearning(w.id); p.learned.push(w.id); }
    if (right) justLaid.add(w.id);
    p.of++; if (right) p.right++;
    S.save();
    main.querySelector('.sent').innerHTML = markWord(ex, w.w);
    main.querySelector('.hint')?.remove();
    main.querySelector('.after').innerHTML = `
      <div class="verdict ${right ? 'good' : 'bad'}">${right ? `<span class="brick" style="--c:${partColor(w.cat)}"></span>Exactly. One more brick: ${esc(w.w)}` : `Better: <b>${esc(w.w)}</b>`}</div>
      <div class="explain">
        <div class="row" style="gap:12px">${speakBtn(ex, 'Hear the sentence')}<span class="muted small">Hear it, then say it out loud once.</span></div>
        <p class="mean"><b>${esc(w.w)}</b> <span class="say">${esc(w.say)}</span> — ${esc(w.mean)}</p>
        ${hindiOn() && w.hi ? `<p class="hi" lang="hi">${esc(w.hi)}</p>` : ''}
        ${!right ? `<p class="small"><b>${esc(chosen.w)}</b> means: ${esc(chosen.mean)}</p>` : ''}
        ${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}
      </div>
      <div class="next-row"><a href="#/word/${w.id}">More about ${esc(w.w)}</a><button class="btn main" id="next">Next</button></div>`;
    main.querySelectorAll('.after [data-speak]').forEach((x) => x.addEventListener('click', () => speak(x.dataset.speak)));
    main.querySelector('#next').onclick = next; main.querySelector('#next').focus();
  }));
}

function upgradeItem(p, it, next) {
  const parts = D.upgrades[it.i]?.parts;
  if (!parts) return next();
  const slots = parts.filter((x) => typeof x !== 'string');
  let si = 0;
  const notes = [];
  // Wrong options from the same kind of word and area make every choice worth thinking about.
  const slotOpts = slots.map((s) => {
    const w = D.byId.get(slug(s.pick));
    const near = w ? distract(w, 2).map((x) => x.w).filter((x) => x !== s.pick) : [];
    return shuffle([s.pick, ...(near.length === 2 ? near : s.options.filter((o) => o !== s.pick))]);
  });
  const sentence = () => parts.map((x) => {
    if (typeof x === 'string') return esc(x);
    const k = slots.indexOf(x);
    if (k < si) return `<mark class="ok">${esc(x.pick)}</mark>`;
    if (k === si) return `<s class="flat">${esc(x.tired)}</s> <span class="blank"></span>`;
    return `<s class="flat">${esc(x.tired)}</s>`;
  }).join('');
  const draw = () => {
    const done = si >= slots.length;
    const plain = parts.map((x) => (typeof x === 'string' ? x : x.pick)).join('');
    render(frame(p, 'Upgrade the whole sentence', `
      <p class="sent">${sentence()}</p>
      ${done ? '' : `<p class="hint">Replace “${esc(slots[si].tired)}”</p><div class="opts">${slotOpts[si].map((o) => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
      <div class="after">${notes.join('')}${done ? `
        <div class="explain"><div class="row" style="gap:12px">${speakBtn(plain, 'Hear the sentence')}<span class="muted small">Now read the whole sentence out loud.</span></div></div>
        <div class="next-row"><span></span><button class="btn main" id="next">Next</button></div>` : ''}</div>`));
    main.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
      const s = slots[si], right = b.dataset.o === s.pick;
      const w = D.byId.get(slug(s.pick));
      if (w) { if (right) S.answerGame(w.id, true); else S.markLearning(w.id); if (S.statusOf(w.id) !== 'new' && !p.learned.includes(w.id)) p.learned.push(w.id); }
      p.of++; if (right) p.right++;
      notes.push(`<p class="slot-note ${right ? 'good' : 'bad'}">${right ? '✓' : `✗ You chose “${esc(b.dataset.o)}”. Better:`} <b class="better">${esc(s.pick)}</b> — ${esc(s.why)}</p>`);
      si++; S.save(); draw();
    }));
    main.querySelectorAll('[data-speak]').forEach((x) => x.addEventListener('click', () => speak(x.dataset.speak)));
    const n = main.querySelector('#next');
    if (n) { n.onclick = () => { S.state().doneUp.push(it.i); next(); }; n.focus(); }
  };
  draw();
}

function finish(p, extra) {
  const learned = [...new Set(p.learned)].map((id) => D.byId.get(id)).filter(Boolean);
  const topic = sample(D.talk, 1)[0];
  render(`<div class="practice"><div class="card done">
    <p class="kicker">${extra ? 'Five more, done' : 'Done for today'}</p>
    <h1>${p.right} of ${p.of} right</h1>
    ${learned.length ? `<p class="label">New bricks today</p><div class="chips">${learned.map((w) => `<a class="chip" href="#/word/${w.id}" style="--c:${partColor(w.cat)}"><span class="brick"></span>${esc(w.w)}</a>`).join('')}</div>` : ''}
    ${learned.length && topic ? `<div class="aloud">
      <h2>Last step: use them out loud</h2>
      <p>${esc(topic.t)}</p>
      <p class="small muted">Talk for 30 seconds, alone is fine. Try to use ${learned.slice(0, 3).map((w) => `<b>${esc(w.w)}</b>`).join(', ')}. A word becomes yours when you use it.</p>
      <div class="row" style="margin-top:12px"><button class="btn" id="go30">Start 30 seconds</button><span class="clock" id="clock"></span></div>
    </div>` : ''}
    <div style="margin-top:22px">${wallHTML(24, 2)}</div>
    <div class="row" style="margin-top:22px"><a class="btn main" href="#/">See your wall</a><a class="btn" href="#/practice/more">Five more</a><button class="btn quiet" id="sh">Share</button></div>
  </div></div>`);
  main.querySelector('#sh').onclick = () => share(`New words I practised today: ${learned.map((w) => w.w).join(', ') || 'five sentences'}.`);
  const go = main.querySelector('#go30');
  if (go) go.onclick = () => {
    go.disabled = true;
    const end = Date.now() + 30000, clock = main.querySelector('#clock');
    const t = setInterval(() => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); clock.textContent = s ? `${s}s` : 'Well done.'; if (!s) clearInterval(t); }, 250);
    cleanup = () => clearInterval(t);
  };
}

// ---------------------------------------------------------------- words
V.words = () => {
  render(`<div class="wordshead">
      <div><h1>Words</h1><p class="lead">${IDEA}</p></div>
      <div class="wallmini">${wallHTML(24, 2)}</div>
    </div>
    ${searchBlock()}
    ${PARTS.map((part) => `<section class="part" style="--c:${part.color}">
      <div class="part-h"><span class="sq"></span><h2>${esc(part.title)}</h2></div><p>${esc(part.line)}</p>
      <ul class="areas">${CATS.filter((cat) => cat.part === part.id).map(areaRow).join('')}</ul></section>`).join('')}`);
  wireSearch();
};

V.cat = (id, lvl) => {
  const c = catOf(id) || catOf(catForRoom(id));
  if (!c) return V.words();
  if (c.id !== id) { location.replace(`#/cat/${c.id}`); return; }
  const part = partOf(c.part);
  const ws = D.byCat.get(c.id) || [];
  const L = FLOORS.some((f) => String(f.n) === lvl) ? +lvl : 0;
  const shown = L ? ws.filter((w) => w.floor === L) : ws;
  render(`<div style="--c:${part.color}">
    <p class="crumbs"><a href="#/words">Words</a> / ${esc(part.title)}</p>
    <div class="areahead">
      <p class="part-tag"><span class="brick"></span>${esc(part.title)}</p>
      <h1>${esc(c.name)}</h1><p class="lead">${esc(c.line)}</p>
      <div class="row"><a class="btn main" href="#/practice/cat/${c.id}">Practise these</a><span class="muted small">${started(ws)} of ${ws.length} in your wall</span></div>
    </div>
    <div class="levels-bar" aria-label="Filter by level">
      <a class="${L ? '' : 'on'}" href="#/cat/${c.id}">All<i>${ws.length}</i></a>
      ${FLOORS.map((f) => { const k = ws.filter((w) => w.floor === f.n).length; return k ? `<a class="${L === f.n ? 'on' : ''}" href="#/cat/${c.id}/${f.n}">${f.tag}<i>${k}</i></a>` : ''; }).join('')}
    </div>
    <ul class="wlist">${shown.map((w) => `<li><a href="#/word/${w.id}"><span class="brick ${brickCls(w.id)}"></span><b>${esc(w.w)}</b><span>${esc(w.mean)}</span>${w.instead ? `<em>instead of <s>${esc(w.instead)}</s></em>` : ''}</a></li>`).join('')}</ul>
    <div class="more-areas"><div class="h"><h2>More in ${esc(part.title)}</h2></div><ul class="areas">${CATS.filter((x) => x.part === c.part && x.id !== c.id).map(areaRow).join('')}</ul></div>
  </div>`);
};

V.word = (id) => {
  const w = D.byId.get(id);
  if (!w) return V.notFound();
  const c = catOf(w.cat), part = partOf(c.part);
  const ws = D.byCat.get(c.id);
  const i = ws.indexOf(w), prev = ws[i - 1], nxt = ws[i + 1];
  const st = S.statusOf(w.id);
  render(`<div class="wordpage" style="--c:${part.color}">
    <p class="crumbs"><a href="#/words">Words</a> / <a href="#/cat/${c.id}">${esc(c.name)}</a></p>
    <p class="part-tag"><span class="brick"></span>${esc(c.name)} · ${levelName(w.floor)} · ${esc(w.pos)}</p>
    <h1>${esc(w.w)}</h1>
    <div class="sayrow">${speakBtn(w.w)}<span>${esc(w.say)}</span></div>
    <p class="meaning">${esc(w.mean)}</p>
    ${hindiOn() && w.hi ? `<p class="hi" lang="hi">${esc(w.hi)}</p>` : ''}
    <p class="status"><span class="brick ${brickCls(w.id)}"></span>${st === 'laid' ? 'In your wall' : st === 'learning' ? 'Learning: it comes back for practice' : 'Not in your wall yet'}</p>
    ${w.instead ? `<div class="wsec"><p class="label">Instead of saying</p><p class="swap-line"><s>${esc(w.instead)}</s><span class="muted">→</span><b>${esc(w.w)}</b></p></div>` : ''}
    <div class="wsec"><p class="label">In a sentence</p>
      <div class="ex-row"><p class="sent">${markWord(w.ex, w.w)}</p>${speakBtn(w.ex, 'Hear the sentence')}</div>
      ${w.ex2 ? `<div class="ex-row"><p class="sent">${markWord(w.ex2, w.w)}</p>${speakBtn(w.ex2, 'Hear the sentence')}</div>` : ''}</div>
    ${w.with?.length || w.note ? `<div class="wsec">${w.with?.length ? `<p class="label">Words that go with it</p><p class="partners">${w.with.map((x) => `<span>${esc(x)}</span>`).join('')}</p>` : ''}${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}</div>` : ''}
    <div class="row" style="margin-top:28px">
      ${st === 'laid' ? '' : `<button class="btn main" id="know">I already use this word</button>`}
      ${st === 'new' ? '<button class="btn" id="learn">Add to my practice</button>' : ''}
      <button class="btn quiet" id="share">Share</button></div>
    <div class="pager">${prev ? `<a href="#/word/${prev.id}"><small>Previous</small>${esc(prev.w)}</a>` : '<span></span>'}${nxt ? `<a href="#/word/${nxt.id}" class="r"><small>Next</small>${esc(nxt.w)}</a>` : '<span></span>'}</div>
  </div>`);
  main.querySelector('#know')?.addEventListener('click', () => { S.markKnown(w.id); justLaid.add(w.id); toast(`One more brick: ${w.w}`); V.word(id); });
  main.querySelector('#learn')?.addEventListener('click', () => { S.markLearning(w.id); toast(`${w.w} will come up in your practice`); V.word(id); });
  main.querySelector('#share').onclick = () => share(`${w.w} (${w.say}) — ${w.mean}\n“${w.ex}”`);
};

// ---------------------------------------------------------------- you
V.me = () => {
  const st = S.state();
  const yours = D.words.filter((w) => S.statusOf(w.id) === 'laid');
  const learning = D.words.filter((w) => S.statusOf(w.id) === 'learning');
  const L = level();
  const chips = (ws) => ws.length ? `<div class="chips">${ws.map((w) => `<a class="chip" href="#/word/${w.id}" style="--c:${partColor(w.cat)}"><span class="brick ${brickCls(w.id)}"></span>${esc(w.w)}</a>`).join('')}</div>` : '<p class="muted">None yet. They appear as you practise.</p>';
  render(`<div class="narrow"><div class="pagehead"><h1>Your wall</h1><p class="lead">A word becomes yours once you have got it right on a few different days.</p></div>
    ${wallHTML(24, 4)}
    <div class="stats four"><div><b>${yours.length}</b><span>yours</span></div><div><b>${learning.length}</b><span>learning</span></div><div><b>${S.dueIds().length}</b><span>due today</span></div><div><b>${st.streak?.n || 0}</b><span>day streak</span></div></div>
    <div class="h"><h2>Yours</h2></div>${chips(yours)}
    <div class="h"><h2>Learning</h2></div>${chips(learning)}
    <div class="h"><h2>Your level</h2></div>
    <p class="sub" style="margin-top:0">You are on ${levelName(L)}. Too easy or too hard? Choose where practice starts.</p>
    <div class="levels">${FLOORS.map((f) => `<button class="btn ${f.n === (st.floor || 1) ? 'main' : ''} sm" data-lvl="${f.n}">${f.n} · ${f.tag}</button>`).join('')}</div>
    <div class="h"><h2>Settings</h2></div>
    <div class="settings">
      <label class="toggle"><span>Hindi hints</span><input type="checkbox" id="hindi" ${st.settings.hindi !== false ? 'checked' : ''}></label>
      <label class="toggle"><span>Speaker buttons</span><input type="checkbox" id="voice" ${st.settings.voice !== false ? 'checked' : ''}></label>
      <details class="more"><summary>Move your progress to another device</summary>
        <textarea id="data" rows="3"></textarea>
        <div class="row"><button class="btn sm" id="copy">Copy my progress</button><button class="btn sm" id="load">Load pasted progress</button></div></details>
      <details class="more"><summary>Start again</summary><p class="small muted">Removes all your progress from this device.</p><button class="btn sm danger" id="reset" style="margin-top:8px">Remove all progress</button></details>
    </div>
    <p class="small muted" style="margin-top:22px"><a href="#/about">Why this works</a> · Free, no account. Your progress stays on this device.</p></div>`);
  main.querySelectorAll('[data-lvl]').forEach((b) => b.addEventListener('click', () => { S.setFloor(+b.dataset.lvl); delete S.state().session; S.save(); toast(`Practice now starts at level ${b.dataset.lvl}`); V.me(); }));
  main.querySelector('#hindi').onchange = (e) => S.setting('hindi', e.target.checked);
  main.querySelector('#voice').onchange = (e) => S.setting('voice', e.target.checked);
  const ta = main.querySelector('#data');
  main.querySelector('#copy').onclick = async () => { ta.value = S.exportText(); ta.select(); try { await navigator.clipboard.writeText(ta.value); toast('Progress copied'); } catch { toast('Select the text and copy it'); } };
  main.querySelector('#load').onclick = () => { try { S.importText(ta.value); toast('Progress loaded'); V.me(); } catch { toast('That text is not progress from this site'); } };
  main.querySelector('#reset').onclick = () => { if (confirm('Remove all your progress on this device? This cannot be undone.')) { S.reset(); toast('Progress removed'); V.me(); } };
};

V.about = () => {
  const items = [
    ['Why words?', 'You think in words. With few words, every thought comes out as “very good”, “very bad”, “I don’t know”. Each exact word you own lets you notice, think and say something more precisely. Javed Akhtar put it simply: with fewer bricks, you can only build a small house.'],
    ['Why sentences, not word lists?', 'Most of us already recognise these words. What we lack is the habit of reaching for them. Meeting a word inside a sentence you might say yourself builds that habit.'],
    ['Why the flat version first?', 'Seeing your usual phrase (“very sad”) crossed out next to the exact word (“despondent”) is the moment you remember next time you speak.'],
    ['Why say it out loud?', 'Using a word yourself fixes it far better than reading it. That is why every day ends with thirty seconds of speaking.'],
    ['Why do words come back?', 'A word returns after 1, 3, 7, 16 and 40 days, just before you would forget it. That spacing is what makes it stay.'],
    ['Which words?', `${D.words.length} high-use words that clear thinkers and good writers use in every subject, in five levels from everyday to rare. No show-off words.`],
  ];
  render(`<div class="narrow"><div class="pagehead"><h1>Why this works</h1></div>${items.map(([q, a]) => `<div class="card" style="margin-top:12px"><h2>${q}</h2><p class="sub" style="margin-bottom:0">${a}</p></div>`).join('')}</div>`);
};

V.notFound = () => render(`<div class="pagehead"><h1>No page here</h1><p class="lead"><a href="#/">Go to today</a></p></div>`);

// ================================================================ router
const toCat = (id) => V.cat(catForRoom(id) || id);
const ROUTES = { '': V.today, practice: V.practice, words: V.words, cat: V.cat, word: V.word, me: V.me, about: V.about,
  group: toCat, room: toCat, intent: toCat, find: V.words, phrases: V.words, scene: V.words, moment: V.words, play: V.today, learn: V.practice, toolkit: V.words, why: V.about, settings: V.me };
function route() {
  cleanup?.(); cleanup = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [a = '', b, c] = path.split('/');
  (ROUTES[a] || V.notFound)(b, c);
  updateChrome(a);
  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

main.innerHTML = '<p class="muted" style="padding:40px 0">Loading…</p>';
loadAll().then(() => {
  window.addEventListener('hashchange', route);
  route();
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__app = { D, S };
});
