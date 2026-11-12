# Bricks — data brief (read this before writing any data file)

Bricks is a vocabulary website for Indian learners (and anyone) who want to say what they think
more clearly. It is NOT a dictionary. Every word is a "brick": a word that an educated speaker
actually uses in a good newspaper, a podcast, a meeting or an argument. No show-off GRE-only words.

The site is a house:
- **Rooms** = what you want to say (thinking, arguing, feelings, people...). Words are grouped by
  purpose, never alphabetically.
- **Floors** = levels. You climb from the ground floor to the terrace.

| floor | name          | what it means |
|-------|---------------|---------------|
| 1     | Ground floor  | You have seen these words; now start USING them instead of a vague phrase. |
| 2     | First floor   | Clear: the words of good everyday news, office and college talk. |
| 3     | Second floor  | Precise: words that sharpen meaning (nuance, ambivalent, mitigate). |
| 4     | Third floor   | Persuasive: words of strong writers, lawyers, leaders, editorials. |
| 5     | Terrace       | Rare but powerful. Use sparingly; know them so you understand them. |

## Word entry format (words-<room>.json = a JSON array of these)

```json
{
  "w": "nuance",
  "room": "think",
  "floor": 3,
  "pos": "noun",
  "say": "NYOO-ahns",
  "mean": "a small but important difference in meaning or feeling",
  "hi": "बारीक फ़र्क",
  "ex": "Good translators catch every nuance of a Ghalib couplet.",
  "with": ["subtle nuance", "miss the nuance", "full of nuance"],
  "instead": "small difference",
  "note": "A 'nuanced view' sees more than one side of a question."
}
```

Rules, field by field:
- **w**: exactly the word you were assigned (multi-word items like "straw man" stay as given).
- **room**, **floor**: exactly as assigned. Do not change words or floors. If you think one is wrong,
  keep it and say so in your reply.
- **pos**: noun / verb / adjective / adverb / phrase / connector / phrasal verb.
- **say**: simple respelling for an Indian reader. Hyphens between syllables, the STRESSED syllable in
  CAPITALS. Use plain sounds: ay (day), ee (see), i (sit), e (bet), a (cat), ah (father), o (hot),
  oh (go), oo (food), u/uh (cup, about), ow (cow), oy (boy), eye (my). Example: "dih-TUR-min",
  "KAY-oss", "PRAG-MAT-ik" is wrong (one stress only) → "prag-MAT-ik".
- **mean**: plain English, at most ~14 words, using only common words. The definition must be easier
  than the word. Never circular. Write it so a Class 8 student understands.
- **hi**: a short Hindi gloss in Devanagari, 1–4 words, the way an educated Hindi speaker actually
  says it (everyday Hindustani; use the Urdu-origin word if that is the common one, e.g. फ़र्क not
  अंतर when both work; use a Sanskrit word only when it is the normal one). Accuracy matters more
  than elegance; if Hindi has no neat word, give the closest short phrase.
- **ex**: ONE natural sentence, at most ~22 words, set in Indian life — vary the settings: Mumbai
  local, Delhi metro, a village panchayat, cricket, board exams, a Bengaluru office, a family WhatsApp
  group, a wedding, monsoon, a chai stall, a hospital, a startup, a farmer, a news debate, a Kolkata
  adda, a hostel. Use varied Indian names from all regions and religions. The sentence MUST contain
  the headword exactly as written in "w" (same spelling, whole word, case may differ) — a game blanks
  it out. So for verbs use the base form ("we can infer", "to mitigate the risk"). The sentence
  should make the meaning guessable from context.
- **with**: 2–3 common word partners (collocations) that contain the word or a form of it,
  e.g. "strongly disagree", "a heavy downpour".
- **instead**: optional. The tired, vague phrase this word lets you replace, lowercase, e.g.
  "very small", "said angrily", "not sure". Must NOT contain the headword. Include it whenever natural
  (most adjectives and verbs); leave it out ("") when forced.
