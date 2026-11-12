// Question builders and runners for Revise and every practice.
import { D } from './data.js';
import { esc, shuffle, sample, pick, gapWord, speakBtn, speak } from './util.js';
import { answer, answerGame } from './store.js';

const posKey = (w) => (w.pos || '').split(/[\s/,(]/)[0].toLowerCase();

/** n other words that make fair wrong answers for w (same kind of word, ideally same room). */
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
    for (const x of shuffle(t)) { if (out.length >= n) break; if (!out.includes(x) && x.mean !== w.mean) out.push(x); }
    if (out.length >= n) break;
  }
  return out;
}

const explainWord = (w) => `<b>${esc(w.w)}</b> — ${esc(w.mean)}. <a href="#/word/${w.id}">Open the word</a>`;
const gapHTML = (before, fill, after) => `${esc(before)}<span class="gap" data-fill="${esc(fill)}"></span>${esc(after)}`;

// Each builder returns { kind, prompt, choices: [{ label, right }], style: 'text'|'word'|'cols', explain, wordId }
export const Q = {
  meaning(w) {
    return {
      kind: 'What does it mean?', wordId: w.id, style: 'text',
      prompt: `<span class="q-word">${esc(w.w)}</span>${speakBtn(w.w)}`,
      choices: shuffle([{ label: w.mean, right: true }, ...distractors(w, 3, { sameRoom: false }).map((x) => ({ label: x.mean }))]),
      explain: explainWord(w),
    };
  },
  word(w) {
    return {
      kind: 'Which word means this?', wordId: w.id, style: 'word', prompt: esc(w.mean),
      choices: shuffle([{ label: w.w, right: true }, ...distractors(w).map((x) => ({ label: x.w }))]),
      explain: explainWord(w),
    };
  },
  gap(w) {
    const g = gapWord(w.ex, w.w);
    if (!g) return Q.word(w);
    return {
      kind: 'Fill the gap', wordId: w.id, style: 'word', prompt: gapHTML(g.before, g.word, g.after),
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
  stronger(L) {
    const s = L.steps;
    const i = Math.floor(Math.random() * s.length);
    let j; do { j = Math.floor(Math.random() * s.length); } while (Math.abs(i - j) < 2); // neighbours are too close to call
    const strong = s[Math.max(i, j)];
    return {
      kind: `Which is stronger? · words for “${L.tired}”`, style: 'cols', prompt: 'Which word is <b>stronger</b>?',
      choices: shuffle([s[i], s[j]]).map((x) => ({ label: x.w, right: x === strong })),
      explain: s.map((x) => (x === s[i] || x === s[j] ? `<b>${esc(x.w)}</b>` : esc(x.w))).join(' → ') + '<br><span class="muted">mildest → most extreme</span>',
    };
  },
  mixup(m) {
    const q = pick(m.qs);
    const [before, after = ''] = q.s.split(/_{2,}/);
    return {
      kind: `${m.a} or ${m.b}?`, style: 'cols', prompt: gapHTML(before, q.a, after),
      choices: [m.a, m.b].map((x) => ({ label: x, right: x === q.a })),
      explain: `${esc(m.rule)}<br><span class="muted">Trick: ${esc(m.trick)}</span>`,
    };
  },
  root(r) {
    const right = pick(r.words);
    const others = D.roots.filter((x) => x !== r).flatMap((x) => x.words).filter((x) => !r.words.some((y) => y.w === x.w));
    return {
      kind: 'Root hunt', style: 'word', prompt: `Which word grows from <b>${esc(r.root)}</b> (“${esc(r.means)}”)?`,
      choices: shuffle([{ label: right.w, right: true }, ...sample(others, 3).map((x) => ({ label: x.w }))]),
      explain: `<b>${esc(right.w)}</b> — ${esc(right.m)}.` + (r.echo ? `<br><span class="muted">Hindi echo: ${esc(r.echo)}</span>` : ''),
    };
  },
  /** Situation → the phrase that works, against two that don't. */
  best(sit) {
    const good = pick(sit.phrases);
    const bad = sample(sit.avoid, 2);
    return {
      kind: 'Which sounds best?', style: 'text',
      prompt: `${esc(sit.title)}<span class="when">${esc(sit.when)}</span>`,
      choices: shuffle([{ label: good.p, right: true }, ...bad.map((a) => ({ label: a.p }))]),
      explain: bad.map((a) => `<s>${esc(a.p)}</s> — ${esc(a.why)}`).join('<br>') + `<br><a href="#/phrases/${sit.id}">All phrases for this</a>`,
    };
  },
  partner(p) {
    const [before, after = ''] = p.s.split(/_{2,}/);
    return {
      kind: 'Natural partners', style: 'cols', prompt: gapHTML(before, p.a, after),
      choices: shuffle([{ label: p.a, right: true }, ...p.wrong.map((x) => ({ label: x }))]),
      explain: `We say <b>${esc(p.pair)}</b>. ${esc(p.note || '')}`,
    };
  },
};

export function reviewQuestion(w) {
  const kinds = ['meaning', 'gap', 'word'];
  if (w.instead) kinds.push('instead');
  return Q[pick(kinds)](w);
}

/**
 * Run questions inside el. opts: { onDone(results), timed: seconds, endless: () => question, track: 'review'|'game'|false }
 */
export function runQuiz(el, questions, opts = {}) {
  let i = 0, locked = false, timerId = 0, deadline = 0;
  const results = [];
  const total = opts.timed ? 0 : questions.length;
  el.dataset.done = '';

  if (opts.timed) {
    deadline = Date.now() + opts.timed * 1000;
    timerId = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      const bar = el.querySelector('.timer i'); if (bar) bar.style.width = (left / (opts.timed * 1000)) * 100 + '%';
      const s = el.querySelector('.secs'); if (s) s.textContent = Math.ceil(left / 1000) + 's';
      if (!left) finish();
    }, 200);
  }
  function finish() { clearInterval(timerId); if (el.dataset.done) return; el.dataset.done = '1'; opts.onDone?.(results); }

  const header = () => opts.timed
    ? `<div class="score-line"><span>${results.filter((r) => r.right).length} right</span><span class="secs">${opts.timed}s</span></div><div class="timer"><i style="width:100%"></i></div>`
    : `<div class="progress" aria-hidden="true">${questions.map((_, k) => `<i class="${k < i ? (results[k]?.right ? 'done' : 'miss') : k === i ? 'now' : ''}"></i>`).join('')}</div>`;

  function show() {
    if (!opts.timed && i >= total) return finish();
    const q = opts.timed ? opts.endless() : questions[i];
    locked = false;
    el.innerHTML = `<div class="session enter">${header()}<div class="q">
      <div class="q-kind">${esc(q.kind)}${total ? ` · ${i + 1} of ${total}` : ''}</div>
      <p class="q-prompt">${q.prompt}</p>
      <div class="choices ${q.style === 'cols' ? 'cols' : ''}">
        ${q.choices.map((c, k) => `<button class="choice ${q.style === 'text' ? '' : 'word'}" data-k="${k}">${esc(c.label)}</button>`).join('')}
      </div><div class="fb" aria-live="polite"></div></div></div>`;
    el.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => choose(q, +b.dataset.k)));
    el.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.speak)));
    el.querySelector('.choice')?.focus({ preventScroll: true });
  }

  function choose(q, k) {
    if (locked) return; locked = true;
    const right = !!q.choices[k].right;
    results.push({ right, wordId: q.wordId });
    if (q.wordId && opts.track === 'review') answer(q.wordId, right);
    else if (q.wordId && opts.track === 'game') answerGame(q.wordId, right);
    el.querySelectorAll('.choice').forEach((b, n) => {
      b.disabled = true;
      if (q.choices[n].right) b.classList.add('right'); else if (n === k) b.classList.add('wrong');
    });
    const gap = el.querySelector('.gap'); if (gap) { gap.textContent = gap.dataset.fill; gap.classList.add('filled'); }
    if (opts.timed) { setTimeout(() => { if (!el.dataset.done) show(); }, right ? 380 : 1100); return; }
    el.querySelector('.fb').innerHTML = `<div class="feedback ${right ? 'good' : 'bad'}">${right ? 'Right.' : 'Not quite.'} ${q.explain || ''}</div>
      <div class="q-actions"><span></span><button class="btn dark next">${i + 1 >= total ? 'See result' : 'Next'}</button></div>`;
    const next = el.querySelector('.next'); next.focus({ preventScroll: true });
    next.addEventListener('click', () => { i++; show(); });
  }
  show();
  return () => clearInterval(timerId);
}

