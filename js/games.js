// Question builders and the quiz runner used by Revise and every game.
import { D } from './data.js';
import { esc, shuffle, sample, pick, gapWord, speakBtn } from './util.js';
import { answer, answerGame, statusOf } from './store.js';

const posKey = (w) => (w.pos || '').split(/[\s/,(]/)[0].toLowerCase();

/** Pick n other words that would make fair wrong answers for w. */
function distractors(w, n = 3, { sameRoom = true } = {}) {
  const others = D.words.filter((x) => x.id !== w.id);
  const tiers = [
    others.filter((x) => posKey(x) === posKey(w) && (!sameRoom || x.room === w.room)),
    others.filter((x) => posKey(x) === posKey(w) && Math.abs(x.floor - w.floor) <= 1),
    others.filter((x) => posKey(x) === posKey(w)),
    others,
  ];
  const out = [];
  for (const t of tiers) {
    for (const x of shuffle(t)) {
      if (out.length >= n) break;
      if (!out.includes(x) && x.mean !== w.mean) out.push(x);
    }
    if (out.length >= n) break;
  }
  return out;
}

const explainWord = (w) =>
  `<b>${esc(w.w)}</b> — ${esc(w.mean)}. <a href="#/word/${w.id}">Open the word</a>`;

// Every builder returns { kind, prompt, choices: [{ label, right }], style, explain, wordId }
export const Q = {
  meaning(w) {
    return {
      kind: 'What does it mean?', wordId: w.id, style: 'text',
      prompt: `<span class="q-word">${esc(w.w)}</span> ${speakBtn(w.w)}`,
      choices: shuffle([{ label: w.mean, right: true }, ...distractors(w, 3, { sameRoom: false }).map((x) => ({ label: x.mean }))]),
      explain: explainWord(w),
    };
  },
  word(w) {
    return {
      kind: 'Which word means this?', wordId: w.id, style: 'word',
      prompt: esc(w.mean),
      choices: shuffle([{ label: w.w, right: true }, ...distractors(w).map((x) => ({ label: x.w }))]),
      explain: explainWord(w),
    };
  },
  gap(w) {
    const g = gapWord(w.ex, w.w);
    if (!g) return Q.word(w);
    return {
      kind: 'Fill the gap', wordId: w.id, style: 'word',
      prompt: `${esc(g.before)}<span class="gap" data-fill="${esc(g.word)}"></span>${esc(g.after)}`,
      choices: shuffle([{ label: w.w, right: true }, ...distractors(w).map((x) => ({ label: x.w }))]),
      explain: explainWord(w),
    };
  },
  instead(w) {
    if (!w.instead) return Q.gap(w);
    return {
      kind: 'One better word', wordId: w.id, style: 'word',
      prompt: `Instead of <s>${esc(w.instead)}</s>, say…`,
      choices: shuffle([{ label: w.w, right: true }, ...distractors(w).map((x) => ({ label: x.w }))]),
      explain: explainWord(w) + `<br><span class="muted">${esc(w.ex)}</span>`,
    };
  },
  stronger(ladder) {
    const steps = ladder.steps;
    let i = Math.floor(Math.random() * steps.length), j;
    // At least two steps apart: neighbours (gigantic / colossal) are too close to call.
    do { j = Math.floor(Math.random() * steps.length); } while (Math.abs(i - j) < 2);
    const [a, b] = [steps[i], steps[j]];
    const strong = i > j ? a : b;
    return {
      kind: `Which is stronger? (${ladder.tired})`, style: 'two',
      prompt: `Which word is <b>stronger</b>?`,
      choices: shuffle([a, b]).map((s) => ({ label: s.w, right: s === strong })),
      explain: steps.map((s) => (s === a || s === b ? `<b>${esc(s.w)}</b>` : esc(s.w))).join(' → ')
        + `<br><span class="muted">mildest → most extreme</span>`,
    };
  },
  mixup(m) {
    const q = pick(m.qs);
    const [before, after] = q.s.split(/_{2,}/);
    return {
      kind: `${m.a} or ${m.b}?`, style: 'two',
      prompt: `${esc(before)}<span class="gap" data-fill="${esc(q.a)}"></span>${esc(after ?? '')}`,
      choices: [m.a, m.b].map((x) => ({ label: x, right: x === q.a })),
      explain: `${esc(m.rule)}<br><span class="muted">Trick: ${esc(m.trick)}</span>`,
    };
  },
  root(r) {
    const right = pick(r.words);
    const others = D.roots.filter((x) => x !== r).flatMap((x) => x.words)
      .filter((x) => !r.words.some((y) => y.w === x.w));
    return {
      kind: 'Root hunt', style: 'word',
      prompt: `Which word grows from <b>${esc(r.root)}</b> (“${esc(r.means)}”)?`,
      choices: shuffle([{ label: right.w, right: true }, ...sample(others, 3).map((x) => ({ label: x.w }))]),
      explain: `<b>${esc(right.w)}</b> — ${esc(right.m)}.` + (r.echo ? `<br><span class="muted">Hindi echo: ${esc(r.echo)}</span>` : ''),
    };
  },
};

/** A mix of question types for words you are learning. */
export function reviewQuestion(w) {
  const kinds = ['meaning', 'gap', 'word'];
  if (w.instead) kinds.push('instead');
  return Q[pick(kinds)](w);
}

/**
 * Run a list of questions inside el.
 * opts: { title, onDone(results), timed: seconds, endless: () => question, track: true }
 */
export function runQuiz(el, questions, opts = {}) {
  let i = 0, results = [], deadline = 0, timerId = 0, locked = false;
  const total = opts.timed ? 0 : questions.length;

  if (opts.timed) {
    deadline = Date.now() + opts.timed * 1000;
    timerId = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      const bar = el.querySelector('.timer i');
      if (bar) bar.style.width = (left / (opts.timed * 1000)) * 100 + '%';
      const s = el.querySelector('.secs');
      if (s) s.textContent = Math.ceil(left / 1000) + 's';
      if (!left) finish();
    }, 200);
  }

  function finish() {
    clearInterval(timerId);
    if (el.dataset.done) return;
    el.dataset.done = '1';
    opts.onDone?.(results);
  }

  function header() {
    if (opts.timed) {
      const right = results.filter((r) => r.right).length;
      return `<div class="score-line"><span>${right} right</span><span class="secs">${opts.timed}s</span></div><div class="timer"><i style="width:100%"></i></div>`;
    }
    return `<div class="progress" aria-hidden="true">${questions.map((_, k) =>
      `<i class="${k < i ? (results[k]?.right ? 'done' : 'miss') : k === i ? 'now' : ''}"></i>`).join('')}</div>`;
  }

  function show() {
    if (!opts.timed && i >= total) return finish();
    const q = opts.timed ? opts.endless() : questions[i];
    locked = false;
    el.innerHTML = `<div class="session fade-in">${header()}
      <div class="q">
        <div class="q-kind">${esc(q.kind)}${total ? ` · ${i + 1} of ${total}` : ''}</div>
        <p class="q-prompt">${q.prompt}</p>
        <div class="choices ${q.style === 'two' ? 'two' : ''}">
          ${q.choices.map((c, k) => `<button class="choice ${q.style === 'text' ? '' : 'word'}" data-k="${k}">${esc(c.label)}</button>`).join('')}
        </div>
        <div class="fb"></div>
      </div></div>`;
    el.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => choose(q, +b.dataset.k)));
    el.querySelector('.choice')?.focus({ preventScroll: true });
  }

  function choose(q, k) {
    if (locked) return;
    locked = true;
    const right = !!q.choices[k].right;
    results.push({ right, wordId: q.wordId });
    if (q.wordId && opts.track === 'review') answer(q.wordId, right);
    else if (q.wordId && opts.track === 'game') answerGame(q.wordId, right);
    const btns = el.querySelectorAll('.choice');
    btns.forEach((b, n) => {
      b.disabled = true;
      if (q.choices[n].right) b.classList.add('right');
      else if (n === k) b.classList.add('wrong');
    });
    const gap = el.querySelector('.gap');
    if (gap) { gap.textContent = gap.dataset.fill; gap.classList.add('filled'); }
    if (opts.timed) {
      setTimeout(() => { if (!el.dataset.done) show(); }, right ? 380 : 1100);
      return;
    }
    el.querySelector('.fb').innerHTML = `
      <div class="feedback ${right ? 'good' : 'bad'}">${right ? 'Right.' : 'Not quite.'} ${q.explain || ''}</div>
      <div class="q-actions"><span></span><button class="btn primary next">${i + 1 >= total ? 'See result' : 'Next'}</button></div>`;
    const next = el.querySelector('.next');
    next.focus({ preventScroll: true });
    next.addEventListener('click', () => { i++; show(); });
  }

  el.dataset.done = '';
  show();
  return () => clearInterval(timerId);
}