- **note**: optional, at most ~25 words: a trap Indian speakers often fall into, the difference from a
  close word (jealous vs envious), a pronunciation trap, or a formality warning. "" if nothing useful.
- Use British/Indian spelling (analyse, colour, organise), as Indian schools and newspapers do.
- Politics and society: neutral. Never name a current party or living politician; examples must not
  take sides. Religion: respectful, no side taken.
- No examples about suicide, sexual violence, or caste slurs.

## Validation (run before you finish)

```bash
node -e '
const a=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
for(const x of a){const re=new RegExp("\\b"+x.w.replace(/[-]/g,"\\$&")+"\\b","i");
 if(!re.test(x.ex))console.log("ex missing word:",x.w);
 for(const k of ["w","room","floor","pos","say","mean","hi","ex","with"]) if(x[k]===undefined||x[k]==="")console.log("missing",k,x.w);
 if(x.instead && new RegExp("\\b"+x.w+"\\b","i").test(x.instead))console.log("instead contains word",x.w);}
console.log(a.length,"entries ok-checked");' FILE.json
```

---

## The rooms and their assigned words (word:floor)

Words were chosen as "Tier 2" words (Beck, McKeown & Kucan): high-use words of mature speakers that
cut across every subject, plus the words that let you reason, persuade and name things precisely.

**think** — Think clearly (words for reasoning)
assume:1, conclude:1, evidence:1, logical:1, relevant:1, analyse:2, infer:2, bias:2, context:2,
perspective:2, implication:2, objective:2, premise:3, nuance:3, plausible:3, coherent:3,
correlation:3, fallacy:3, hypothesis:3, rigorous:4, empirical:4, paradox:4, dichotomy:4,
heuristic:5, tautology:5

**argue** — Agree, disagree, persuade
convince:1, oppose:1, admit:1, justify:1, debate:1, valid:2, counter:2, compelling:2, objection:2,
persuade:2, stance:2, contradict:2, concede:3, refute:3, undermine:3, substantiate:3, credible:3,
caveat:3, rebut:3, contend:4, cogent:4, irrefutable:4, moot:4, rhetoric:4, straw man:4, specious:5

**doubt** — Sure or not sure (certainty and careful hedging)
certain:1, likely:1, obvious:1, unclear:1, confirm:1, apparently:2, ambiguous:2, estimate:2,
speculate:2, presumably:2, tentative:2, verify:2, arguably:3, evidently:3, conceivably:3,
definitive:3, conclusive:3, sceptical:3, inconclusive:3, unequivocal:4, dubious:4, provisional:4,
ostensibly:4, equivocal:5, prima facie:5

**feel** — Feelings, precisely (emotional granularity: naming a feeling exactly helps you handle it)
nervous:1, relieved:1, lonely:1, grateful:1, embarrassed:1, anxious:2, frustrated:2, envious:2,
jealous:2, overwhelmed:2, nostalgic:2, ashamed:2, apprehensive:3, resentful:3, content:3,
ambivalent:3, elated:3, indignant:3, exasperated:3, wistful:4, melancholy:4, vindicated:4,
disillusioned:4, euphoric:4, schadenfreude:5, forlorn:5

**people** — People and character
generous:1, selfish:1, reliable:1, patient:1, stubborn:1, humble:2, arrogant:2, sincere:2,
ambitious:2, cautious:2, impulsive:2, diligent:2, candid:3, meticulous:3, resilient:3,
pragmatic:3, tactful:3, cynical:3, gullible:3, condescending:4, aloof:4, earnest:4, tenacious:4,
sycophant:4, magnanimous:5, sanctimonious:5

**talk** — Ways of saying (better than "said", "told", "asked")
explain:1, suggest:1, complain:1, warn:1, mention:1, insist:2, clarify:2, emphasise:2, remark:2,
assure:2, hint:2, urge:2, reassure:3, retort:3, mutter:3, imply:3, elaborate:3, acknowledge:3,
articulate:3, allude:4, reiterate:4, digress:4, concise:4, eloquent:4, laconic:5, euphemism:5

