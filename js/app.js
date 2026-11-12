import { D, ROOMS, FLOORS, loadAll, roomOf, floorOf } from './data.js';
import * as S from './store.js';
import { esc, shuffle, sample, seeded, markWord, speak, speakBtn, toast, share } from './util.js';
import { Q, reviewQuestion, runQuiz, runLadder } from './games.js';

const main = document.getElementById('main');
let cleanup = null;
let justLaid = new Set();   // bricks to animate on the next visit to the house

// ---------------------------------------------------------------- helpers
const floorName = (n) => floorOf(n)?.name || '';
const stamp = (w) => `<span class="stamp"><span>${esc(w)}</span></span>`;
const hindiOn = () => S.setting('hindi') !== false;

/** The floor you are working on: your tested floor, or the lowest floor not yet 80% laid. */
function workingFloor() {
  const st = S.state();
  for (const f of FLOORS) {
    if (f.n < (st.floor || 1)) continue;
    const ids = D.byFloor.get(f.n).map((w) => w.id);
    const c = S.counts(ids);
    if (c.laid / Math.max(1, c.total) < 0.8) return f.n;
  }
  return 5;
}

/** Five new words for today: picked once a day, from your floor, spread across rooms. */
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
  for (const w of pool) { if (out.length < 5 && !rooms.has(w.room)) { out.push(w); rooms.add(w.room); } }
  for (const w of pool) { if (out.length < 5 && !out.includes(w)) out.push(w); }
  st.todayPick = { date: S.today(), ids: out.map((w) => w.id) };
  S.save();
  return out;
}

function updateNav(route) {
  const top = route.split('/')[0] || 'home';
  const map = { '': 'home', word: 'rooms', room: 'rooms', floor: 'rooms', learn: 'home', test: 'home', settings: 'toolkit' };
  const on = map[top] ?? top;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === on));
  const due = S.dueIds().length;
  const dot = document.querySelector('.due-dot');
  dot.hidden = !due; dot.textContent = due > 99 ? '99+' : due;
}

function render(html) {
  main.innerHTML = `<div class="fade-in">${html}</div>`;
  main.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); speak(b.dataset.speak); }));
}

// ---------------------------------------------------------------- the house (signature)
function houseHTML() {
  const all = D.words.map((w) => w.id);
  const c = S.counts(all);
  const floors = FLOORS.slice().reverse().map((f) => {
    const ws = D.byFloor.get(f.n);
    return `<div class="floor">
      <a class="floor-name" href="#/floor/${f.n}" style="text-decoration:none"><b>${f.n === 5 ? 'Terrace' : f.n === 1 ? 'Ground' : ['', '', 'First', 'Second', 'Third'][f.n]}</b>${S.counts(ws.map((w) => w.id)).laid}/${ws.length}</a>
      <div class="course">${ws.map((w) => `<a class="b ${S.statusOf(w.id)} ${justLaid.has(w.id) ? 'just' : ''}" href="#/word/${w.id}" title="${esc(w.w)}" aria-label="${esc(w.w)}: ${S.statusOf(w.id)}"></a>`).join('')}</div>
    </div>`;
  }).join('');
  justLaid = new Set();
  return `<div class="house">
    <div class="house-top"><div class="house-count">${c.laid}<small>of ${c.total} bricks laid</small></div>
      <span class="small muted">${c.learning} being learned</span></div>
    ${floors}
    <div class="house-key"><span><i style="background:var(--brick)"></i>laid: you know it</span><span><i style="background:var(--haldi-2);box-shadow:inset 0 0 0 1.5px var(--haldi)"></i>being learned</span><span><i style="box-shadow:inset 0 0 0 1px var(--mortar)"></i>not yet</span></div>
  </div>`;
}

// ---------------------------------------------------------------- views
const V = {};

