// Rooms, floors, and loading every data file.

export const ROOMS = [
  { id: 'think',    name: 'Think clearly',          line: 'Words for reasoning: evidence, bias, nuance.' },
  { id: 'argue',    name: 'Agree and disagree',     line: 'Persuade, concede, refute — without shouting.' },
  { id: 'doubt',    name: 'Sure or not sure',       line: 'Say exactly how certain you are.' },
  { id: 'feel',     name: 'Feelings, precisely',    line: 'Name a feeling exactly and it gets easier to handle.' },
  { id: 'people',   name: 'People and character',   line: 'Describe a person fairly and exactly.' },
  { id: 'talk',     name: 'Ways of saying',         line: 'Better than "said", "told" and "asked".' },
  { id: 'lead',     name: 'Lead and work',          line: 'Meetings, teams, decisions, plans.' },
  { id: 'everyday', name: 'Everyday upgrades',      line: 'Polite, practical words for office and home.' },
  { id: 'link',     name: 'Joining words',          line: 'However, whereas, despite — grammar that makes logic flow.' },
  { id: 'change',   name: 'Change and time',        line: 'How things grow, fall, last or vanish.' },
  { id: 'amount',   name: 'How much',               line: 'Stop saying "very". Say how much.' },
  { id: 'cause',    name: 'Cause and effect',       line: 'Why things happen and what follows.' },
  { id: 'world',    name: 'Paint a picture',        line: 'Places, weather, smells and sounds.' },
  { id: 'society',  name: 'Society and public life', line: 'Words for news, rights and power. No sides taken.' },
];

export const FLOORS = [
  { n: 1, name: 'Ground floor', short: 'G', line: 'You have seen these words. Now start using them.' },
  { n: 2, name: 'First floor',  short: '1', line: 'Clear: the words of good news, office and college talk.' },
  { n: 3, name: 'Second floor', short: '2', line: 'Precise: words that sharpen what you mean.' },
  { n: 4, name: 'Third floor',  short: '3', line: 'Persuasive: words of strong writers and leaders.' },
  { n: 5, name: 'Terrace',      short: 'T', line: 'Rare but powerful. Know them; use them sparingly.' },
];

export const D = {
  words: [], byId: new Map(), byRoom: new Map(), byFloor: new Map(),
  ladders: [], roots: [], mixups: [], indian: [], say: [],
};

export const slug = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function get(path, fallback = []) {
  try {
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) return fallback;
    return await r.json();
  } catch { return fallback; }
}

export async function loadAll() {
  const roomFiles = await Promise.all(ROOMS.map((r) => get(`data/words-${r.id}.json`)));
  const [ladders, roots, mixups, indian, say] = await Promise.all(
    ['ladders', 'roots', 'mixups', 'indian', 'say'].map((n) => get(`data/${n}.json`)));
  ROOMS.forEach((r, i) => {
    const list = (roomFiles[i] || []).map((x) => ({ ...x, room: r.id, id: slug(x.w) }));
    list.sort((a, b) => a.floor - b.floor);
    D.byRoom.set(r.id, list);
    for (const x of list) {
      if (D.byId.has(x.id)) continue;
      D.byId.set(x.id, x);
      D.words.push(x);
    }
  });
  for (const f of FLOORS) D.byFloor.set(f.n, D.words.filter((w) => w.floor === f.n));
  Object.assign(D, { ladders, roots, mixups, indian, say });
  return D;
}

export const roomOf = (id) => ROOMS.find((r) => r.id === id);
export const floorOf = (n) => FLOORS.find((f) => f.n === n);