/** Put a ladder in order, mildest → most extreme. */
export function runLadder(el, ladders, { onDone } = {}) {
  let li = 0, score = 0;
  function show() {
    if (li >= ladders.length) return onDone?.(score, ladders.length);
    const L = ladders[li];
    let steps = L.steps.slice();
    while (steps.length > 5) steps.splice(1 + Math.floor(Math.random() * (steps.length - 2)), 1);
    const order = steps.map((s) => s.w);
    const pool = shuffle(steps);
    let picked = [];
    function draw(done) {
      const ok = picked.join() === order.join();
      el.innerHTML = `<div class="session enter">
        <div class="progress">${ladders.map((_, k) => `<i class="${k < li ? 'done' : k === li ? 'now' : ''}"></i>`).join('')}</div>
        <div class="q"><div class="q-kind">Build the ladder · ${li + 1} of ${ladders.length}</div>
          <p class="q-prompt">Put these words for <b>${esc(L.tired)}</b> in order, from mildest to most extreme.</p>
          <div class="ends"><span>mildest</span><span>most extreme</span></div>
          <div class="ladder-slots">${order.map((_, k) => {
            const w = picked[k]; const st = done ? (w === order[k] ? 'right' : 'wrong') : '';
            return `<div class="slot ${w ? 'filled' : ''} ${st}" data-k="${k}"><i>${k + 1}</i><b>${w ? esc(w) : ''}${done && w !== order[k] ? ` <span class="muted">→ ${esc(order[k])}</span>` : ''}${done ? `<small>${esc(order[k])}: ${esc(steps[k].m)}</small>` : ''}</b></div>`;
          }).join('')}</div>
          ${done ? `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? 'Perfect order.' : `${picked.filter((w, k) => w === order[k]).length} of ${order.length} in the right place.`}</div>
            <div class="q-actions"><span></span><button class="btn dark next">${li + 1 >= ladders.length ? 'See result' : 'Next ladder'}</button></div>`
          : `<div class="choices">${pool.filter((s) => !picked.includes(s.w)).map((s) => `<button class="choice word" data-w="${esc(s.w)}">${esc(s.w)}</button>`).join('')}</div>
            <p class="small muted" style="margin-top:12px">Tap a filled step to take it back.</p>`}
        </div></div>`;
      el.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => {
        picked.push(b.dataset.w);
        if (picked.length === order.length) { if (picked.join() === order.join()) score++; draw(true); } else draw(false);
      }));
      if (!done) el.querySelectorAll('.slot.filled').forEach((s) => s.addEventListener('click', () => { picked = picked.slice(0, +s.dataset.k); draw(false); }));
      el.querySelector('.next')?.addEventListener('click', () => { li++; show(); });
    }
    draw(false);
  }
  show();
}