V.home = () => {
  const st = S.state();
  const tw = todaysWords();
  const due = S.dueIds().length;
  render(`
  <section class="hero">
    <div>
      <p class="eyebrow">English words for clear thinking</p>
      <h1>Every word is a brick. <em>More bricks, bigger house.</em></h1>
      <p class="lead">With few words, every thought comes out as “very good”, “very bad”, “I don't know”. These ${D.words.length} words help you think, explain and argue clearly — at work, in arguments, in life.</p>
      <p class="quote-src">The idea comes from Javed Akhtar's talk <a href="https://www.ted.com/talks/javed_akhtar_the_gift_of_words" target="_blank" rel="noopener">“The gift of words”</a>: with fewer bricks you can only build a small house.</p>
    </div>
    ${houseHTML()}
  </section>

  <section class="today">
    <div class="panel">
      <p class="eyebrow">Today · ${floorName(workingFloor())}</p>
      <h2>Lay today's five bricks</h2>
      <div class="today-words">${tw.map((w) => `<a class="chip" href="#/word/${w.id}">${esc(w.w)}</a>`).join('')}</div>
      <div class="row"><a class="btn lay" href="#/learn">Start · about 5 minutes</a>
        <button class="btn ghost" id="shareToday">Share today's words</button></div>
    </div>
    <div class="panel ${due ? 'dark' : ''}">
      ${due
        ? `<p class="eyebrow" style="color:#F2C9B6">Revise</p><h2 style="color:#fff">${due} word${due > 1 ? 's' : ''} to revise</h2>
           <p>Bricks set only when you meet a word again just before you forget it.</p>
           <div class="row" style="margin-top:16px"><a class="btn lay" href="#/revise">Revise now</a></div>`
        : st.tested
          ? `<p class="eyebrow">Your floor</p><h2>${floorName(st.floor)}</h2><p>${esc(floorOf(st.floor).line)}</p>
             <div class="row" style="margin-top:16px"><a class="btn" href="#/floor/${st.floor}">See this floor</a><a class="btn ghost" href="#/test">Test again</a></div>`
          : `<p class="eyebrow">New here?</p><h2>Find your floor</h2><p>Two minutes. Tick the words you know, and we start you at the right level.</p>
             <div class="row" style="margin-top:16px"><a class="btn primary" href="#/test">Find my floor</a></div>`}
      ${st.streak.n > 1 ? `<p class="small" style="margin-top:14px">${st.streak.n} days in a row.</p>` : ''}
    </div>
  </section>

  <h2>Pick a room: what do you want to say?</h2>
  <div class="grid">${ROOMS.map(roomCard).join('')}</div>

  <h2>Play</h2>
  <div class="grid">${GAMES.slice(0, 4).map(gameCard).join('')}</div>
  <p style="margin-top:12px"><a href="#/play">All ${GAMES.length} games</a> · <a href="#/toolkit">Toolkit: ladders, roots, mix-ups, Indian English</a> · <a href="#/why">Why this works</a> · <a href="#/settings">Settings</a></p>
  `);
  main.querySelector('#shareToday').addEventListener('click', () => share(
    `Today's 5 English words:\n` + tw.map((w) => `• ${w.w} — ${w.mean}`).join('\n')));
};

function roomCard(r) {
  const ws = D.byRoom.get(r.id) || [];
  const c = S.counts(ws.map((w) => w.id));
  return `<a class="card" href="#/room/${r.id}"><h3>${esc(r.name)}</h3><p>${esc(r.line)}</p>
    <div class="bar"><i style="width:${(c.laid / Math.max(1, c.total)) * 100}%"></i></div>
    <div class="meta">${c.laid} of ${c.total} laid</div></a>`;
}

V.rooms = () => {
  render(`<div class="page-head"><p class="eyebrow">Rooms</p><h1>What do you want to say?</h1>
    <p class="lead">Words are grouped by purpose, not by alphabet. Each room has five floors, from everyday to rare.</p></div>
    <div class="row" style="margin-bottom:18px">${FLOORS.map((f) => `<a class="chip" href="#/floor/${f.n}">${f.name}</a>`).join('')}</div>
    <div class="grid">${ROOMS.map(roomCard).join('')}</div>`);
};

function wordList(ws) {
  return `<ul class="wlist">${ws.map((w) => `<li><a href="#/word/${w.id}"><i class="dot ${S.statusOf(w.id)}"></i><div><b>${esc(w.w)}</b><span>${esc(w.mean)}</span></div></a></li>`).join('')}</ul>`;
}

V.room = (id) => {
  const r = roomOf(id);
  if (!r) return V.notFound();
  const ws = D.byRoom.get(id) || [];
  const fresh = ws.filter((w) => S.statusOf(w.id) === 'new').length;
  render(`<a class="back" href="#/rooms">← All rooms</a>
    <div class="page-head"><p class="eyebrow">Room</p><h1>${esc(r.name)}</h1><p class="lead">${esc(r.line)}</p>
    <div class="row" style="margin-top:16px">${fresh ? `<a class="btn lay" href="#/learn/${id}">Learn 5 new words here</a>` : ''}
      <a class="btn" href="#/play/gap/${id}">Play: fill the gap</a></div></div>
    ${ws.length ? FLOORS.map((f) => {
      const fw = ws.filter((w) => w.floor === f.n);
      return fw.length ? `<section class="floor-block"><h2>${f.name} <small>${esc(f.line)}</small></h2>${wordList(fw)}</section>` : '';
    }).join('') : '<p class="muted">The words for this room are still being written.</p>'}`);
};

