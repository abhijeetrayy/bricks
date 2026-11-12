import { D, ROOMS, FLOORS, loadAll, roomOf, floorOf } from './data.js';
import * as S from './store.js';
import { esc, shuffle, sample, seeded, markWord, speak, speakBtn, toast, share } from './util.js';
import { Q, reviewQuestion, runQuiz, runLadder, runUpgrade } from './quiz.js';
import { houseHTML } from './house.js';

const main = document.getElementById('main');
let cleanup = null;
let justLaid = new Set();

// ---------------------------------------------------------------- helpers
const floorName = (n) => floorOf(n)?.name || '';
const stamp = (w, cls = '') => `<span class="brick ${cls}"><span class="frog">${esc(w)}</span></span>`;
const KP = { new: '', learning: 'kiln', laid: 'pakka' };
const bcls = (id) => KP[S.statusOf(id)];
const brickA = (w, extra = '') => `<a class="brick ${bcls(w.id)} ${extra}" href="#/word/${w.id}"><span class="frog">${esc(w.w)}</span></a>`;
const flipBrick = (w, back) => `<button class="flip" type="button" data-flip aria-label="${esc(w.w)} — tap to see the meaning"><span class="flip-in">
  <span class="brick ${bcls(w.id)}"><span class="frog">${esc(w.w)}</span></span>
  <span class="brick ${bcls(w.id)} flip-back"><span class="frog">${back ?? esc(w.mean)}</span></span></span></button>`;
const STATUS = { new: ['', 'kachcha — not learned yet'], learning: ['kiln', 'in the kiln — learning'], laid: ['pakka', 'pakka — you know it'] };
const statusTag = (id) => { const [c, t] = STATUS[S.statusOf(id)]; return `<span class="st ${c}">${t}</span>`; };
const hindiOn = () => S.setting('hindi') !== false;
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';

function workingFloor() {
  const st = S.state();
  for (const f of FLOORS) {
    if (f.n < (st.floor || 1)) continue;
    const c = S.counts(D.byFloor.get(f.n).map((w) => w.id));
    if (c.laid / Math.max(1, c.total) < 0.8) return f.n;
  }
  return 5;
}

function todaysWords() {
  const st = S.state();
  if (st.todayPick?.date === S.today()) return st.todayPick.ids.map((id) => D.byId.get(id)).filter(Boolean);
  const fl = workingFloor();
  const rnd = seeded('bricks-' + S.today());
  const isNew = (w) => S.statusOf(w.id) === 'new';
  let pool = D.words.filter((w) => w.floor === fl && isNew(w));
  for (let f = fl + 1; pool.length < 5 && f <= 5; f++) pool = pool.concat(D.words.filter((w) => w.floor === f && isNew(w)));
  pool = pool.map((w) => [rnd(), w]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const out = [], rooms = new Set();
  for (const w of pool) if (out.length < 5 && !rooms.has(w.room)) { out.push(w); rooms.add(w.room); }
  for (const w of pool) if (out.length < 5 && !out.includes(w)) out.push(w);
  st.todayPick = { date: S.today(), ids: out.map((w) => w.id) };
  S.save();
  return out;
}

function render(html) {
  main.innerHTML = `<div class="enter">${html}</div>`;
  wire(main);
}
function wire(root) {
  root.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); speak(b.dataset.speak); }));
  root.querySelectorAll('[data-flip]').forEach((b) => b.addEventListener('click', () => b.classList.toggle('on')));
}

function updateChrome(top) {
  const map = { '': 'home', words: 'words', rooms: 'words', room: 'words', floor: 'words', word: 'words', learn: 'home', test: 'home',
    phrases: 'phrases', play: 'play', revise: 'play', speak: 'play', toolkit: 'toolkit', settings: 'toolkit', why: 'why' };
  const on = map[top] ?? '';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === on));
  const due = S.dueIds().length;
  document.querySelectorAll('.due').forEach((b) => { b.hidden = !due; b.textContent = due > 99 ? '99+' : due; });
  const c = S.counts(D.words.map((w) => w.id));
  document.getElementById('tally').innerHTML = `<b>${c.laid}</b> / ${c.total} pakka`;
}

// ---------------------------------------------------------------- "say it better" search
function searchAll(raw) {
  const q = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (q.length < 2) return null;
  const has = (s) => (s || '').toLowerCase().includes(q);
  const qWords = q.split(' ').filter((x) => x.length > 2 && !['very', 'the', 'and', 'too', 'really', 'quite'].includes(x));
  const better = [], words = [];
  for (const w of D.words) {
    const inst = (w.instead || '').toLowerCase();
    if (inst && (inst.includes(q) || (q.length > 3 && q.includes(inst)))) better.push(w);
    else if (w.w.toLowerCase().startsWith(q) || has(w.mean) || (w.with || []).some(has)) words.push(w);
  }
  const ladders = D.ladders.filter((L) => L.tired === q || qWords.includes(L.tired) || L.steps.some((s) => s.w === q));
  const sits = D.phrases.filter((s) => has(s.title) || has(s.when) || s.phrases.some((p) => has(p.p)));
  return { better: better.slice(0, 10), words: words.slice(0, 8), ladders: ladders.slice(0, 2), sits: sits.slice(0, 4) };
}

function resultsHTML(r) {
  if (!r) return '';
  const row = (w, lead) => `<a class="res" href="#/word/${w.id}"><b>${esc(w.w)}</b><span>${lead ? `instead of <s>${esc(w.instead)}</s> — ` : ''}${esc(w.mean)}</span></a>`;
  let h = '';
  if (r.ladders.length) h += `<div class="res-group"><h3>Pick the right strength</h3>${r.ladders.map((L) =>
    `<a class="res" href="#/toolkit/ladders"><b>${esc(L.tired)}</b><span>${L.steps.map((s) => esc(s.w)).join(' → ')}</span></a>`).join('')}</div>`;
  if (r.better.length) h += `<div class="res-group"><h3>Say it better</h3>${r.better.map((w) => row(w, true)).join('')}</div>`;
  if (r.sits.length) h += `<div class="res-group"><h3>Phrases</h3>${r.sits.map((s) =>
    `<a class="res" href="#/phrases/${s.id}"><b>${esc(s.title)}</b><span>${esc(s.phrases[0].p)} · ${esc(s.phrases[1]?.p || '')}</span></a>`).join('')}</div>`;
  if (r.words.length) h += `<div class="res-group"><h3>Words</h3>${r.words.map((w) => row(w)).join('')}</div>`;
  return h || '<p class="muted">Nothing yet for that. Try a word you use too often: good, bad, said, angry, small, very big.</p>';
}