**lead** — Lead and work
deadline:1, priority:1, responsible:1, feedback:1, organise:1, delegate:2, initiative:2,
accountable:2, consensus:2, feasible:2, collaborate:2, negotiate:2, mitigate:3, autonomy:3,
constructive:3, bottleneck:3, iterate:3, mandate:3, scalable:3, stakeholder:4, incentive:4,
trade-off:4, foresight:4, decisive:4, groupthink:5, sunk cost:5

**everyday** — Everyday upgrades (polite, practical, office and home)
postpone:1, reschedule:1, convenient:1, appreciate:1, available:1, inconvenience:2, request:2,
follow up:2, punctual:2, considerate:2, hesitate:2, prompt:2, courteous:3, discreet:3,
reluctant:3, hospitable:3, gracious:3, frugal:3, procrastinate:3, amenable:4, cordial:4,
reciprocate:4, intrusive:4, accommodate:4, faux pas:5, impeccable:5

**link** — Joining words (connectors that make your grammar and logic flow)
however:1, although:1, therefore:1, instead:1, unless:1, whereas:2, moreover:2, despite:2,
nevertheless:2, meanwhile:2, otherwise:2, besides:2, consequently:3, likewise:3, provided that:3,
in contrast:3, furthermore:3, hence:3, albeit:3, notwithstanding:4, thereby:4, whereby:4,
insofar as:4, conversely:4, hitherto:5, vis-à-vis:5
(For connectors, the "note" should say where it goes in a sentence and the punctuation, e.g.
"However, ..." vs "although" joining two clauses; "despite + noun, not despite of".)

**change** — Change and time
gradual:1, sudden:1, improve:1, decrease:1, temporary:1, decline:2, evolve:2, stable:2, rapid:2,
permanent:2, outdated:2, revive:2, deteriorate:3, stagnate:3, surge:3, inevitable:3, transient:3,
obsolete:3, unprecedented:3, perennial:4, momentum:4, irreversible:4, flux:4, erode:4,
ephemeral:5, inertia:5

**amount** — How much (stop saying "very")
enormous:1, tiny:1, plenty:1, rare:1, average:1, considerable:2, slight:2, scarce:2, abundant:2,
excessive:2, moderate:2, adequate:2, substantial:3, negligible:3, marginal:3, drastic:3, sparse:3,
ample:3, immense:3, exponential:4, disproportionate:4, meagre:4, myriad:4, paltry:4, copious:5,
modicum:5

**cause** — Cause and effect
factor:1, due to:1, lead to:1, result in:1, prevent:1, consequence:2, trigger:2, contribute:2,
impact:2, influence:2, stem from:2, side effect:2, attribute:3, catalyst:3, underlying:3,
backfire:3, ripple effect:3, deter:3, compound:3, precipitate:4, exacerbate:4, culminate:4,
repercussion:4, causal:4, butterfly effect:5, cascade:5

**world** — Paint a picture (places, weather, senses)
crowded:1, peaceful:1, damp:1, faint:1, narrow:1, bustling:2, serene:2, cramped:2, gloomy:2,
fragrant:2, humid:2, chaotic:2, vivid:3, murky:3, pungent:3, lush:3, dilapidated:3, sweltering:3,
desolate:3, pristine:4, opulent:4, ramshackle:4, cacophony:4, idyllic:4, verdant:5, petrichor:5

**society** — Society and public life (neutral, no sides)
rights:1, citizen:1, corruption:1, protest:1, community:1, transparency:2, welfare:2,
propaganda:2, bureaucracy:2, censorship:2, dissent:2, discrimination:2, polarised:3,
marginalised:3, privilege:3, equity:3, nepotism:3, populism:3, secular:3, discourse:4,
demagogue:4, disenfranchise:4, patronage:4, impunity:4, hegemony:5, whataboutism:5
(For "secular", note the Indian meaning — equal respect for all religions — vs the Western
meaning — separation of religion and state. Keep it factual.)
