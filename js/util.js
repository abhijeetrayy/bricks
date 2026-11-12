import { setting } from './store.js';

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const sample = (a, n) => shuffle(a).slice(0, n);

// A seeded shuffle, so "today's words" are the same all day.
export function seeded(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

const wordRe = (w) => new RegExp(`(^|[^\\p{L}])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}])`, 'iu');

/** Example sentence with the headword marked. */
export function markWord(ex, w) {
  const m = ex.match(wordRe(w));
  if (!m) return esc(ex);
  const i = m.index + m[1].length;
  return esc(ex.slice(0, i)) + '<mark>' + esc(m[2]) + '</mark>' + esc(ex.slice(i + m[2].length));
}
/** Example sentence with the headword replaced by a gap. Returns null if the word is not found. */
export function gapWord(ex, w) {
  const m = ex.match(wordRe(w));
  if (!m) return null;
  const i = m.index + m[1].length;
  return { before: ex.slice(0, i), word: m[2], after: ex.slice(i + m[2].length) };
}

// ---------- speech (the browser's own voices; nothing is sent anywhere) ----------
let voice = null;
function chooseVoice() {
  const vs = speechSynthesis.getVoices();
  const pref = ['en-IN', 'en-GB', 'en-US'];
  for (const lang of pref) {
    const good = vs.filter((v) => v.lang.replace('_', '-') === lang);
    const nice = good.find((v) => /natural|premium|enhanced|google/i.test(v.name));
    if (nice || good[0]) return nice || good[0];
  }
  return vs.find((v) => v.lang.startsWith('en')) || null;
}
export const canSpeak = () => 'speechSynthesis' in window;
export function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  voice = voice || chooseVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 0.88;
  speechSynthesis.speak(u);
}
if (canSpeak()) speechSynthesis.onvoiceschanged = () => { voice = chooseVoice(); };

export const SPEAK_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const speakBtn = (text, label) => canSpeak() && setting('voice') !== false
  ? `<button class="speak" data-speak="${esc(text)}" aria-label="${esc(label || 'Hear ' + text)}">${SPEAK_ICON}</button>` : '';

// ---------- toast ----------
let tt;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---------- share ----------
export async function share(text) {
  const url = location.href.split('#')[0];
  if (navigator.share) {
    try { await navigator.share({ text, url }); return; } catch { return; }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
}