function searchBlock(id = 'q') {
  return `<div class="search">${SEARCH_ICON}<label class="sr" for="${id}">Say it better</label>
    <input id="${id}" type="search" autocomplete="off" placeholder="Type a word you overuse: good, said, angry, very big…"></div>
    <p class="try">Try: ${['very good', 'said', 'angry', 'very small', 'disagree', 'not sure', 'happy'].map((t) => `<button type="button" data-try="${t}">${t}</button>`).join(', ')}</p>
    <div class="results" aria-live="polite"></div>`;
}
function wireSearch(root) {
  const input = root.querySelector('.search input'), out = root.querySelector('.results');
  if (!input) return;
  const go = () => { out.innerHTML = resultsHTML(searchAll(input.value)); };
  input.addEventListener('input', go);
  root.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.try; go(); input.focus(); }));
}

// ---------------------------------------------------------------- views
const V = {};

V.home = () => {
  const st = S.state();
  const tw = todaysWords();
  const due = S.dueIds().length;
  const all = S.counts(D.words.map((w) => w.id));
  const nPhrases = D.phrases.reduce((n, s) => n + s.phrases.length, 0);
  render(`
  <section class="hero3">
    <div>
      <h1>Every word is a brick.</h1>
      <p class="lead">More words, clearer thinking — at work, in an argument, in life. ${D.words.length} words and ${nPhrases} phrases, chosen to make you speak and write more exactly. Not a dictionary.</p>
      <div class="kp"><span class="st">kachcha</span><span aria-hidden="true">→</span><span class="st kiln">in the kiln</span><span aria-hidden="true">→</span><span class="st pakka">pakka</span></div>
      <p class="small muted" style="margin-top:8px;max-width:52ch">Every word starts as raw clay. Learn it and it goes into the kiln. Get it right over a few days and it comes out pakka — yours for good.</p>
      <p class="source">From Javed Akhtar's talk <a href="https://www.ted.com/talks/javed_akhtar_the_gift_of_words" target="_blank" rel="noopener">“The gift of words”</a> (paraphrased): with fewer bricks you can only build a small house.</p>
    </div>
    <div>
      <p class="label" style="text-align:center">Today's five bricks · tap one to see what it means</p>
      <div class="stack">
        <div class="course3">${tw.slice(0, 2).map((w) => flipBrick(w)).join('')}</div>
        <div class="course3">${tw.slice(2).map((w) => flipBrick(w)).join('')}</div>
        <div class="ground-line" aria-hidden="true"></div>
      </div>
      <div class="stack-cta">
        <a class="btn main" href="#/learn">Fire today's bricks</a>
        ${due ? `<a class="btn dark" href="#/revise">${due} in the kiln — revise</a>` : !st.tested ? '<a class="btn quiet" href="#/test">Find my level first</a>' : ''}
        <button class="btn quiet" id="shareToday">Share</button>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-h"><h2>Your house</h2><span class="muted">${all.laid} of ${all.total} bricks pakka</span></div>
    <p class="sub">One brick for every word, five floors from everyday to rare. Watch it turn red.</p>
    ${houseHTML(justLaid)}
  </section>

  <section class="sec better">
    <div class="sec-h"><h2>Say it better</h2></div>
    <p class="sub">Type the word you always end up using. Get the exact one.</p>
    ${searchBlock()}
  </section>

  <section class="sec">
    <div class="sec-h"><h2>Rooms</h2><a href="#/words">All words →</a></div>
    <p class="sub">Words grouped by what you want to say, never A to Z. Each room fills with red as you learn it.</p>
    ${roomsList()}
  </section>

  <section class="sec">
    <div class="sec-h"><h2>Phrases for real moments</h2><a href="#/phrases">All ${D.phrases.length} →</a></div>
    <p class="sub">What to actually say when you disagree, need time to think, or have to say no.</p>
    ${sitsList(D.phrases.slice(0, 6))}
  </section>

  <section class="sec">
    <div class="sec-h"><h2>Practise</h2><a href="#/play">All ${PRACTICE.length} →</a></div>
    ${practiceList(['speak', 'upgrade', 'best', 'partners'])}
  </section>
  `);
  wireSearch(main);
  justLaid = new Set();
  main.querySelector('#shareToday').addEventListener('click', () => share(`Today's 5 English words:\n` + tw.map((w) => `• ${w.w} — ${w.mean}`).join('\n')));
};

function roomsList() {
  const n = innerWidth < 640 ? 2 : innerWidth < 980 ? 3 : 4;
  const rows = [];
  for (let i = 0; i < ROOMS.length; i += n) rows.push(ROOMS.slice(i, i + n));
  return `<div class="rwall">${rows.map((row, k) => `<div class="rcourse ${k % 2 ? 'off' : ''} ${row.length < n ? 'short' : ''}" style="--n:${n}">${row.map((r) => {
    const ws = D.byRoom.get(r.id) || [];
    const c = S.counts(ws.map((w) => w.id));
    const pct = Math.round((c.laid / Math.max(1, c.total)) * 100);
    return `<a class="rbrick ${pct > 55 ? 'lit' : ''}" href="#/room/${r.id}" title="${esc(r.line)}" style="${row.length < n ? `flex:0 1 calc((100% - 8px * ${n - 1}) / ${n})` : ''}"><span class="fire" style="width:${pct}%"></span><span class="kfill" style="left:${pct}%;width:${Math.round((c.learning / Math.max(1, c.total)) * 100)}%"></span><b>${esc(r.name)}</b><small>${c.laid}/${c.total} pakka</small></a>`;
  }).join('')}</div>`).join('')}</div>`;
}
function sitsList(list) {
  return `<ul class="contents">${list.map((s) => `<li><a href="#/phrases/${s.id}"><b>${esc(s.title)}</b><span>“${esc(s.phrases[0].p)}”</span><em>${s.phrases.length}</em></a></li>`).join('')}</ul>`;
}

