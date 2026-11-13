// Words, organised by what they help you do: think clearly, express yourself, understand people, describe the world.
// "The more words you have, the bigger the house you can build." — after Javed Akhtar

export const PARTS = [
  { id: 'think', title: 'Think clearly', line: 'Words to reason with. Clear words make clear thoughts.', tint: 't5' },
  { id: 'express', title: 'Express yourself', line: 'Words to say what you mean, and hold your ground.', tint: 't3' },
  { id: 'people', title: 'Understand people', line: 'Words for what people feel, who they are, and what they really mean.', tint: 't2' },
  { id: 'world', title: 'Describe the world', line: 'Words for places, work and public life, beyond “very good” and “very bad”.', tint: 't1' },
];

// Each category is one or more word files. Every word belongs to exactly one category.
export const CATS = [
  { id: 'reason', part: 'think', name: 'Reasoning', line: 'Evidence, assumptions, bias, nuance.', rooms: ['think'] },
  { id: 'certainty', part: 'think', name: 'Certainty and doubt', line: 'Say exactly how sure you are.', rooms: ['doubt'] },
  { id: 'cause', part: 'think', name: 'Cause and effect', line: 'Why things happen, and what follows.', rooms: ['cause'] },
  { id: 'change', part: 'think', name: 'Change and time', line: 'How things grow, fall, last or fade.', rooms: ['change'] },
  { id: 'degree', part: 'think', name: 'Size and degree', line: 'Say how much, instead of “very”.', rooms: ['amount'] },
  { id: 'link', part: 'think', name: 'Linking ideas', line: 'However, whereas, despite: words that make logic flow.', rooms: ['link'] },
  { id: 'opinion', part: 'express', name: 'Opinions', line: 'Give your view clearly and make it land.', rooms: ['opinion'] },
  { id: 'argue', part: 'express', name: 'Agreeing and disagreeing', line: 'Persuade, concede, refute — without shouting.', rooms: ['argue'] },
  { id: 'firm', part: 'express', name: 'Being firm', line: 'Confident, not rude: hold a position, say no.', rooms: ['firm'] },
  { id: 'speak', part: 'express', name: 'Ways of speaking', line: 'Better than “said”, “told” and “asked”.', rooms: ['talk'] },
  { id: 'feel', part: 'people', name: 'Feelings', line: 'Name a feeling exactly and it gets easier to handle.', rooms: ['feel'] },
  { id: 'anger', part: 'people', name: 'Anger and discontent', line: 'From mildly annoyed to outraged, and why.', rooms: ['upset'] },
  { id: 'character', part: 'people', name: 'Character', line: 'Describe a person fairly and exactly.', rooms: ['people'] },
  { id: 'hidden', part: 'people', name: 'Hidden meanings', line: 'Hints, spin, sarcasm and what is left unsaid.', rooms: ['read'] },
  { id: 'places', part: 'world', name: 'Places and senses', line: 'Weather, streets, smells and sounds.', rooms: ['world'] },
  { id: 'work', part: 'world', name: 'Work and daily life', line: 'Meetings, plans, teams and polite requests.', rooms: ['lead', 'everyday'] },
  { id: 'society', part: 'world', name: 'Society and public life', line: 'Rights, power and the news. No sides taken.', rooms: ['society'] },
  { id: 'verbs', part: 'world', name: 'Everyday verbs', line: 'Figure out, turn down, put off: how English is really spoken.', rooms: ['phrasal'] },
];

export const FLOORS = [
  { n: 1, name: 'Level 1', tag: 'Everyday', line: 'You have seen these words. Now start using them.' },
  { n: 2, name: 'Level 2', tag: 'Clear', line: 'The words of good news, office and college talk.' },
  { n: 3, name: 'Level 3', tag: 'Precise', line: 'Words that sharpen exactly what you mean.' },
  { n: 4, name: 'Level 4', tag: 'Persuasive', line: 'Words of strong writers, lawyers and leaders.' },
  { n: 5, name: 'Level 5', tag: 'Rare', line: 'Rare but powerful. Know them; use them sparingly.' },
];

export const D = { words: [], byId: new Map(), byCat: new Map(), byFloor: new Map(), ladders: [], upgrades: [], talk: [] };
const EXTRA = ['ladders', 'upgrades', 'talk'];

export const slug = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Fetch one data file, retrying a dropped connection (common on weak mobile networks).
async function get(path, fallback = []) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(path, { cache: 'no-cache' });
      if (r.ok) return await r.json();
      if (r.status === 404) return fallback;
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 300 * (attempt + 1)));
  }
  return fallback;
}

export async function loadAll() {
  const rooms = [...new Set(CATS.flatMap((c) => c.rooms))];
  const files = await Promise.all(rooms.map((r) => get(`data/words-${r}.json`)));
  const byRoom = new Map(rooms.map((r, i) => [r, files[i] || []]));
  for (const c of CATS) {
    const list = [];
    for (const r of c.rooms) for (const x of byRoom.get(r)) {
      const w = { ...x, cat: c.id, id: slug(x.w) };
      if (D.byId.has(w.id)) continue;
      D.byId.set(w.id, w); D.words.push(w); list.push(w);
    }
    list.sort((a, b) => a.floor - b.floor);
    D.byCat.set(c.id, list);
  }
  for (const f of FLOORS) D.byFloor.set(f.n, D.words.filter((w) => w.floor === f.n));
  const extra = await Promise.all(EXTRA.map((n) => get(`data/${n}.json`)));
  EXTRA.forEach((n, i) => { D[n] = extra[i] || []; });
  // keep only upgrade sentences whose answers are words on the site
  D.upgrades = D.upgrades.filter((u) => u.parts?.every((p) => typeof p === 'string' || (p.options?.includes(p.pick) && D.byId.has(slug(p.pick)))));
  return D;
}

export const catOf = (id) => CATS.find((c) => c.id === id);
export const partOf = (id) => PARTS.find((p) => p.id === id);
export const floorOf = (n) => FLOORS.find((f) => f.n === n);
// old links used file names ("feel", "talk") or intents; map them to categories
export const catForRoom = (room) => CATS.find((c) => c.rooms.includes(room))?.id || CATS.find((c) => c.id === room)?.id;