V.floor = (n) => {
  n = +n;
  const f = floorOf(n);
  if (!f) return V.notFound();
  const ws = D.byFloor.get(n);
  render(`<a class="back" href="#/rooms">← All rooms</a>
    <div class="page-head"><p class="eyebrow">Level</p><h1>${f.name}</h1><p class="lead">${esc(f.line)}</p>
    <div class="row" style="margin-top:16px">${FLOORS.map((x) => `<a class="chip ${x.n === n ? 'on' : ''}" href="#/floor/${x.n}">${x.name}</a>`).join('')}</div></div>
    ${ROOMS.map((r) => {
      const rw = ws.filter((w) => w.room === r.id);
      return rw.length ? `<section class="floor-block"><h2>${esc(r.name)}</h2>${wordList(rw)}</section>` : '';
    }).join('')}`);
};

function wordCardHTML(w, { compact = false } = {}) {
  const r = roomOf(w.room);
  const st = S.statusOf(w.id);
  return `<article class="wcard">
    <div class="wcard-head">
      <div class="wcard-tags"><a class="tag" href="#/room/${w.room}">${esc(r.name)}</a><a class="tag" href="#/floor/${w.floor}">${floorName(w.floor)}</a><span class="tag">${esc(w.pos)}</span></div>
      <div class="headword"><h1>${esc(w.w)}</h1>${speakBtn(w.w)}</div>
      <div class="say">Say it: <b>${esc(w.say)}</b></div>
    </div>
    <div class="wcard-body">
      <div><p class="meaning">${esc(w.mean)}</p>${hindiOn() && w.hi ? `<div class="hindi hi" lang="hi">${esc(w.hi)}</div>` : ''}</div>
      <div><p class="label">In a sentence</p><p class="example">${markWord(w.ex, w.w)}</p></div>
      ${w.instead ? `<div><p class="label">Use it instead of</p><div class="instead"><s>${esc(w.instead)}</s><span class="arrow">→</span><b>${esc(w.w)}</b></div></div>` : ''}
      ${w.with?.length ? `<div><p class="label">Words that go with it</p><div class="partners">${w.with.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>` : ''}
      ${w.note ? `<div class="note"><b>Good to know:</b> ${esc(w.note)}</div>` : ''}
    </div>
    ${compact ? '' : `<div class="wcard-foot">
      <div class="status-line" id="status">${st === 'laid' ? 'This brick is laid. It will come back for revision.' : st === 'learning' ? 'You are learning this word.' : 'Do you know this word well enough to use it?'}</div>
      <div class="row"><button class="btn lay" id="know">${st === 'laid' ? 'Laid ✓' : 'I know it — lay the brick'}</button><button class="btn" id="learning">Still learning</button>
        <button class="btn ghost" id="share">Share</button></div>
      <div class="use"><p class="label">Use it in your own sentence (the best way to keep a word)</p>
        <textarea id="mine" placeholder="Write a sentence about your own life using “${esc(w.w)}”…">${esc(S.state().sentences[w.id] || '')}</textarea>
        <p class="small muted">Saved on this device only.</p></div>
    </div>`}
  </article>`;
}

V.word = (id) => {
  const w = D.byId.get(id);
  if (!w) return V.notFound();
  const ws = D.byRoom.get(w.room);
  const i = ws.indexOf(w);
  const prev = ws[i - 1], next = ws[i + 1];
  render(`<a class="back" href="#/room/${w.room}">← ${esc(roomOf(w.room).name)}</a>
    ${wordCardHTML(w)}
    <div class="pager">${prev ? `<a class="btn ghost" href="#/word/${prev.id}">← ${esc(prev.w)}</a>` : '<span></span>'}${next ? `<a class="btn ghost" href="#/word/${next.id}">${esc(next.w)} →</a>` : ''}</div>`);
  main.querySelector('#know').addEventListener('click', () => {
    const r = S.markKnown(w.id);
    if (r.was !== 'laid') justLaid.add(w.id);
    toast(`Brick laid: ${w.w}`);
    V.word(id);
  });
  main.querySelector('#learning').addEventListener('click', () => { S.markLearning(w.id); toast(`${w.w} will come back tomorrow`); V.word(id); });
  main.querySelector('#share').addEventListener('click', () => share(`${w.w} (${w.say}) — ${w.mean}\n“${w.ex}”`));
  const ta = main.querySelector('#mine');
  let t; ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => S.setSentence(w.id, ta.value), 400); });
};