V.words = () => {
  render(`<div class="page-head"><h1>Words</h1>
    <p class="lead">Grouped by what you want to say. Every room climbs five floors, from words you have seen to words strong writers use.</p></div>
    <div class="row" style="margin-bottom:6px">${FLOORS.map((f) => `<a class="tag" href="#/floor/${f.n}">${f.name}</a>`).join('')}<a class="tag" href="#/test">Find my floor</a></div>
    ${roomsList()}
    <section class="better"><h2>Looking for a word?</h2>${searchBlock('q2')}</section>`);
  wireSearch(main);
};

function wordList(ws) {
  return `<ul class="wlist">${ws.map((w) => `<li><a href="#/word/${w.id}"><i class="dot ${S.statusOf(w.id)}"></i><div><b>${esc(w.w)}</b><span>${esc(w.mean)}</span></div></a></li>`).join('')}</ul>`;
}

V.room = (id) => {
  const r = roomOf(id);
  if (!r) return V.notFound();
  const ws = D.byRoom.get(id) || [];
  const fresh = ws.filter((w) => S.statusOf(w.id) === 'new').length;
  render(`<p class="crumbs"><a href="#/words">Words</a> / ${esc(r.name)}</p>
    <div class="page-head"><h1>${esc(r.name)}</h1><p class="lead">${esc(r.line)}</p>
    <div class="row" style="margin-top:18px">${fresh ? `<a class="btn main" href="#/learn/${id}">Learn 5 new words here</a>` : ''}
      <a class="btn" href="#/play/gap/${id}">Practise: fill the gap</a><a class="btn quiet" href="#/play/instead/${id}">One better word</a></div></div>
    ${FLOORS.map((f) => { const fw = ws.filter((w) => w.floor === f.n); return fw.length ? `<section class="floor-sec"><h2>${f.name} <small>${esc(f.line)}</small></h2>${wordList(fw)}</section>` : ''; }).join('')}`);
};

V.floor = (n) => {
  n = +n; const f = floorOf(n);
  if (!f) return V.notFound();
  const ws = D.byFloor.get(n);
  render(`<p class="crumbs"><a href="#/words">Words</a> / ${f.name}</p>
    <div class="page-head"><h1>${f.name}</h1><p class="lead">${esc(f.line)}</p>
    <div class="row" style="margin-top:16px">${FLOORS.map((x) => `<a class="tag ${x.n === n ? 'on' : ''}" href="#/floor/${x.n}">${x.name}</a>`).join('')}</div></div>
    ${ROOMS.map((r) => { const rw = ws.filter((w) => w.room === r.id); return rw.length ? `<section class="floor-sec"><h2>${esc(r.name)}</h2>${wordList(rw)}</section>` : ''; }).join('')}`);
};

function sheetHTML(w, { compact = false } = {}) {
  const r = roomOf(w.room), st = S.statusOf(w.id);
  return `<article class="sheet">
    <div class="wtop">
      <div class="meta"><a href="#/room/${w.room}">${esc(r.name)}</a> · <a href="#/floor/${w.floor}">${floorName(w.floor)}</a> · ${esc(w.pos)}</div>
      <h1 class="brick big ${bcls(w.id)}"><span class="frog">${esc(w.w)}</span></h1>
      <div class="sayrow">${speakBtn(w.w)}<span>Say it: <b>${esc(w.say)}</b></span>${compact ? '' : statusTag(w.id)}</div>
    </div>
    <div class="sheet-body">
      <div><p class="meaning">${esc(w.mean)}</p>${hindiOn() && w.hi ? `<p class="hindi hi" lang="hi">${esc(w.hi)}</p>` : ''}</div>
      <div><p class="label">In a sentence</p><p class="example">${markWord(w.ex, w.w)}</p></div>
      ${w.instead ? `<div><p class="label">Use it instead of</p><div class="instead"><s>${esc(w.instead)}</s><span class="muted">→</span><b>${esc(w.w)}</b></div></div>` : ''}
      ${w.with?.length ? `<div><p class="label">Words that go with it</p><div class="partners">${w.with.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>` : ''}
      ${w.note ? `<div class="note"><b>Good to know:</b> ${esc(w.note)}</div>` : ''}
    </div>
    ${compact ? '' : `<div class="sheet-foot">
      <p class="status">${st === 'laid' ? 'This brick is pakka. It still comes back now and then, so it stays that way.' : st === 'learning' ? 'In the kiln. It comes back for revision until it is pakka.' : 'Could you use this word in a sentence today?'}</p>
      <div class="row"><button class="btn main" id="know">${st === 'laid' ? 'Pakka ✓' : 'Pakka — I know it'}</button><button class="btn clay" id="learning">Kachcha — still learning</button><button class="btn quiet" id="share">Share</button></div>
      <div class="mine"><p class="label"><label for="mine">Use it in your own sentence — the surest way to keep a word</label></p>
        <textarea id="mine" placeholder="Write a sentence about your own life with “${esc(w.w)}”…">${esc(S.state().sentences[w.id] || '')}</textarea>
        <p class="small muted">Saved on this device only.</p></div>
    </div>`}
  </article>`;
}

V.word = (id) => {
  const w = D.byId.get(id);
  if (!w) return V.notFound();
  const ws = D.byRoom.get(w.room);
  const i = ws.indexOf(w), prev = ws[i - 1], next = ws[i + 1];
  const aside = FLOORS.map((f) => {
    const fw = ws.filter((x) => x.floor === f.n);
    return fw.length ? `<p class="fl">${f.name}</p><ul>${fw.map((x) => `<li><a class="${x === w ? 'on' : ''}" href="#/word/${x.id}"><i class="dot ${S.statusOf(x.id)}"></i>${esc(x.w)}</a></li>`).join('')}</ul>` : '';
  }).join('');
  render(`<p class="crumbs"><a href="#/words">Words</a> / <a href="#/room/${w.room}">${esc(roomOf(w.room).name)}</a></p>
    <div class="word-layout"><div>${sheetHTML(w)}
      <div class="pager">${prev ? `<a class="btn quiet" href="#/word/${prev.id}">← ${esc(prev.w)}</a>` : '<span></span>'}${next ? `<a class="btn quiet" href="#/word/${next.id}">${esc(next.w)} →</a>` : ''}</div></div>
      <aside class="aside"><h3>In ${esc(roomOf(w.room).name)}</h3>${aside}</aside></div>`);
  main.querySelector('#know').onclick = () => { const r = S.markKnown(w.id); if (r.was !== 'laid') justLaid.add(w.id); toast(`Pakka: ${w.w}`); V.word(id); updateChrome('word'); };
  main.querySelector('#learning').onclick = () => { S.markLearning(w.id); toast(`${w.w} is in the kiln — back tomorrow`); V.word(id); updateChrome('word'); };
  main.querySelector('#share').onclick = () => share(`${w.w} (${w.say}) — ${w.mean}\n“${w.ex}”`);
  const ta = main.querySelector('#mine'); let t;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => S.setSentence(w.id, ta.value), 400); });
};

