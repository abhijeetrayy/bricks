// Say it better — one daily practice: five real sentences said the flat way; you pick the exact word or phrase.
import { D, ROOMS, FLOORS, loadAll, roomOf, floorOf, slug } from './data.js';
import * as S from './store.js';
import { esc, shuffle, sample, pick, gapWord, markWord, speak, speakBtn, toast, share } from './util.js';

const main = document.getElementById('main');
let cleanup = null;
const hindiOn = () => S.setting('hindi') !== false;
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const SESSION_LEN = 5;

// ================================================================ level
/** The level you are working at: your chosen start, or the first level not yet 60% started. */
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

// ================================================================ distractors
const posKey = (w) => (w.pos || '').split(/[\s/,(]/)[0].toLowerCase();
function distract(w, n = 2) {
  const others = D.words.filter((x) => x.id !== w.id && x.mean !== w.mean);
  const tiers = [
    others.filter((x) => posKey(x) === posKey(w) && x.room === w.room),
    others.filter((x) => posKey(x) === posKey(w) && Math.abs(x.floor - w.floor) <= 1),
    others.filter((x) => posKey(x) === posKey(w)),
    others,
  ];
  const out = [];
  for (const t of tiers) for (const x of shuffle(t)) if (out.length < n && !out.includes(x)) out.push(x);
  return out;
}

// ================================================================ the daily plan
function newPlan(extra) {
  const st = S.state();
  const L = level();
  const due = shuffle(S.dueIds()).map((id) => D.byId.get(id)).filter(Boolean).slice(0, extra ? 3 : 2);
  const used = new Set(due.map((w) => w.id));

  // one "upgrade the sentence" item, close to your level, not seen recently
  st.doneUp = st.doneUp || [];
  let ups = D.upgrades.map((u, i) => [u, i]).filter(([, i]) => !st.doneUp.includes(i));
  if (!ups.length) { st.doneUp = []; ups = D.upgrades.map((u, i) => [u, i]); }
  const lv = (u) => { const picks = u.parts.filter((p) => typeof p !== 'string').map((p) => D.byId.get(slug(p.pick))?.floor || 3); return picks.reduce((a, b) => a + Math.abs(b - L), 0) / picks.length; };
  ups.sort((a, b) => lv(a[0]) - lv(b[0]));
  const upI = sample(ups.slice(0, 6), 1)[0]?.[1];

  // one "say it well" phrase moment
  st.donePh = st.donePh || [];
  let sits = D.phrases.filter((p) => !st.donePh.includes(p.id));
  if (!sits.length) { st.donePh = []; sits = D.phrases; }
  const phId = sample(sits, 1)[0]?.id;

  const nNew = Math.max(1, SESSION_LEN - due.length - (upI != null ? 1 : 0) - (phId ? 1 : 0));
  let pool = D.words.filter((w) => w.floor === L && S.statusOf(w.id) === 'new' && !used.has(w.id));
  for (let f = L + 1; pool.length < nNew && f <= 5; f++) pool = pool.concat(D.words.filter((w) => w.floor === f && S.statusOf(w.id) === 'new'));
  const fresh = sample(pool, nNew);

  const words = [...fresh.map((w) => ({ t: 'w', id: w.id })), ...due.map((w) => ({ t: 'w', id: w.id, review: true }))];
  const items = [];
  if (words.length) items.push(words.shift());
  if (upI != null) items.push({ t: 'u', i: upI });
  if (words.length) items.push(words.shift());
  if (phId) items.push({ t: 'p', id: phId });
  items.push(...words);
  const plan = { date: S.today(), items, idx: 0, right: 0, of: 0, learned: [] };
  if (extra) st.extra = plan; else st.session = plan;
  S.save();
  return plan;
}
function todayPlan() {
  const st = S.state();
  return st.session?.date === S.today() ? st.session : newPlan(false);
}

// ================================================================ chrome
function render(html) {
  main.innerHTML = `<div class="enter">${html}</div>`;
  main.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); speak(b.dataset.speak); }));
}
function updateChrome(top) {
  const on = { '': 'today', practice: 'today', find: 'find', group: 'find', word: 'find', phrases: 'find', me: 'me', about: 'me' }[top] ?? '';
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
  const sits = D.phrases.filter((s) => has(s.title) || has(s.when) || s.phrases.some((p) => has(p.p)));
  return { better: better.slice(0, 10), words: words.slice(0, 6), ladders: ladders.slice(0, 2), sits: sits.slice(0, 3) };
}
function resultsHTML(r) {
  if (!r) return '';
  const row = (w, lead) => `<a class="res" href="#/word/${w.id}"><b>${esc(w.w)}</b><span>${lead ? `instead of <s>${esc(w.instead)}</s> · ` : ''}${esc(w.mean)}</span></a>`;
  let h = '';
  if (r.ladders.length) h += `<div class="res-group"><h3>From mild to strong</h3>${r.ladders.map((L) => `<div class="res"><b>${esc(L.tired)}</b><span>${L.steps.map((s) => (s.w === L.tired ? `<u>${esc(s.w)}</u>` : esc(s.w))).join(' → ')}</span></div>`).join('')}</div>`;
  if (r.better.length) h += `<div class="res-group"><h3>Say it better</h3>${r.better.map((w) => row(w, true)).join('')}</div>`;
  if (r.sits.length) h += `<div class="res-group"><h3>Phrases</h3>${r.sits.map((s) => `<a class="res" href="#/phrases/${s.id}"><b>${esc(s.title)}</b><span>“${esc(s.phrases[0].p)}”</span></a>`).join('')}</div>`;
  if (r.words.length) h += `<div class="res-group"><h3>Words</h3>${r.words.map((w) => row(w)).join('')}</div>`;
  return h || '<p class="muted">Nothing for that yet. Try a word you use too often: good, bad, said, angry, small, very big.</p>';
}
function searchBlock(id = 'q') {
  return `<div class="search">${SEARCH_ICON}<label class="sr" for="${id}">Find a better word</label>
    <input id="${id}" type="search" autocomplete="off" placeholder="very good, said, angry, not sure…"></div>
    <p class="try">Try ${['very good', 'said', 'angry', 'very small', 'disagree', 'not sure'].map((t) => `<button type="button" data-try="${t}">${t}</button>`).join(' · ')}</p>
    <div class="results" aria-live="polite"></div>`;
}
function wireSearch() {
  const input = main.querySelector('.search input'), out = main.querySelector('.results');
  if (!input) return;
  const go = () => { out.innerHTML = resultsHTML(searchAll(input.value)); };
  input.addEventListener('input', go);
  main.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.try; go(); }));
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
  <section class="hero">
    <p class="kicker">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <h1>${done ? 'Done for today.' : p.idx ? 'Pick up where you left off.' : 'Five sentences.<br>Say them better.'}</h1>
    <p class="lead">${done ? 'Today’s new words come back over the next few days, until they are yours.' : 'Real sentences, said the flat way. Pick the exact word, hear it, then say it out loud. About four minutes.'}</p>
    <div class="row"><a class="btn main big" href="#/practice${done ? '/more' : ''}">${done ? 'Five more' : p.idx ? `Continue · ${p.idx} of ${p.items.length}` : 'Start'}</a></div>
    <div class="stats">
      <div><b>${c.laid}</b><span>words yours</span></div>
      <div><b>${c.learning}</b><span>learning</span></div>
      <div><b>${st.streak?.n || 0}</b><span>day streak</span></div>
      <div><b>${L}</b><span>${esc(floorOf(L).tag)} level</span></div>
    </div>
  </section>
  <section class="block">
    <h2>Writing something?</h2>
    <p class="sub">Type the word you always end up using. Get the exact one.</p>
    ${searchBlock()}
  </section>`);
  wireSearch();
};

// ---------------------------------------------------------------- practice
V.practice = (more) => {
  const st = S.state();
  let p = more === 'more' ? (st.extra && st.extra.idx < st.extra.items.length ? st.extra : newPlan(true)) : todayPlan();
  if (!p.items.length) return render(`<div class="card"><h1>Nothing left at this level</h1><p class="lead">Move up a level in <a href="#/me">Your words</a>.</p></div>`);
  const next = () => { p.idx++; S.save(); step(); };
  const step = () => {
    if (p.idx >= p.items.length) return finish(p, more === 'more');
    const it = p.items[p.idx];
    if (it.t === 'w') wordItem(p, it, next);
    else if (it.t === 'u') upgradeItem(p, it, next);
    else phraseItem(p, it, next);
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
  // Revision shows the word in a new situation (ex2), so it is recalled, not just recognised.
  const ex = it.review && w.ex2 && gapWord(w.ex2, w.w) ? w.ex2 : w.ex;
  const g = gapWord(ex, w.w);
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
    p.of++; if (right) p.right++;
    S.save();
    const full = ex;
    main.querySelector('.sent').innerHTML = markWord(full, w.w);
    main.querySelector('.hint')?.remove();
    main.querySelector('.after').innerHTML = `
      <div class="verdict ${right ? 'good' : 'bad'}">${right ? 'Exactly.' : `Better: <b>${esc(w.w)}</b>`}</div>
      <div class="explain">
        <div class="row" style="gap:12px">${speakBtn(full, 'Hear the sentence')}<span class="muted small">Hear it, then say it out loud once.</span></div>
        <p class="mean"><b>${esc(w.w)}</b> <span class="say">${esc(w.say)}</span> — ${esc(w.mean)}</p>
        ${hindiOn() && w.hi ? `<p class="hi" lang="hi">${esc(w.hi)}</p>` : ''}
        ${!right ? `<p class="small muted"><b>${esc(chosen.w)}</b> means: ${esc(chosen.mean)}</p>` : ''}
        ${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}
      </div>
      <div class="next-row"><a class="small" href="#/word/${w.id}">More about ${esc(w.w)}</a><button class="btn main" id="next">Next</button></div>`;
    main.querySelectorAll('.after [data-speak]').forEach((x) => x.addEventListener('click', () => speak(x.dataset.speak)));
    main.querySelector('#next').onclick = next; main.querySelector('#next').focus();
  }));
}

function upgradeItem(p, it, next) {
  const parts = D.upgrades[it.i].parts;
  const slots = parts.filter((x) => typeof x !== 'string');
  let si = 0;
  const notes = [];
  // Wrong options from the same kind of word and topic make the choice worth thinking about.
  const optsFor = (s) => {
    const w = D.byId.get(slug(s.pick));
    if (!w) return shuffle(s.options);
    const near = distract(w, 2).map((x) => x.w).filter((x) => x !== s.pick);
    return shuffle([s.pick, ...(near.length === 2 ? near : s.options.filter((o) => o !== s.pick))]);
  };
  const slotOpts = slots.map(optsFor);
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

function phraseItem(p, it, next) {
  const sit = D.phrases.find((x) => x.id === it.id);
  const good = pick(sit.phrases);
  const bad = sample(sit.avoid, 2);
  const opts = shuffle([{ p: good.p, good: true }, ...bad]);
  render(frame(p, 'Say it well', `
    <p class="moment">${esc(sit.title)}</p>
    <p class="hint">${esc(sit.when)} What would you say?</p>
    <div class="opts col">${opts.map((o, k) => `<button class="opt text" data-k="${k}">“${esc(o.p)}”</button>`).join('')}</div>
    <div class="after" aria-live="polite"></div>`));
  main.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    const o = opts[+b.dataset.k], right = !!o.good;
    main.querySelectorAll('.opt').forEach((x, k) => { x.disabled = true; if (opts[k].good) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    p.of++; if (right) p.right++;
    S.state().donePh.push(sit.id); S.save();
    const also = sit.phrases.filter((x) => x !== good).slice(0, 3);
    main.querySelector('.after').innerHTML = `
      <div class="verdict ${right ? 'good' : 'bad'}">${right ? 'Yes — that works.' : 'That one lands badly.'}</div>
      <div class="explain">
        <div class="row" style="gap:12px">${speakBtn(good.p, 'Hear it')}<span><b>“${esc(good.p)}”</b></span></div>
        <p class="small muted">${esc(good.ex)}</p>
        ${bad.map((a) => `<p class="slot-note bad"><s>${esc(a.p)}</s> — ${esc(a.why)}</p>`).join('')}
        <p class="label" style="margin-top:12px">Also good</p>
        ${also.map((x) => `<p class="also">“${esc(x.p)}” <span class="tone ${x.tone}">${x.tone}</span></p>`).join('')}
      </div>
      <div class="next-row"><a class="small" href="#/phrases/${sit.id}">All phrases for this</a><button class="btn main" id="next">Next</button></div>`;
    main.querySelectorAll('.after [data-speak]').forEach((x) => x.addEventListener('click', () => speak(x.dataset.speak)));
    main.querySelector('#next').onclick = next; main.querySelector('#next').focus();
  }));
}

function finish(p, extra) {
  const learned = [...new Set(p.learned)].map((id) => D.byId.get(id)).filter(Boolean);
  const words = learned.length ? learned : D.words.filter((w) => S.statusOf(w.id) === 'learning').slice(0, 3);
  const topic = sample(D.talk, 1)[0];
  render(`<div class="practice"><div class="card done">
    <p class="kicker">${extra ? 'Five more, done' : 'Done for today'}</p>
    <h1>${p.right} of ${p.of} choices right</h1>
    ${learned.length ? `<p class="label">New words today</p><div class="chips">${learned.map((w) => `<a class="chip" href="#/word/${w.id}">${esc(w.w)}</a>`).join('')}</div>` : ''}
    ${words.length && topic ? `<div class="aloud">
      <h2>Last step: say it out loud</h2>
      <p>${esc(topic.t)}</p>
      <p class="small muted">Talk for 30 seconds, alone is fine. Try to use ${words.slice(0, 3).map((w) => `<b>${esc(w.w)}</b>`).join(', ')}.</p>
      <div class="row" style="margin-top:12px"><button class="btn" id="go30">Start 30 seconds</button><span class="clock" id="clock"></span></div>
    </div>` : ''}
    <div class="row" style="margin-top:22px"><a class="btn main" href="#/">Done</a><a class="btn" href="#/practice/more">Five more</a><button class="btn quiet" id="sh">Share</button></div>
  </div></div>`);
  main.querySelector('#sh').onclick = () => share(`I practised saying it better today: ${learned.map((w) => w.w).join(', ') || 'five sentences'}.`);
  const go = main.querySelector('#go30');
  if (go) go.onclick = () => {
    go.disabled = true;
    const end = Date.now() + 30000, clock = main.querySelector('#clock');
    const t = setInterval(() => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); clock.textContent = s ? `${s}s` : 'Well done.'; if (!s) clearInterval(t); }, 250);
    cleanup = () => clearInterval(t);
  };
}

// ---------------------------------------------------------------- find
V.find = () => {
  render(`<div class="head"><h1>Find the better word</h1><p class="lead">Search for the word you overuse, or browse by what you want to say.</p></div>
    ${searchBlock()}
    <section class="block"><h2>What do you want to say?</h2>
      <ul class="list">${ROOMS.map((r) => `<li><a href="#/group/${r.id}"><b>${esc(r.name)}</b><span>${esc(r.line)}</span></a></li>`).join('')}</ul></section>
    <section class="block"><h2>Phrases for real moments</h2>
      <ul class="list">${D.phrases.map((s) => `<li><a href="#/phrases/${s.id}"><b>${esc(s.title)}</b><span>“${esc(s.phrases[0].p)}”</span></a></li>`).join('')}</ul></section>`);
  wireSearch();
};

const stLabel = (id) => ({ new: '', learning: '<em class="tagl">learning</em>', laid: '<em class="tagy">yours</em>' })[S.statusOf(id)];
V.group = (id) => {
  const r = roomOf(id);
  if (!r) return V.notFound();
  const ws = D.byRoom.get(id) || [];
  render(`<p class="crumbs"><a href="#/find">Find</a> / ${esc(r.name)}</p>
    <div class="head"><h1>${esc(r.name)}</h1><p class="lead">${esc(r.line)}</p></div>
    ${FLOORS.map((f) => { const fw = ws.filter((w) => w.floor === f.n); return fw.length ? `<section class="block"><h2 class="lvl">${levelName(f.n)}</h2>
      <ul class="list words">${fw.map((w) => `<li><a href="#/word/${w.id}"><b>${esc(w.w)} ${stLabel(w.id)}</b><span>${esc(w.mean)}${w.instead ? ` <i>· instead of “${esc(w.instead)}”</i>` : ''}</span></a></li>`).join('')}</ul></section>` : ''; }).join('')}`);
};

V.word = (id) => {
  const w = D.byId.get(id);
  if (!w) return V.notFound();
  const r = roomOf(w.room);
  const st = S.statusOf(w.id);
  render(`<p class="crumbs"><a href="#/find">Find</a> / <a href="#/group/${w.room}">${esc(r.name)}</a></p>
    <article class="wordpage">
      <p class="kicker">${levelName(w.floor)} · ${esc(w.pos)}</p>
      <div class="row" style="gap:14px"><h1>${esc(w.w)}</h1>${speakBtn(w.w)}</div>
      <p class="say">Say it: <b>${esc(w.say)}</b></p>
      <p class="meaning">${esc(w.mean)}</p>
      ${hindiOn() && w.hi ? `<p class="hi" lang="hi">${esc(w.hi)}</p>` : ''}
      <p class="sent small-sent">${markWord(w.ex, w.w)} ${speakBtn(w.ex, 'Hear the sentence')}</p>
      ${w.ex2 ? `<p class="sent small-sent">${markWord(w.ex2, w.w)} ${speakBtn(w.ex2, 'Hear the sentence')}</p>` : ''}
      ${w.instead ? `<p class="swap"><s class="flat">${esc(w.instead)}</s> → <b>${esc(w.w)}</b></p>` : ''}
      ${w.with?.length ? `<p class="label">Goes with</p><p class="partners">${w.with.map((x) => `<span>${esc(x)}</span>`).join('')}</p>` : ''}
      ${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}
      <div class="row" style="margin-top:20px">
        ${st === 'laid' ? '<span class="tagy">This word is yours</span>' : `<button class="btn main" id="know">I already use this word</button>`}
        ${st === 'new' ? '<button class="btn" id="learn">Add to my practice</button>' : ''}
        <button class="btn quiet" id="share">Share</button></div>
    </article>`);
  main.querySelector('#know')?.addEventListener('click', () => { S.markKnown(w.id); toast(`${w.w} is yours`); V.word(id); });
  main.querySelector('#learn')?.addEventListener('click', () => { S.markLearning(w.id); toast(`${w.w} will come up in your practice`); V.word(id); });
  main.querySelector('#share').onclick = () => share(`${w.w} (${w.say}) — ${w.mean}\n“${w.ex}”`);
};

V.phrases = (id) => {
  const s = D.phrases.find((x) => x.id === id);
  if (!s) return V.find();
  render(`<p class="crumbs"><a href="#/find">Find</a> / Phrases</p>
    <div class="head"><h1>${esc(s.title)}</h1><p class="lead">${esc(s.when)}</p></div>
    <ul class="list phrases">${s.phrases.map((x) => `<li><div><b>“${esc(x.p)}”</b> <span class="tone ${x.tone}">${x.tone}</span><span>${esc(x.ex)}</span></div>${speakBtn(x.p)}</li>`).join('')}</ul>
    <section class="block"><h2>Avoid</h2>
      ${s.avoid.map((a) => `<div class="avoid"><s>${esc(a.p)}</s><p>${esc(a.why)}</p><p><b>Try:</b> ${esc(a.better)}</p></div>`).join('')}</section>`);
};

// ---------------------------------------------------------------- your words
V.me = () => {
  const st = S.state();
  const yours = D.words.filter((w) => S.statusOf(w.id) === 'laid');
  const learning = D.words.filter((w) => S.statusOf(w.id) === 'learning');
  const L = level();
  const chips = (ws) => ws.length ? `<div class="chips">${ws.map((w) => `<a class="chip" href="#/word/${w.id}">${esc(w.w)}</a>`).join('')}</div>` : '<p class="muted">None yet.</p>';
  render(`<div class="head"><h1>Your words</h1><p class="lead">A word is yours once you have got it right on a few different days. Practise daily and they move up on their own.</p></div>
    <div class="stats wide"><div><b>${yours.length}</b><span>yours</span></div><div><b>${learning.length}</b><span>learning</span></div><div><b>${S.dueIds().length}</b><span>due today</span></div><div><b>${st.streak?.n || 0}</b><span>day streak</span></div></div>
    <section class="block"><h2>Yours</h2>${chips(yours)}</section>
    <section class="block"><h2>Learning</h2>${chips(learning)}</section>
    <section class="block"><h2>Your level</h2><p class="sub">You are on ${levelName(L)}. Too easy or too hard? Choose where your practice starts.</p>
      <div class="row">${FLOORS.map((f) => `<button class="btn ${f.n === (st.floor || 1) ? 'main' : 'quiet'} sm" data-lvl="${f.n}">${f.n} · ${f.tag}</button>`).join('')}</div></section>
    <section class="block"><h2>Settings</h2>
      <label class="toggle"><span>Hindi hints</span><input type="checkbox" id="hindi" ${st.settings.hindi !== false ? 'checked' : ''}></label>
      <label class="toggle"><span>Speaker buttons</span><input type="checkbox" id="voice" ${st.settings.voice !== false ? 'checked' : ''}></label>
      <details class="more"><summary>Move your progress to another device</summary>
        <textarea id="data" rows="3"></textarea>
        <div class="row"><button class="btn sm" id="copy">Copy my progress</button><button class="btn sm" id="load">Load pasted progress</button></div></details>
      <details class="more"><summary>Start again</summary><p class="small muted">Removes all your progress from this device.</p><button class="btn sm danger" id="reset">Remove all progress</button></details>
    </section>
    <p class="small muted" style="margin-top:28px"><a href="#/about">Why this works</a> · Free, no account. Your progress stays on this device.</p>`);
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
    ['Why sentences, not word lists?', 'Most of us already recognise these words. What we lack is the habit of reaching for them. Meeting a word inside a sentence you might say yourself builds that habit.'],
    ['Why the flat version first?', 'Seeing your usual phrase (“very bad”) crossed out next to the exact word (“chaotic”) is the moment you remember next time you speak.'],
    ['Why say it out loud?', 'You only get better at speaking by speaking. Producing a word yourself fixes it far better than reading it (Swain’s output hypothesis).'],
    ['Why do words come back?', 'A word returns after 1, 3, 7, 16 and 40 days, just before you would forget it. That spacing is what makes it stay (spaced repetition).'],
    ['Why phrases too?', 'Fluent speakers reach for ready-made phrases — “I see it a little differently” — rather than building every sentence from scratch (the lexical approach).'],
    ['Which words?', `${D.words.length} high-use words that educated speakers use across every subject (“Tier 2” words), plus phrasal verbs and expressions, in five levels from everyday to rare. Inspired by Javed Akhtar: the more words you have, the bigger the house you can build.`],
  ];
  render(`<div class="head"><h1>Why this works</h1></div>${items.map(([q, a]) => `<section class="block"><h2>${q}</h2><p class="sub">${a}</p></section>`).join('')}`);
};

V.notFound = () => render(`<div class="head"><h1>No page here</h1><p class="lead"><a href="#/">Go to today</a></p></div>`);

// ================================================================ router
const ROUTES = { '': V.today, practice: V.practice, find: V.find, group: V.group, word: V.word, phrases: V.phrases, me: V.me, about: V.about,
  room: V.group, words: V.find, play: V.today, learn: V.practice, toolkit: V.find, why: V.about, settings: V.me };
function route() {
  cleanup?.(); cleanup = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [a = '', b] = path.split('/');
  (ROUTES[a] || V.notFound)(b);
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