/** Put the ladder in order: tap words mildest → most extreme. */
export function runLadder(el, ladders, { onDone } = {}) {
  let li = 0, score = 0;
  function show() {
    if (li >= ladders.length) return onDone?.(score, ladders.length);
    const L = ladders[li];
    const steps = L.steps.length > 5 ? L.steps.filter((_, k) => k !== Math.floor(Math.random() * L.steps.length)).slice(0, 5) : L.steps.slice();
    const order = steps.map((s) => s.w);
    let picked = [];
    const pool = shuffle(steps);
    function draw(done) {
      el.innerHTML = `<div class="session fade-in">
        <div class="progress">${ladders.map((_, k) => `<i class="${k < li ? 'done' : k === li ? 'now' : ''}"></i>`).join('')}</div>
        <div class="q">
          <div class="q-kind">Build the ladder · ${li + 1} of ${ladders.length}</div>
          <p class="q-prompt">Put these in order, from mildest to most extreme: words for <b>${esc(L.tired)}</b>.</p>
          <div class="strength"><span>mildest</span><span>most extreme</span></div>
          <div class="ladder-slots">
            ${order.map((_, k) => {
              const w = picked[k];
              const st = done ? (w === order[k] ? 'right' : 'wrong') : '';
              const m = done ? steps.find((s) => s.w === order[k]).m : '';
              return `<div class="slot ${w ? 'filled' : ''} ${st}" data-k="${k}"><i>${k + 1}</i><b>${w ? esc(w) : ''}${done && w !== order[k] ? ` <span class="muted">→ ${esc(order[k])}</span>` : ''}${done ? `<small>${esc(order[k])}: ${esc(m)}</small>` : ''}</b></div>`;
            }).join('')}
          </div>
          ${done ? '' : `<div class="ladder-pick choices">${pool.filter((s) => !picked.includes(s.w)).map((s) =>
            `<button class="choice word" data-w="${esc(s.w)}">${esc(s.w)}</button>`).join('')}</div>
            <p class="small muted">Tap a filled step to take it back.</p>`}
          ${done ? `<div class="feedback ${picked.join() === order.join() ? 'good' : 'bad'}">${picked.join() === order.join() ? 'Perfect order.' : `${picked.filter((w, k) => w === order[k]).length} of ${order.length} in the right place.`}</div>
            <div class="q-actions"><span></span><button class="btn primary next">${li + 1 >= ladders.length ? 'See result' : 'Next ladder'}</button></div>` : ''}
        </div></div>`;
      el.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => {
        picked.push(b.dataset.w);
        if (picked.length === order.length) {
          if (picked.join() === order.join()) score++;
          draw(true);
        } else draw(false);
      }));
      el.querySelectorAll('.slot.filled').forEach((s) => !done && s.addEventListener('click', () => {
        picked = picked.slice(0, +s.dataset.k); draw(false);
      }));
      el.querySelector('.next')?.addEventListener('click', () => { li++; show(); });
    }
    draw(false);
  }
  show();
}

export const isLaid = (id) => statusOf(id) === 'laid';