// ---------------------------------------------------------------- learn session
V.learn = (roomId) => {
  let words;
  if (roomId) {
    words = (D.byRoom.get(roomId) || []).filter((w) => S.statusOf(w.id) === 'new').slice(0, 5);
  } else words = todaysWords();
  if (!words.length) return render(`<div class="session panel"><h1>Nothing new here</h1><p>You have met every word in this set. <a href="#/revise">Revise</a> or <a href="#/play">play a game</a>.</p></div>`);
  const known = [], learning = [];
  let i = 0;
  const step = () => {
    if (i >= words.length) return check();
    const w = words[i];
    render(`<div class="session">
      <div class="progress">${words.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <p class="eyebrow">Word ${i + 1} of ${words.length}</p>
      ${wordCardHTML(w, { compact: true })}
      <div class="q-actions"><button class="btn" id="l">New to me</button><button class="btn lay" id="k">I know it</button></div>
    </div>`);
    main.querySelector('#k').onclick = () => { known.push(w); i++; step(); };
    main.querySelector('#l').onclick = () => { learning.push(w); i++; step(); };
    window.scrollTo({ top: 0 });
  };
  // Quick check: even "known" words get one question, so a brick is laid only if you got it right.
  const check = () => {
    const qs = shuffle(words).map((w) => (w.instead && Math.random() < 0.4 ? Q.instead(w) : Q.gap(w)));
    main.innerHTML = '<p class="eyebrow" style="max-width:720px;margin:0 auto 10px">Quick check</p><div id="quiz"></div>';
    cleanup = runQuiz(main.querySelector('#quiz'), qs, {
      track: false,
      onDone: (res) => {
        const laid = [];
        res.forEach((r, k) => {
          const w = D.byId.get(qs[k].wordId);
          if (r.right && known.includes(w)) { const x = S.markKnown(w.id); if (x.was !== 'laid') { laid.push(w); justLaid.add(w.id); } }
          else S.markLearning(w.id);
        });
        render(`<div class="session q result">
          <p class="eyebrow">Done for today</p>
          <div class="big">${laid.length}</div><p>brick${laid.length === 1 ? '' : 's'} laid${laid.length < words.length ? ` · ${words.length - laid.length} to learn — they come back tomorrow` : ''}</p>
          <div class="stamps">${laid.map((w) => stamp(w.w)).join('')}</div>
          <div class="row" style="justify-content:center"><a class="btn lay" href="#/">See your house</a><a class="btn" href="#/play">Play a game</a></div>
        </div>`);
      },
    });
  };
  step();
};

// ---------------------------------------------------------------- revise
V.revise = () => {
  const due = S.dueIds().map((id) => D.byId.get(id)).filter(Boolean);
  if (!due.length) {
    const learning = D.words.filter((w) => S.statusOf(w.id) !== 'new').length;
    return render(`<div class="page-head"><p class="eyebrow">Revise</p><h1>Nothing to revise right now</h1>
      <p class="lead">${learning ? 'Your words will come back here just before you would forget them: after 1 day, 3, 7, 16, then 40 days.' : 'Learn a few words first. They will come back here the next day.'}</p>
      <div class="row" style="margin-top:16px"><a class="btn lay" href="#/learn">Learn today's words</a><a class="btn" href="#/play">Play a game</a></div></div>`);
  }
  const batch = shuffle(due).slice(0, 12);
  main.innerHTML = '<div id="quiz"></div>';
  cleanup = runQuiz(main.querySelector('#quiz'), batch.map(reviewQuestion), {
    track: 'review',
    onDone: (res) => {
      const right = res.filter((r) => r.right).length;
      updateNav('revise');
      render(`<div class="session q result"><p class="eyebrow">Revision done</p><div class="big">${right}/${res.length}</div>
        <p>Right answers move a word up; a wrong answer sends it back to tomorrow.</p>
        <div class="row" style="justify-content:center;margin-top:16px">${S.dueIds().length ? '<a class="btn lay" href="#/revise">Revise more</a>' : ''}<a class="btn" href="#/">Home</a></div></div>`);
    },
  });
};

// ---------------------------------------------------------------- games
const GAMES = [
  { id: 'gap', name: 'Fill the gap', line: 'A real sentence with one word missing. Pick it.', scoped: true },
  { id: 'instead', name: 'One better word', line: 'Swap a tired phrase like “very small” for one exact word.', scoped: true },
  { id: 'rush', name: 'Brick rush', line: '60 seconds. Match words and meanings as fast as you can.', scoped: true },
  { id: 'ladder', name: 'Build the ladder', line: 'Put five words in order, from mildest to most extreme.' },
  { id: 'stronger', name: 'Which is stronger?', line: 'Annoyed or furious? Pick the stronger word.' },
  { id: 'mixups', name: 'Mix-ups', line: 'Affect or effect? Lose or loose? Choose right.' },
  { id: 'roots', name: 'Root hunt', line: 'Find the word that grows from a Latin or Greek root.' },
  { id: 'meaning', name: 'Word or meaning', line: 'See a word, pick its meaning — or the other way round.', scoped: true },
];

