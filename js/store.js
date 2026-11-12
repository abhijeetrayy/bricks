// Progress lives in this browser only (localStorage). No accounts.
// Each word has a box 0–5 (Leitner). Box 0 = new. 1–2 = learning. 3+ = laid (a brick in your house).

const KEY = 'bricks.v1';
const DAY = 86400000;
// Days until the next review after reaching each box.
export const GAPS = [0, 1, 3, 7, 16, 40];

const blank = () => ({ words: {}, settings: { hindi: true, voice: true }, sentences: {}, best: {}, floor: 0, tested: false, streak: { last: '', n: 0 }, laidLog: [] });

let S = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) S = { ...blank(), ...JSON.parse(raw) };
} catch { /* private window: progress lasts this visit only */ }

export const state = () => S;
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } }

export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export const boxOf = (id) => S.words[id]?.box || 0;
export const statusOf = (id) => {
  const b = boxOf(id);
  return b >= 3 ? 'laid' : b >= 1 ? 'learning' : 'new';
};

function touchStreak() {
  const t = today();
  if (S.streak.last === t) return;
  const y = today(new Date(Date.now() - DAY));
  S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1;
  S.streak.last = t;
}

function setBox(id, box) {
  const was = statusOf(id);
  box = Math.max(1, Math.min(5, box));
  S.words[id] = { box, due: Date.now() + GAPS[box] * DAY, seen: (S.words[id]?.seen || 0) + 1 };
  const now = statusOf(id);
  if (was !== 'laid' && now === 'laid') S.laidLog.push(id);
  touchStreak();
  save();
  return { was, now };
}

/** "I know this word" — lays the brick straight away, first review in a week. */
export const markKnown = (id) => setBox(id, 3);
/** "Still learning" — box 1, back tomorrow. */
export const markLearning = (id) => setBox(id, 1);
/** Answer in a review or game. */
export function answer(id, right) {
  const b = boxOf(id);
  return right ? setBox(id, b + 1) : setBox(id, 1);
}

/** Answer inside a game: a right answer only counts when the word is new or due; a wrong one steps it down one box. */
export function answerGame(id, right) {
  const w = S.words[id];
  if (!w) return right ? setBox(id, 1) : { was: 'new', now: 'new' };
  if (right) return w.due <= Date.now() ? setBox(id, w.box + 1) : { was: statusOf(id), now: statusOf(id) };
  return setBox(id, w.box - 1);
}

export function dueIds() {
  const now = Date.now();
  return Object.entries(S.words).filter(([, v]) => v.box >= 1 && v.due <= now).map(([k]) => k);
}

export function counts(ids) {
  let laid = 0, learning = 0;
  for (const id of ids) { const s = statusOf(id); if (s === 'laid') laid++; else if (s === 'learning') learning++; }
  return { laid, learning, total: ids.length };
}

export function setting(k, v) {
  if (v === undefined) return S.settings[k];
  S.settings[k] = v; save();
}
export function setSentence(id, text) { if (text.trim()) S.sentences[id] = text.trim(); else delete S.sentences[id]; save(); }
export function setBest(game, score) {
  if (score > (S.best[game] || 0)) { S.best[game] = score; save(); return true; }
  return false;
}
export function setFloor(n) { S.floor = n; S.tested = true; delete S.todayPick; save(); }
export function reset() { S = blank(); save(); }
export function exportText() { return JSON.stringify(S); }
export function importText(t) { const o = JSON.parse(t); if (!o || typeof o.words !== 'object') throw new Error('bad'); S = { ...blank(), ...o }; save(); }
