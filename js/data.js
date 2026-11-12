// Rooms, floors, and loading every data file.

export const ROOMS = [
  { id: 'think',    name: 'Think clearly',          c: '#1F5FBF', code: 'TH', line: 'Words for reasoning: evidence, bias, nuance.' },
  { id: 'argue',    name: 'Agree and disagree',     c: '#D23B2B', code: 'AG', line: 'Persuade, concede, refute — without shouting.' },
  { id: 'doubt',    name: 'Sure or not sure',       c: '#6D4BC3', code: 'SN', line: 'Say exactly how certain you are.' },
  { id: 'feel',     name: 'Feelings, precisely',    c: '#B0287A', code: 'FE', line: 'Name a feeling exactly and it gets easier to handle.' },
  { id: 'people',   name: 'People and character',   c: '#E07A1F', code: 'PC', line: 'Describe a person fairly and exactly.' },
  { id: 'talk',     name: 'Ways of saying',         c: '#E8A800', code: 'WS', line: 'Better than "said", "told" and "asked".' },
  { id: 'phrasal',  name: 'Phrasal verbs',          c: '#0E9AA7', code: 'PV', line: 'Figure out, turn down, come up with — how English is really spoken.' },
  { id: 'idioms',   name: 'Expressions',            c: '#8A6A3B', code: 'EX', line: 'The elephant in the room, a grey area: a picture in a phrase.' },
  { id: 'lead',     name: 'Lead and work',          c: '#1E9A5A', code: 'LW', line: 'Meetings, teams, decisions, plans.' },
  { id: 'everyday', name: 'Everyday upgrades',      c: '#7C8794', code: 'EU', line: 'Polite, practical words for office and home.' },
  { id: 'link',     name: 'Joining words',          c: '#2FA7E0', code: 'JW', line: 'However, whereas, despite — grammar that makes logic flow.' },
  { id: 'change',   name: 'Change and time',        c: '#7FB02F', code: 'CT', line: 'How things grow, fall, last or vanish.' },
  { id: 'amount',   name: 'How much',               c: '#E5568E', code: 'HM', line: 'Stop saying "very". Say how much.' },
  { id: 'cause',    name: 'Cause and effect',       c: '#00566E', code: 'CE', line: 'Why things happen and what follows.' },
  { id: 'world',    name: 'Paint a picture',        c: '#9E8F1E', code: 'PP', line: 'Places, weather, smells and sounds.' },
  { id: 'society',  name: 'Society and public life', c: '#6B2C1E', code: 'SP', line: 'Words for news, rights and power. No sides taken.' },
];

export const FLOORS = [
  { n: 1, name: 'Zone 1', tag: 'Everyday',   line: 'You have seen these words. Now start using them.' },
  { n: 2, name: 'Zone 2', tag: 'Clear',      line: 'The words of good news, office and college talk.' },
  { n: 3, name: 'Zone 3', tag: 'Precise',    line: 'Words that sharpen exactly what you mean.' },
  { n: 4, name: 'Zone 4', tag: 'Persuasive', line: 'Words of strong writers, lawyers and leaders.' },
  { n: 5, name: 'Zone 5', tag: 'Rare',       line: 'Rare but powerful. Know them; use them sparingly.' },
];

export const D = {
  words: [], byId: new Map(), byRoom: new Map(), byFloor: new Map(),
  ladders: [], roots: [], mixups: [], indian: [], say: [],
  phrases: [], upgrades: [], partners: [], talk: [],
};
const EXTRA = ['ladders', 'roots', 'mixups', 'indian', 'say', 'phrases', 'upgrades', 'partners', 'talk'];

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
  const roomFiles = await Promise.all(ROOMS.map((r) => get(`data/words-${r.id}.json`)));
  const extra = await Promise.all(EXTRA.map((n) => get(`data/${n}.json`)));
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
  EXTRA.forEach((n, i) => { D[n] = extra[i] || []; });
  D.upgrades = D.upgrades.filter((u) => u.parts?.every((p) => typeof p === 'string' || p.options?.includes(p.pick)));
  return D;
}

export const roomOf = (id) => ROOMS.find((r) => r.id === id);
export const floorOf = (n) => FLOORS.find((f) => f.n === n);