function gameCard(g) {
  const best = S.state().best[g.id];
  return `<a class="card" href="#/play/${g.id}"><h3>${esc(g.name)}</h3><p>${esc(g.line)}</p>${best ? `<div class="meta">Best: ${best}</div>` : ''}</a>`;
}

V.play = (gameId, scope) => {
  if (!gameId) {
    return render(`<div class="page-head"><p class="eyebrow">Play</p><h1>Games</h1><p class="lead">Every game is a different way to meet a word again. Meeting it again, and pulling it from memory, is what makes it stay.</p></div>
      <div class="grid">${GAMES.map(gameCard).join('')}</div>`);
  }
  const g = GAMES.find((x) => x.id === gameId);
  if (!g) return V.notFound();
  scope = scope || 'mine';
  const pool = scope === 'all' ? D.words : scope === 'mine'
    ? D.words.filter((w) => w.floor <= workingFloor())
    : (D.byRoom.get(scope) || D.words);
  const scopeBar = g.scoped ? `<div class="row" style="margin:-6px 0 18px">
      <a class="chip ${scope === 'mine' ? 'on' : ''}" href="#/play/${g.id}/mine">Up to my floor</a>
      <a class="chip ${scope === 'all' ? 'on' : ''}" href="#/play/${g.id}/all">All words</a>
      ${ROOMS.map((r) => `<a class="chip ${scope === r.id ? 'on' : ''}" href="#/play/${g.id}/${r.id}">${esc(r.name)}</a>`).join('')}
    </div>` : '';

  main.innerHTML = `<a class="back" href="#/play">← All games</a><div class="page-head"><p class="eyebrow">Game</p><h1>${esc(g.name)}</h1><p class="lead">${esc(g.line)}</p></div>${scopeBar}<div id="quiz"></div>`;
  const el = main.querySelector('#quiz');
  const done = (score, of) => {
    const best = S.setBest(g.id, score);
    el.innerHTML = `<div class="session q result fade-in"><p class="eyebrow">${esc(g.name)}</p><div class="big">${score}${of ? '/' + of : ''}</div>
      <p>${best ? 'Your best yet.' : `Your best: ${S.state().best[g.id] || score}`}</p>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn lay" id="again">Play again</button><a class="btn" href="#/play">Other games</a>
      <button class="btn ghost" id="sh">Share score</button></div></div>`;
    el.querySelector('#again').onclick = () => V.play(gameId, scope);
    el.querySelector('#sh').onclick = () => share(`I scored ${score}${of ? '/' + of : ''} in “${g.name}” on Bricks. Can you beat it?`);
  };
  const fin = (res) => done(res.filter((r) => r.right).length, res.length);

  if (pool.length < 4 && g.scoped) { el.innerHTML = '<p class="muted">Not enough words here yet.</p>'; return; }
  switch (gameId) {
    case 'gap': cleanup = runQuiz(el, sample(pool, 10).map(Q.gap), { track: 'game', onDone: fin }); break;
    case 'instead': cleanup = runQuiz(el, sample(pool.filter((w) => w.instead), 10).map(Q.instead), { track: 'game', onDone: fin }); break;
    case 'meaning': cleanup = runQuiz(el, sample(pool, 10).map((w) => (Math.random() < 0.5 ? Q.meaning(w) : Q.word(w))), { track: 'game', onDone: fin }); break;
    case 'rush': {
      el.innerHTML = `<div class="session q result"><p class="q-prompt">60 seconds. As many as you can.</p><button class="btn lay" id="go">Start</button></div>`;
      el.querySelector('#go').onclick = () => {
        cleanup = runQuiz(el, [], {
          timed: 60, track: false,
          endless: () => { const w = sample(pool, 1)[0]; return Math.random() < 0.5 ? Q.meaning(w) : Q.word(w); },
          onDone: (res) => done(res.filter((r) => r.right).length),
        });
      };
      break;
    }
    case 'stronger': cleanup = runQuiz(el, Array.from({ length: 10 }, () => Q.stronger(sample(D.ladders, 1)[0])), { onDone: fin }); break;
    case 'ladder': runLadder(el, sample(D.ladders, 4), { onDone: done }); break;
    case 'mixups': cleanup = runQuiz(el, sample(D.mixups, 10).map(Q.mixup), { onDone: fin }); break;
    case 'roots': cleanup = runQuiz(el, sample(D.roots, 10).map(Q.root), { onDone: fin }); break;
  }
};