/** Upgrade the sentence: replace each tired phrase in turn, then read the finished sentence. */
export function runUpgrade(el, items, { onDone } = {}) {
  let ii = 0, right = 0, slotsTotal = 0;
  function show() {
    if (ii >= items.length) return onDone?.(right, slotsTotal);
    const parts = items[ii].parts;
    const slots = parts.filter((p) => typeof p !== 'string');
    const chosen = [];
    let si = 0;
    const sentence = (final) => parts.map((p) => {
      if (typeof p === 'string') return esc(p);
      const k = slots.indexOf(p);
      if (final) return `<b>${esc(p.pick)}</b>`;
      if (k < si) return `<span class="gap filled">${esc(p.pick)}</span>`;
      if (k === si) return `<s>${esc(p.tired)}</s><span class="gap now"></span>`;
      return `<s>${esc(p.tired)}</s>`;
    }).join('');
    function draw(fb) {
      const done = si >= slots.length;
      const plain = parts.map((p) => (typeof p === 'string' ? p : p.pick)).join('');
      el.innerHTML = `<div class="session enter">
        <div class="progress">${items.map((_, k) => `<i class="${k < ii ? 'done' : k === ii ? 'now' : ''}"></i>`).join('')}</div>
        <div class="q"><div class="q-kind">Upgrade the sentence · ${ii + 1} of ${items.length}</div>
        ${done ? `<p class="final">${sentence(true)}</p>${fb || ''}<div style="margin-top:14px">${speakBtn(plain, 'Hear the sentence')}</div>
          <p class="small muted" style="margin-top:12px">Read it aloud once. Hearing yourself say it is how it becomes yours.</p>
          <div class="q-actions"><span></span><button class="btn dark next">${ii + 1 >= items.length ? 'See result' : 'Next sentence'}</button></div>`
        : `<p class="q-prompt">${sentence(false)}</p>
          <p class="label">Replace “${esc(slots[si].tired)}” with:</p>
          <div class="choices cols">${shuffle(slots[si].options).map((o) => `<button class="choice word" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
        <div class="fb" aria-live="polite">${done ? '' : fb || ''}</div></div></div>`;
      el.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
        const s = slots[si]; const ok = b.dataset.o === s.pick;
        slotsTotal++; if (ok) right++;
        const w = D.byId.get(s.pick.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const fbHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? 'Right.' : `Better: <b>${esc(s.pick)}</b>.`} ${esc(s.why)}${w ? ` <a href="#/word/${w.id}">Open the word</a>` : ''}</div>`;
        chosen.push(b.dataset.o); si++; draw(fbHTML);
      }));
      el.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.speak)));
      el.querySelector('.next')?.addEventListener('click', () => { ii++; show(); });
    }
    draw('');
  }
  show();
}