// ---------------------------------------------------------------- learn
V.learn = (roomId) => {
  const words = roomId ? (D.byRoom.get(roomId) || []).filter((w) => S.statusOf(w.id) === 'new').slice(0, 5) : todaysWords();
  if (!words.length) return render(`<div class="session q"><h1>Nothing new here</h1><p class="lead">You have met every word in this set. <a href="#/revise">Revise</a> or <a href="#/play">practise</a>.</p></div>`);
  const known = [];
  let i = 0;
  const step = () => {
    if (i >= words.length) return check();
    const w = words[i];
    const back = `${esc(w.mean)}${hindiOn() && w.hi ? `<span class="hi" lang="hi">${esc(w.hi)}</span>` : ''}`;
    render(`<div class="session learn-card">
      <div class="progress" style="width:100%">${words.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <p class="label">Brick ${i + 1} of ${words.length} · tap it to see the meaning</p>
      ${flipBrick(w, back)}
      <div class="sayrow row" style="justify-content:center">${speakBtn(w.w)}<span class="muted">Say it: <b style="color:var(--ink)">${esc(w.say)}</b></span></div>
      <div class="learn-more"><p class="label">In a sentence</p><p class="example">${markWord(w.ex, w.w)}</p>
        ${w.instead ? `<p class="small muted" style="margin-top:10px">Use it instead of <s>${esc(w.instead)}</s></p>` : ''}</div>
      <div class="kp-btns"><button class="btn clay" id="l">Kachcha<small>new to me</small></button><button class="btn main" id="k">Pakka<small>I know it</small></button></div></div>`);
    main.querySelector('#k').onclick = () => { known.push(w); i++; step(); };
    main.querySelector('#l').onclick = () => { i++; step(); };
    window.scrollTo({ top: 0 });
  };
  // Even "known" words get one question: a brick is laid only after a right answer.
  const check = () => {
    const qs = shuffle(words).map((w) => (w.instead && Math.random() < 0.4 ? Q.instead(w) : Q.gap(w)));
    main.innerHTML = '<div class="session"><p class="label">Quick check</p></div><div id="quiz"></div>';
    cleanup = runQuiz(main.querySelector('#quiz'), qs, {
      onDone: (res) => {
        const laid = [];
        res.forEach((r, k) => {
          const w = D.byId.get(qs[k].wordId);
          if (r.right && known.includes(w)) { const x = S.markKnown(w.id); if (x.was !== 'laid') { laid.push(w); justLaid.add(w.id); } }
          else S.markLearning(w.id);
        });
        updateChrome('learn');
        const kiln = words.filter((w) => !laid.includes(w));
        render(`<div class="session q result"><div class="big">${laid.length}</div>
          <p>brick${laid.length === 1 ? '' : 's'} came out pakka${kiln.length ? ` · ${kiln.length} went into the kiln — they come back tomorrow` : ''}</p>
          <div class="stamps">${laid.map((w) => stamp(w.w, 'pakka')).join('')}${kiln.map((w) => stamp(w.w, 'kiln')).join('')}</div>
          <div class="row" style="justify-content:center"><a class="btn main" href="#/">See your house</a><a class="btn" href="#/speak">Now say them aloud</a></div></div>`);
      },
    });
  };
  step();
};

// ---------------------------------------------------------------- revise
V.revise = () => {
  const due = S.dueIds().map((id) => D.byId.get(id)).filter(Boolean);
  if (!due.length) {
    const any = D.words.some((w) => S.statusOf(w.id) !== 'new');
    return render(`<div class="page-head"><h1>Nothing to revise right now</h1>
      <p class="lead">${any ? 'Words come back just before you would forget them: after 1 day, then 3, 7, 16 and 40 days.' : 'Learn a few words first. They come back here the next day.'}</p>
      <div class="row" style="margin-top:18px"><a class="btn main" href="#/learn">Learn today's words</a><a class="btn" href="#/play">Practise</a></div></div>`);
  }
  const batch = shuffle(due).slice(0, 12);
  main.innerHTML = '<div id="quiz"></div>';
  cleanup = runQuiz(main.querySelector('#quiz'), batch.map(reviewQuestion), {
    track: 'review',
    onDone: (res) => {
      updateChrome('revise');
      render(`<div class="session q result"><div class="big">${res.filter((r) => r.right).length}/${res.length}</div>
        <p>A right answer moves a word to a longer gap. A wrong one brings it back tomorrow.</p>
        <div class="row" style="justify-content:center;margin-top:16px">${S.dueIds().length ? '<a class="btn main" href="#/revise">Revise more</a>' : ''}<a class="btn" href="#/">Home</a></div></div>`);
    },
  });
};