// ---------------------------------------------------------------- find your floor
const FAKES = ['plontic', 'furbate', 'vestorial', 'ascrimate', 'tropulent', 'morvish'];
V.test = () => {
  const items = [];
  for (const f of FLOORS) for (const w of sample(D.byFloor.get(f.n), 4)) items.push({ w: w.w, floor: f.n });
  for (const x of FAKES) items.push({ w: x, fake: true });
  const list = shuffle(items);
  const yes = new Set();
  let i = 0;
  const step = () => {
    if (i >= list.length) return result();
    const it = list[i];
    render(`<div class="session">
      <div class="progress">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <div class="q" style="text-align:center">
        <div class="q-kind">Find your floor · ${i + 1} of ${list.length}</div>
        <p class="q-prompt">Could you explain this word to a friend?</p>
        <p style="margin:6px 0 26px">${stamp(it.w)}</p>
        <div class="choices two"><button class="choice" id="n">No / not sure</button><button class="choice" id="y">Yes, I know it</button></div>
        <p class="small muted" style="margin-top:16px">Be honest — a few of these are made-up words, to keep the test fair.</p>
      </div></div>`);
    main.querySelector('#y').onclick = () => { yes.add(it); i++; step(); };
    main.querySelector('#n').onclick = () => { i++; step(); };
  };
  const result = () => {
    const fa = list.filter((x) => x.fake && yes.has(x)).length / FAKES.length;
    const per = FLOORS.map((f) => {
      const real = list.filter((x) => x.floor === f.n);
      const k = real.filter((x) => yes.has(x)).length / real.length;
      return { f, k, adj: fa >= 1 ? 0 : Math.max(0, (k - fa) / (1 - fa)) };
    });
    let floor = 5;
    for (const p of per) { if (p.adj < 0.75) { floor = p.f.n; break; } }
    S.setFloor(floor);
    render(`<div class="session q">
      <p class="eyebrow">Your result</p>
      <h1>Start on the ${floorName(floor).toLowerCase()}</h1>
      <p class="lead">${esc(floorOf(floor).line)}</p>
      <div style="margin:22px 0;display:grid;gap:10px">${per.map((p) => `<div><div class="row" style="justify-content:space-between"><b>${p.f.name}</b><span class="muted">${Math.round(p.adj * 100)}%</span></div><div class="bar" style="margin-top:4px"><i style="width:${p.adj * 100}%"></i></div></div>`).join('')}</div>
      ${fa > 0 ? `<p class="note">You said yes to ${Math.round(fa * FAKES.length)} made-up word${fa * FAKES.length > 1 ? 's' : ''} (${list.filter((x) => x.fake && yes.has(x)).map((x) => x.w).join(', ')}). We lowered the scores to allow for that.</p>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn lay" href="#/learn">Start with today's words</a><a class="btn" href="#/floor/${floor}">See your floor</a></div>
    </div>`);
  };
  step();
};

// ---------------------------------------------------------------- toolkit
V.toolkit = (part) => {
  const parts = [
    { id: 'ladders', name: 'Shades of strength', line: 'Annoyed → angry → furious. Pick a word of exactly the right strength.' },
    { id: 'roots', name: 'Brick makers: roots', line: 'One Latin or Greek root unlocks many words — and many echo Hindi and Sanskrit.' },
    { id: 'mixups', name: 'Mix-ups', line: 'Pairs people confuse, with a rule and a memory trick.' },
    { id: 'indian', name: 'Indian English → global English', line: 'Phrases that work at home but can confuse people elsewhere.' },
    { id: 'say', name: 'Say it right', line: 'Words often said differently from most international speakers.' },
  ];
  const nav = `<div class="row" style="margin-bottom:22px">${parts.map((p) => `<a class="chip ${p.id === part ? 'on' : ''}" href="#/toolkit/${p.id}">${p.name}</a>`).join('')}<a class="chip" href="#/settings">Settings</a></div>`;
  if (!part) {
    return render(`<div class="page-head"><p class="eyebrow">Toolkit</p><h1>Tools that multiply your words</h1>
      <p class="lead">Rooms give you words. These give you control over them: strength, origin, the right choice, and the right sound.</p></div>
      <div class="grid">${parts.map((p) => `<a class="card" href="#/toolkit/${p.id}"><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p></a>`).join('')}
      <a class="card" href="#/settings"><h3>Settings</h3><p>Hindi hints, voice, save or move your progress.</p></a></div>`);
  }
  const P = parts.find((p) => p.id === part);
  if (!P) return V.notFound();
  let body = '';
  if (part === 'ladders') {
    body = `<div class="grid">${D.ladders.map((L) => `<div class="card"><h3>${esc(L.title)}</h3>
      <div class="strength"><span>mildest</span><span>most extreme ↓</span></div>
      <div class="ladder">${L.steps.map((s) => `<div class="rung ${s.w === L.tired ? 'tired' : ''}"><b>${esc(s.w)}</b><span>${esc(s.m)}</span></div>`).join('')}</div></div>`).join('')}</div>
      <p style="margin-top:18px"><a class="btn lay" href="#/play/ladder">Play: build the ladder</a></p>`;
  } else if (part === 'roots') {
    body = `<p class="lead" style="margin:-8px 0 20px">English, Hindi and Sanskrit are cousins: they share ancestors. A yellow box means the root has a real relative in Hindi or Sanskrit.</p>
      <div class="grid">${D.roots.map((r) => `<div class="card root-card"><div class="root">${esc(r.root)}</div><p><b>${esc(r.means)}</b> · ${esc(r.from)}</p>
      ${r.echo ? `<div class="echo hi-mix">${esc(r.echo)}</div>` : ''}
      <ul>${r.words.map((w) => `<li><b>${esc(w.w)}</b> <span>— ${esc(w.m)}</span></li>`).join('')}</ul></div>`).join('')}</div>
      <p style="margin-top:18px"><a class="btn lay" href="#/play/roots">Play: root hunt</a></p>`;
  } else if (part === 'mixups') {
    body = `<div class="grid">${D.mixups.map((m) => `<div class="card mix-card"><div class="pair">${esc(m.a)}<i>or</i>${esc(m.b)}</div><p style="margin-top:8px">${esc(m.rule)}</p><div class="trick">${esc(m.trick)}</div></div>`).join('')}</div>
      <p style="margin-top:18px"><a class="btn lay" href="#/play/mixups">Play: mix-ups</a></p>`;
  } else if (part === 'indian') {
    const kinds = { clarity: 'Can confuse outside India', grammar: 'Grammar', local: 'A good Indian word, unknown elsewhere' };
    body = `<p class="lead" style="margin:-8px 0 20px">Indian English is a real variety of English, spoken by more people than British English. These notes are for exams, formal writing, and talking with people outside India — not because the Indian way is “wrong”.</p>
      <div style="display:grid;gap:12px">${D.indian.map((x) => `<div class="ie"><div class="from"><div class="kind">${esc(kinds[x.kind] || x.kind)}</div><b>${esc(x.say)}</b></div><div class="to"><div class="kind">Globally clear</div><b>${esc(x.better)}</b></div><div class="why">${esc(x.why)}</div></div>`).join('')}</div>`;
  } else if (part === 'say') {
    body = `<p class="lead" style="margin:-8px 0 20px">Capital letters show the stressed part. Tap the speaker to hear it in your device's voice.</p>
      <div style="display:grid;gap:10px">${D.say.map((x) => `<div class="say-row">${speakBtn(x.w)}<div><h3>${esc(x.w)} <span class="sp">${esc(x.say)}</span></h3><p>${esc(x.trap)}${x.also ? ` <span class="muted">Also: ${esc(x.also)}</span>` : ''}</p></div></div>`).join('')}</div>`;
  }
  render(`<a class="back" href="#/toolkit">← Toolkit</a><div class="page-head"><p class="eyebrow">Toolkit</p><h1>${esc(P.name)}</h1><p class="lead">${esc(P.line)}</p></div>${nav}${body}`);
};

// ---------------------------------------------------------------- why
V.why = () => {
  const items = [
    ['Why not a dictionary?', 'A dictionary has 2 lakh words; you need the few hundred that do the most work.',
      `Researchers sort words into three tiers. Tier 1 are basic words everyone knows (house, eat). Tier 3 are subject words (photosynthesis, mortgage). <b>Tier 2</b> are the words mature speakers use across every subject — <i>analyse, reluctant, consequence, nuance</i>. These give the biggest gain in clear thinking and reading, so every word here is Tier 2 or a useful step towards it. (Beck, McKeown & Kucan, <i>Bringing Words to Life</i>.)`],
    ['Why rooms instead of A to Z?', 'You look for a word when you want to say something, so words are grouped by what you want to say.',
      `Alphabetical order puts “abandon” next to “abbreviate” — useless when you are trying to disagree politely. Grouping by purpose (thinking, arguing, feelings) also lets you compare close words: jealous vs envious, refute vs rebut. Knowing the difference is what precision means.`],
    ['Why words for feelings?', 'People who can name a feeling exactly handle it better.',
      `Psychologist Lisa Feldman Barrett calls this “emotional granularity”. Saying “I feel apprehensive” instead of “I feel bad” tells you, and the other person, what to do next. Her studies link finer emotion words with better coping.`],
    ['Why does a word come back after 1, 3, 7, 16, 40 days?', 'Memory fades on a curve; meeting a word just before you forget it resets the curve and makes it last longer.',
      `This is spaced repetition, based on Ebbinghaus's forgetting curve and the Leitner box system. Each right answer moves the word to a longer gap; a wrong answer sends it back to tomorrow.`],
    ['Why games and quizzes instead of just reading?', 'Pulling a word out of memory fixes it far better than reading it again.',
      `This is the “testing effect” or retrieval practice, one of the best-supported results in learning science (Roediger & Karpicke, 2006). Every game here makes you recall, not just recognise.`],
    ['Why write your own sentence?', 'Using a word about your own life is what moves it from “I’ve seen it” to “I use it”.',
      `Knowing a word has levels: recognising it, understanding it, and using it. Producing it yourself — “generative use” — is the step most learners skip. That is why each word has a box for your own sentence.`],
    ['Why roots, and why the Hindi echoes?', 'One root unlocks many words, and many roots are already in your Hindi.',
      `English and Hindi both descend from Proto-Indo-European, so Latin <i>novus</i> and Hindi <i>nav</i> (new), Latin <i>mater</i> and <i>mata</i>, Latin <i>dens</i> and <i>dant</i> (tooth) are real relatives. Learning roots is a proven way to guess new words.`],
    ['Why collocations (“words that go with it”)?', 'Native-sounding English is about which words go together, not just single words.',
      `We say “heavy rain”, not “strong rain”; “make a decision”, not “do a decision”. These pairings are called collocations, and they are what makes speech sound natural.`],
    ['Where is my data?', 'Only in this browser, on this device. No account, nothing sent anywhere.',
      `You can copy your progress as text in Settings and paste it on another device.`],
  ];
  render(`<div class="page-head"><p class="eyebrow">Why it works</p><h1>The thinking behind Bricks</h1><p class="lead">Short answer first. Open any box for the reasons.</p></div>
    <div class="research">${items.map(([q, a, more]) => `<div class="panel"><h3>${q}</h3><p class="answer">${a}</p><details class="more"><summary>Why</summary><div class="prose"><p>${more}</p></div></details></div>`).join('')}</div>`);
};

// ---------------------------------------------------------------- settings
V.settings = () => {
  const st = S.state();
  render(`<a class="back" href="#/toolkit">← Toolkit</a><div class="page-head"><p class="eyebrow">Settings</p><h1>Settings</h1></div>
  <div class="settings">
    <label class="toggle"><span><b>Hindi hints</b><br><span class="small muted">Show a short Hindi meaning under each word.</span></span><input type="checkbox" id="hindi" ${st.settings.hindi !== false ? 'checked' : ''}></label>
    <label class="toggle"><span><b>Speaker buttons</b><br><span class="small muted">Hear words in your device's own voice.</span></span><input type="checkbox" id="voice" ${st.settings.voice !== false ? 'checked' : ''}></label>
    <div class="panel"><h3>Move your progress</h3><p class="small muted">Copy this text and paste it into Bricks on your other device.</p>
      <textarea id="data" style="width:100%;min-height:80px;margin-top:10px;font:13px monospace;padding:8px;border:1.5px solid var(--line);border-radius:8px"></textarea>
      <div class="row" style="margin-top:10px"><button class="btn small" id="copy">Copy my progress</button><button class="btn small" id="load">Load pasted progress</button></div></div>
    <div class="panel"><h3>Start again</h3><p class="small muted">Removes every laid brick and your sentences from this device.</p>
      <button class="btn small" id="reset" style="margin-top:10px;border-color:var(--wrong);color:var(--wrong)">Remove all progress</button></div>
  </div>`);
  main.querySelector('#hindi').onchange = (e) => S.setting('hindi', e.target.checked);
  main.querySelector('#voice').onchange = (e) => S.setting('voice', e.target.checked);
  const ta = main.querySelector('#data');
  main.querySelector('#copy').onclick = async () => { ta.value = S.exportText(); ta.select(); try { await navigator.clipboard.writeText(ta.value); toast('Progress copied'); } catch { toast('Select the text and copy it'); } };
  main.querySelector('#load').onclick = () => { try { S.importText(ta.value); toast('Progress loaded'); V.settings(); } catch { toast('That text is not Bricks progress'); } };
  main.querySelector('#reset').onclick = () => { if (confirm('Remove all your progress on this device? This cannot be undone.')) { S.reset(); toast('Progress removed'); V.settings(); } };
};

V.notFound = () => render(`<div class="page-head"><h1>No page here</h1><p class="lead"><a href="#/">Go to the house</a></p></div>`);

// ---------------------------------------------------------------- router
function route() {
  cleanup?.(); cleanup = null;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [a, b, c] = path.split('/');
  updateNav(path);
  const fn = { '': V.home, rooms: V.rooms, room: V.room, floor: V.floor, word: V.word, learn: V.learn, revise: V.revise, play: V.play, test: V.test, toolkit: V.toolkit, why: V.why, settings: V.settings }[a || ''];
  (fn || V.notFound)(b, c);
  if (!/^(learn|test)/.test(a || '')) window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
  updateNav(path);
}

main.innerHTML = '<p class="muted">Loading words…</p>';
loadAll().then(() => {
  window.addEventListener('hashchange', route);
  route();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__bricks = { D, S };
});