// ---------------------------------------------------------------- practice
const PRACTICE = [
  { id: 'revise', name: 'Revise', line: 'Bricks in the kiln that are due today, just before you would forget them.', href: '#/revise' },
  { id: 'speak', name: 'Speak for a minute', line: 'A topic, three words to use, sixty seconds. Out loud.', href: '#/speak' },
  { id: 'upgrade', name: 'Upgrade the sentence', line: 'Turn a flat sentence into a precise one, word by word.' },
  { id: 'best', name: 'Which sounds best?', line: 'Pick the phrase that works in a real moment.' },
  { id: 'gap', name: 'Fill the gap', line: 'A real sentence with one word missing.', scoped: true },
  { id: 'instead', name: 'One better word', line: 'Swap a tired phrase like “very small” for one exact word.', scoped: true },
  { id: 'partners', name: 'Natural partners', line: 'Make a mistake or do a mistake? Heavy rain or strong rain?' },
  { id: 'ladder', name: 'Build the ladder', line: 'Put five words in order, from mildest to most extreme.' },
  { id: 'stronger', name: 'Which is stronger?', line: 'Annoyed or furious? Pick the stronger word.' },
  { id: 'mixups', name: 'Mix-ups', line: 'Affect or effect? Lose or loose?' },
  { id: 'rush', name: 'Brick rush', line: 'Sixty seconds of words and meanings.', scoped: true },
  { id: 'roots', name: 'Root hunt', line: 'Find the word that grows from a Latin or Greek root.' },
  { id: 'meaning', name: 'Word or meaning', line: 'See a word, pick its meaning — or the other way round.', scoped: true },
];
function practiceList(ids) {
  const list = ids ? ids.map((id) => PRACTICE.find((p) => p.id === id)) : PRACTICE;
  const due = S.dueIds().length;
  return `<ul class="contents">${list.map((p) => {
    const best = S.state().best[p.id];
    const em = p.id === 'revise' ? (due ? `${due} in the kiln` : '') : best ? `best ${best}` : '';
    return `<li><a href="${p.href || '#/play/' + p.id}"><b>${esc(p.name)}</b><span>${esc(p.line)}</span><em>${em}</em></a></li>`;
  }).join('')}</ul>`;
}

V.play = (gameId, scope) => {
  if (!gameId) return render(`<div class="page-head"><h1>Practise</h1>
    <p class="lead">Each practice makes you pull a word or phrase out of memory, or say it aloud. That is what makes it stay.</p></div>${practiceList()}`);
  const g = PRACTICE.find((x) => x.id === gameId && !x.href);
  if (!g) return V.notFound();
  scope = scope || 'mine';
  const pool = scope === 'all' ? D.words : scope === 'mine' ? D.words.filter((w) => w.floor <= workingFloor()) : (D.byRoom.get(scope) || D.words);
  const scopeBar = g.scoped ? `<div class="scope"><a class="tag ${scope === 'mine' ? 'on' : ''}" href="#/play/${g.id}/mine">Up to my floor</a><a class="tag ${scope === 'all' ? 'on' : ''}" href="#/play/${g.id}/all">All words</a>
    ${ROOMS.map((r) => `<a class="tag ${scope === r.id ? 'on' : ''}" href="#/play/${g.id}/${r.id}">${esc(r.name)}</a>`).join('')}</div>` : '';
  main.innerHTML = `<div class="enter"><p class="crumbs"><a href="#/play">Practise</a> / ${esc(g.name)}</p>
    <div class="page-head"><h1>${esc(g.name)}</h1><p class="lead">${esc(g.line)}</p></div>${scopeBar}<div id="quiz"></div></div>`;
  const el = main.querySelector('#quiz');
  const done = (score, of) => {
    const best = S.setBest(g.id, score);
    updateChrome('play');
    el.innerHTML = `<div class="session q result enter"><div class="big">${score}${of ? '/' + of : ''}</div>
      <p>${best ? 'Your best yet.' : `Your best: ${S.state().best[g.id] || score}`}</p>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn main" id="again">Again</button><a class="btn" href="#/play">Other practice</a><button class="btn quiet" id="sh">Share score</button></div></div>`;
    el.querySelector('#again').onclick = () => V.play(gameId, scope);
    el.querySelector('#sh').onclick = () => share(`I scored ${score}${of ? '/' + of : ''} in “${g.name}” on Bricks. Can you beat it?`);
  };
  const fin = (res) => done(res.filter((r) => r.right).length, res.length);
  if (g.scoped && pool.length < 4) { el.innerHTML = '<p class="muted">Not enough words here yet.</p>'; return; }
  switch (gameId) {
    case 'gap': cleanup = runQuiz(el, sample(pool, 10).map(Q.gap), { track: 'game', onDone: fin }); break;
    case 'instead': cleanup = runQuiz(el, sample(pool.filter((w) => w.instead), 10).map(Q.instead), { track: 'game', onDone: fin }); break;
    case 'meaning': cleanup = runQuiz(el, sample(pool, 10).map((w) => (Math.random() < 0.5 ? Q.meaning(w) : Q.word(w))), { track: 'game', onDone: fin }); break;
    case 'rush':
      el.innerHTML = `<div class="session q result"><p class="lead" style="margin:0 auto 18px">Sixty seconds. As many as you can.</p><button class="btn main" id="go">Start</button></div>`;
      el.querySelector('#go').onclick = () => {
        cleanup = runQuiz(el, [], { timed: 60, endless: () => { const w = sample(pool, 1)[0]; return Math.random() < 0.5 ? Q.meaning(w) : Q.word(w); }, onDone: (res) => done(res.filter((r) => r.right).length) });
      };
      break;
    case 'stronger': cleanup = runQuiz(el, Array.from({ length: 10 }, () => Q.stronger(sample(D.ladders, 1)[0])), { onDone: fin }); break;
    case 'ladder': runLadder(el, sample(D.ladders, 4), { onDone: done }); break;
    case 'mixups': cleanup = runQuiz(el, sample(D.mixups, 10).map(Q.mixup), { onDone: fin }); break;
    case 'roots': cleanup = runQuiz(el, sample(D.roots, 10).map(Q.root), { onDone: fin }); break;
    case 'best': cleanup = runQuiz(el, sample(D.phrases, 10).map(Q.best), { onDone: fin }); break;
    case 'partners': cleanup = runQuiz(el, sample(D.partners, 10).map(Q.partner), { onDone: fin }); break;
    case 'upgrade': runUpgrade(el, sample(D.upgrades, 5), { onDone: done }); break;
  }
};

// ---------------------------------------------------------------- speak for a minute
V.speak = () => {
  if (!D.talk.length) return V.notFound();
  const topic = sample(D.talk, 1)[0];
  const fromRooms = D.words.filter((w) => topic.rooms.includes(w.room) && w.floor <= workingFloor() + 1);
  const learning = fromRooms.filter((w) => S.statusOf(w.id) === 'learning');
  const fresh = fromRooms.filter((w) => S.statusOf(w.id) === 'new');
  const words = [...sample(learning, 2), ...sample(fresh, 3)].slice(0, 3);
  while (words.length < 3 && fromRooms.length > words.length) { const x = sample(fromRooms, 1)[0]; if (!words.includes(x)) words.push(x); }
  render(`<p class="crumbs"><a href="#/play">Practise</a> / Speak for a minute</p>
    <div class="session"><div class="q">
      <p class="label">Your topic</p>
      <p class="speak-topic">${esc(topic.t)}</p>
      <ul class="speak-asks">${topic.ask.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      <p class="label">Use these three words</p>
      <div class="today">${words.map((w) => brickA(w)).join('')}</div>
      <ul class="small muted" style="margin:0 0 6px;padding-left:20px">${words.map((w) => `<li><b>${esc(w.w)}</b> — ${esc(w.mean)}</li>`).join('')}</ul>
      <div class="clock" id="clock">60</div>
      <div class="row" style="justify-content:center"><button class="btn main" id="start">Start speaking</button><a class="btn quiet" href="#/speak" id="other">Another topic</a></div>
      <p class="small muted" style="text-align:center;margin-top:14px">Say it out loud, even alone. Don't stop to correct yourself — keep going.</p>
      <div id="after"></div>
    </div></div>`);
  main.querySelector('#other').onclick = (e) => { e.preventDefault(); V.speak(); };
  const clock = main.querySelector('#clock');
  main.querySelector('#start').onclick = (e) => {
    e.target.disabled = true;
    const end = Date.now() + 60000;
    clock.classList.add('run');
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      clock.textContent = left;
      if (!left) { clearInterval(tick); clock.classList.remove('run'); after(); }
    }, 250);
    cleanup = () => clearInterval(tick);
  };
  function after() {
    const box = main.querySelector('#after');
    box.innerHTML = `<p class="label" style="margin-top:18px">Which words did you manage to use?</p>
      <div class="ticks">${words.map((w) => `<label><input type="checkbox" value="${w.id}"> ${esc(w.w)}</label>`).join('')}</div>
      <div class="row"><button class="btn dark" id="save">Done</button></div>`;
    box.querySelector('#save').onclick = () => {
      const used = [...box.querySelectorAll('input:checked')].map((x) => x.value);
      used.forEach((id) => S.answerGame(id, true));
      S.setBest('speak', (S.state().best.speak || 0) + 1);
      updateChrome('speak');
      box.innerHTML = `<div class="feedback good">${used.length ? `You used ${used.length} of 3. Using a word out loud is the step most learners skip.` : 'Next time, try to fit in one of the three. One is enough.'}</div>
        <div class="row" style="margin-top:14px"><a class="btn main" href="#/speak" id="again">Another topic</a></div>`;
      box.querySelector('#again').onclick = (e) => { e.preventDefault(); V.speak(); };
    };
  }
};

// ---------------------------------------------------------------- phrases
V.phrases = (id) => {
  if (!id) {
    return render(`<div class="page-head"><h1>Phrases</h1>
      <p class="lead">Fluent speakers don't build every sentence from single words; they reach for ready phrases. Here are the ones for moments that matter — with what to avoid.</p>
      <div class="row" style="margin-top:18px"><a class="btn main" href="#/play/best">Practise: which sounds best?</a></div></div>
      ${sitsList(D.phrases)}`);
  }
  const s = D.phrases.find((x) => x.id === id);
  if (!s) return V.notFound();
  const i = D.phrases.indexOf(s), prev = D.phrases[i - 1], next = D.phrases[i + 1];
  render(`<p class="crumbs"><a href="#/phrases">Phrases</a> / ${esc(s.title)}</p>
    <div class="page-head"><h1>${esc(s.title)}</h1><p class="lead">${esc(s.when)}</p></div>
    <ul class="phrase-list">${s.phrases.map((p) => `<li><span class="p">${esc(p.p)}</span><span class="ex">${esc(p.ex)}</span>
      <span class="side"><span class="tone ${p.tone}">${esc(p.tone)}</span>${speakBtn(p.p).replace('class="speak"', 'class="speak sm"')}</span></li>`).join('')}</ul>
    <h2>Avoid</h2>
    <ul class="avoid-list">${s.avoid.map((a) => `<li><s>${esc(a.p)}</s><p>${esc(a.why)}</p><p class="better-say">Try: ${esc(a.better)}</p></li>`).join('')}</ul>
    <div class="pager">${prev ? `<a class="btn quiet" href="#/phrases/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn quiet" href="#/phrases/${next.id}">${esc(next.title)} →</a>` : ''}</div>`);
};

// ---------------------------------------------------------------- find your floor
const FAKES = ['plontic', 'furbate', 'vestorial', 'ascrimate', 'tropulent', 'morvish'];
V.test = () => {
  const items = [];
  for (const f of FLOORS) for (const w of sample(D.byFloor.get(f.n).filter((x) => !['phrasal', 'idioms'].includes(x.room)), 4)) items.push({ w: w.w, floor: f.n });
  for (const x of FAKES) items.push({ w: x, fake: true });
  const list = shuffle(items), yes = new Set();
  let i = 0;
  const step = () => {
    if (i >= list.length) return result();
    const it = list[i];
    render(`<div class="session"><div class="progress">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <div class="q" style="text-align:center"><div class="q-kind">Find your floor · ${i + 1} of ${list.length}</div>
        <p class="q-prompt">Could you explain this word to a friend?</p>
        <p style="margin:6px 0 28px">${stamp(it.w)}</p>
        <div class="choices cols"><button class="choice" id="n">No, or not sure</button><button class="choice" id="y">Yes, I know it</button></div>
        <p class="small muted" style="margin-top:16px">Be honest — a few of these are made-up words, to keep the test fair.</p></div></div>`);
    main.querySelector('#y').onclick = () => { yes.add(it); i++; step(); };
    main.querySelector('#n').onclick = () => { i++; step(); };
  };
  const result = () => {
    const fakeYes = list.filter((x) => x.fake && yes.has(x));
    const fa = fakeYes.length / FAKES.length;
    const per = FLOORS.map((f) => {
      const real = list.filter((x) => x.floor === f.n);
      const k = real.filter((x) => yes.has(x)).length / real.length;
      return { f, adj: fa >= 1 ? 0 : Math.max(0, (k - fa) / (1 - fa)) };
    });
    let floor = 5;
    for (const p of per) if (p.adj < 0.75) { floor = p.f.n; break; }
    S.setFloor(floor);
    render(`<div class="session q"><h1>Start on the ${floorName(floor).toLowerCase()}</h1><p class="lead">${esc(floorOf(floor).line)}</p>
      <div style="margin:22px 0;display:grid;gap:10px">${per.map((p) => `<div><div class="row" style="justify-content:space-between"><b>${p.f.name}</b><span class="muted">${Math.round(p.adj * 100)}% known</span></div><div class="timer" style="margin:4px 0 0"><i style="width:${p.adj * 100}%;background:var(--brick)"></i></div></div>`).join('')}</div>
      ${fakeYes.length ? `<p class="note">You said yes to ${fakeYes.length} made-up word${fakeYes.length > 1 ? 's' : ''} (${fakeYes.map((x) => x.w).join(', ')}), so the scores were lowered to allow for that.</p>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn main" href="#/learn">Start with today's words</a><a class="btn" href="#/floor/${floor}">See this floor</a></div></div>`);
  };
  step();
};

// ---------------------------------------------------------------- toolkit
const PARTS = [
  { id: 'ladders', name: 'Shades of strength', line: 'Annoyed → angry → furious. Choose a word of exactly the right strength.' },
  { id: 'partners', name: 'Natural partners', line: 'The words English puts together: heavy rain, make a mistake, deeply sorry.' },
  { id: 'roots', name: 'Roots', line: 'One Latin or Greek root unlocks many words — and many echo Hindi and Sanskrit.' },
  { id: 'mixups', name: 'Mix-ups', line: 'Pairs people confuse, with a rule and a memory trick.' },
  { id: 'indian', name: 'Indian English → global English', line: 'Phrases that work at home but can confuse people elsewhere.' },
  { id: 'say', name: 'Say it right', line: 'Words often said differently from most international speakers.' },
];
V.toolkit = (part) => {
  if (!part) return render(`<div class="page-head"><h1>Toolkit</h1><p class="lead">Rooms give you words. These give you control over them: strength, partners, origin, the right choice and the right sound.</p></div>
    <ul class="contents">${PARTS.map((p) => `<li><a href="#/toolkit/${p.id}"><b>${esc(p.name)}</b><span>${esc(p.line)}</span><em></em></a></li>`).join('')}
    <li><a href="#/settings"><b>Settings</b><span>Hindi hints, voice, move or reset your progress.</span><em></em></a></li></ul>`);
  const P = PARTS.find((p) => p.id === part);
  if (!P) return V.notFound();
  let body = '';
  if (part === 'ladders') body = `<div class="grid">${D.ladders.map((L) => `<div class="box"><h3>${esc(L.title)}</h3><div class="ends"><span>mildest</span><span>most extreme</span></div>
      <div class="ladder">${L.steps.map((s) => `<div class="rung ${s.w === L.tired ? 'tired' : ''}"><b>${esc(s.w)}</b><span>${esc(s.m)}</span></div>`).join('')}</div></div>`).join('')}</div>
      <p style="margin-top:20px"><a class="btn main" href="#/play/ladder">Practise: build the ladder</a></p>`;
  else if (part === 'partners') body = `<div>${D.partners.map((p) => `<div class="partner-row"><b>${esc(p.pair)}</b><span>${esc(p.s.replace(/_{2,}/, p.a))}${p.note ? ` <span class="muted">— ${esc(p.note)}</span>` : ''}</span></div>`).join('')}</div>
      <p style="margin-top:20px"><a class="btn main" href="#/play/partners">Practise: natural partners</a></p>`;
  else if (part === 'roots') body = `<p class="sub">English, Hindi and Sanskrit are cousins with shared ancestors. A yellow box means the root has a real relative in Hindi or Sanskrit.</p>
      <div class="grid">${D.roots.map((r) => `<div class="box"><div class="root">${esc(r.root)}</div><p style="margin-top:6px"><b>${esc(r.means)}</b> · <span class="muted">${esc(r.from)}</span></p>
      ${r.echo ? `<div class="echo">${esc(r.echo)}</div>` : ''}<ul>${r.words.map((w) => `<li><b>${esc(w.w)}</b> <span>— ${esc(w.m)}</span></li>`).join('')}</ul></div>`).join('')}</div>
      <p style="margin-top:20px"><a class="btn main" href="#/play/roots">Practise: root hunt</a></p>`;
  else if (part === 'mixups') body = `<div class="grid">${D.mixups.map((m) => `<div class="box"><div class="pair">${esc(m.a)}<i>or</i>${esc(m.b)}</div><p style="margin-top:8px">${esc(m.rule)}</p><div class="trick">${esc(m.trick)}</div></div>`).join('')}</div>
      <p style="margin-top:20px"><a class="btn main" href="#/play/mixups">Practise: mix-ups</a></p>`;
  else if (part === 'indian') {
    const kinds = { clarity: 'Can confuse outside India', grammar: 'Grammar', local: 'A good Indian word, unknown elsewhere' };
    body = `<p class="sub">Indian English is a real variety of English, spoken by more people than British English. These notes are for exams, formal writing and talking with people outside India — not because the Indian way is “wrong”.</p>
      <div style="display:grid;gap:12px">${D.indian.map((x) => `<div class="ie"><div class="from"><p class="k">${esc(kinds[x.kind] || x.kind)}</p><b>${esc(x.say)}</b></div><div><p class="k">Clear everywhere</p><b>${esc(x.better)}</b></div><div class="why">${esc(x.why)}</div></div>`).join('')}</div>`;
  } else if (part === 'say') body = `<p class="sub">Capital letters show the stressed part. Tap the speaker to hear your device's voice.</p>
      <div>${D.say.map((x) => `<div class="say-row">${speakBtn(x.w)}<div><h3>${esc(x.w)}<span class="sp">${esc(x.say)}</span></h3><p>${esc(x.trap)}${x.also ? ` <span class="muted">Also: ${esc(x.also)}</span>` : ''}</p></div></div>`).join('')}</div>`;
  render(`<p class="crumbs"><a href="#/toolkit">Toolkit</a> / ${esc(P.name)}</p><div class="page-head"><h1>${esc(P.name)}</h1><p class="lead">${esc(P.line)}</p></div>
    <div class="row" style="margin-bottom:24px">${PARTS.map((p) => `<a class="tag ${p.id === part ? 'on' : ''}" href="#/toolkit/${p.id}">${p.name}</a>`).join('')}</div>${body}`);
};

// ---------------------------------------------------------------- why
V.why = () => {
  const items = [
    ['Why not a dictionary?', 'You need the few hundred words that do the most work, not two lakh.',
      `Researchers sort words into tiers. Tier 1 words everyone knows (house, eat); Tier 3 are subject words (photosynthesis). <b>Tier 2</b> words — <i>analyse, reluctant, consequence, nuance</i> — are used by mature speakers in every subject, and give the biggest gain in clear thinking and reading. Most words here are Tier 2. (Beck, McKeown &amp; Kucan, <i>Bringing Words to Life</i>.)`],
    ['Why phrases, not only words?', 'Fluent speakers reach for ready-made phrases. That is why they sound fluent.',
      `Much of natural speech is made of fixed chunks — “I see it a little differently”, “let me think about that” — stored whole and used whole (Lewis, <i>The Lexical Approach</i>; Wray, <i>Formulaic Language</i>). Having the right chunk ready frees your mind for the idea itself. That is what the Phrases section is for.`],
    ['Why rooms instead of A to Z?', 'You look for a word when you want to say something, so words are grouped by what you want to say.',
      `Grouping by purpose also puts close words side by side — jealous and envious, refute and rebut — and knowing the difference is what precision means.`],
    ['Why words for feelings?', 'People who can name a feeling exactly handle it better.',
      `Psychologist Lisa Feldman Barrett calls this emotional granularity. “I feel apprehensive” tells you, and others, far more than “I feel bad”.`],
    ['Why speak out loud?', 'You only get better at speaking by speaking.',
      `Producing language — not just understanding it — forces you to notice the gaps in what you can say (Swain's output hypothesis). Sixty seconds, three target words, no stopping to correct yourself: that is the whole exercise.`],
    ['Why do words come back after 1, 3, 7, 16 and 40 days?', 'Meeting a word just before you forget it makes it last much longer.',
      `This is spaced repetition, built on Ebbinghaus's forgetting curve and the Leitner box system. A right answer moves the word to a longer gap; a wrong one brings it back tomorrow.`],
    ['Why quizzes instead of reading lists?', 'Pulling a word out of memory fixes it far better than reading it again.',
      `The testing effect, or retrieval practice, is one of the best-supported results in learning science (Roediger &amp; Karpicke, 2006). Every practice here makes you recall, not just recognise.`],
    ['Why “natural partners”?', 'Natural English is about which words go together.',
      `We say heavy rain, not strong rain; make a mistake, not do a mistake. These pairings are collocations, and getting them right is what makes speech sound effortless.`],
    ['Why the Hindi echoes in roots?', 'Many English roots are already in your Hindi.',
      `English and Hindi both descend from Proto-Indo-European, so Latin <i>novus</i> and Hindi <i>nav</i> (new), <i>mater</i> and <i>mata</i>, <i>dens</i> and <i>dant</i> are true relatives. Roots let you guess words you have never seen.`],
    ['Where is my data?', 'Only in this browser, on this device. No account, nothing sent anywhere.',
      `You can copy your progress as text in Settings and paste it on another device.`],
  ];
  render(`<div class="page-head"><h1>Why it works</h1><p class="lead">The short answer first. Open any item for the reasons.</p></div>
    <div class="why-list">${items.map(([q, a, more]) => `<div class="why-item"><h3>${q}</h3><p class="answer">${a}</p><details class="more"><summary>The reasons</summary><div>${more}</div></details></div>`).join('')}</div>`);
};

// ---------------------------------------------------------------- settings
V.settings = () => {
  const st = S.state();
  render(`<p class="crumbs"><a href="#/toolkit">Toolkit</a> / Settings</p><div class="page-head"><h1>Settings</h1></div>
  <div class="settings">
    <label class="toggle"><span><b>Hindi hints</b><br><span class="small muted">A short Hindi meaning under each word.</span></span><input type="checkbox" id="hindi" ${st.settings.hindi !== false ? 'checked' : ''}></label>
    <label class="toggle"><span><b>Speaker buttons</b><br><span class="small muted">Hear words and phrases in your device's own voice.</span></span><input type="checkbox" id="voice" ${st.settings.voice !== false ? 'checked' : ''}></label>
    <div class="panel"><h3>Move your progress</h3><p class="small muted">Copy this text, then paste it into Bricks on your other device.</p>
      <textarea id="data" style="width:100%;min-height:80px;margin-top:10px;font:13px ui-monospace,monospace;padding:8px;border:1.5px solid var(--rule-2);border-radius:5px"></textarea>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="copy">Copy my progress</button><button class="btn sm" id="load">Load pasted progress</button></div></div>
    <div class="panel"><h3>Start again</h3><p class="small muted">Removes every laid brick and your sentences from this device.</p>
      <button class="btn sm" id="reset" style="margin-top:10px;border-color:var(--wrong);color:var(--wrong)">Remove all progress</button></div>
  </div>`);
  main.querySelector('#hindi').onchange = (e) => S.setting('hindi', e.target.checked);
  main.querySelector('#voice').onchange = (e) => S.setting('voice', e.target.checked);
  const ta = main.querySelector('#data');
  main.querySelector('#copy').onclick = async () => { ta.value = S.exportText(); ta.select(); try { await navigator.clipboard.writeText(ta.value); toast('Progress copied'); } catch { toast('Select the text and copy it'); } };
  main.querySelector('#load').onclick = () => { try { S.importText(ta.value); toast('Progress loaded'); V.settings(); updateChrome('settings'); } catch { toast('That text is not Bricks progress'); } };
  main.querySelector('#reset').onclick = () => { if (confirm('Remove all your progress on this device? This cannot be undone.')) { S.reset(); toast('Progress removed'); V.settings(); updateChrome('settings'); } };
};

V.notFound = () => render(`<div class="page-head"><h1>No page here</h1><p class="lead"><a href="#/">Go to the house</a></p></div>`);

// ---------------------------------------------------------------- router
const ROUTES = { '': V.home, words: V.words, rooms: V.words, room: V.room, floor: V.floor, word: V.word, learn: V.learn, revise: V.revise,
  play: V.play, speak: V.speak, phrases: V.phrases, test: V.test, toolkit: V.toolkit, why: V.why, settings: V.settings };
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

main.innerHTML = '<p class="muted">Loading words…</p>';
loadAll().then(() => {
  window.addEventListener('hashchange', route);
  route();
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__bricks = { D, S };
});
