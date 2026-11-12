# Bricks — round 2 brief: content that improves how people SPEAK and EXPRESS

Read BRIEF.md first (audience, tone, Indian settings, British spelling, neutrality, the word-entry format).
Round 2 adds what single words cannot give: ready phrases for real situations, phrasal verbs and idioms that
make speech natural, practice turning flat sentences into precise ones, natural word partners, and speaking prompts.

Why (research): fluent speakers rely on ready-made chunks — phrases and fixed expressions — far more than on
single words (Lewis, *The Lexical Approach*; Nattinger & DeCarrico; Wray, *Formulaic Language*). Speaking practice
itself builds fluency (Swain's output hypothesis). Collocations are what make English sound natural.

Everything must be: high-use in real modern English (meetings, news, conversation), never archaic or show-off;
set in Indian life; respectful of Indian English (a real variety) while showing what is globally clear.

---

## A. Two new word rooms (same entry format as BRIEF.md)

Files: `words-phrasal.json` (room "phrasal") and `words-idioms.json` (room "idioms").
The example sentence must contain the item exactly as written in "w" (a game blanks it).
For phrasal verbs use the base form in the example ("we need to figure out", "she will turn down").
For idioms: "note" must say the register (casual / fine at work / formal writing) and any cliché warning.
"mean" is the plain meaning, not a definition of each word.

**phrasal** — Phrasal verbs that sound natural (spoken English runs on these)
find out:1, give up:1, look into:1, point out:1, bring up:1, carry on:1, come across:2, figure out:2,
put off:2, turn down:2, rule out:2, back up:2, sort out:2, set up:2, come up with:3, follow through:3,
play down:3, brush off:3, live up to:3, fall through:3, catch on:3, gloss over:4, iron out:4, weigh in:4,
mull over:4, double down:5, pan out:5

**idioms** — Expressions that paint a picture
on the same page:1, break the ice:1, in hot water:1, once in a blue moon:1, get the hang of:1,
the bottom line:2, on the fence:2, food for thought:2, a grey area:2, the tip of the iceberg:2,
back to square one:2, cut corners:2, the elephant in the room:3, a double-edged sword:3,
devil's advocate:3, move the goalposts:3, bite the bullet:3, a blessing in disguise:3,
read between the lines:3, a red herring:4, the lion's share:4, a catch-22:4, rest on your laurels:4,
a pyrrhic victory:4, Hobson's choice:5, Occam's razor:5

## B. `phrases.json` — "Say it well": phrases for real situations

JSON array of 20 situations, in this order and with these ids:
opinion (Give your opinion), agree (Agree and add something), disagree (Disagree without offending),
concede (Accept a point, then add yours), unsure (Say you are not sure), ask (Ask what someone means),
explain (Explain what you meant), time (Buy time to think), interrupt (Interrupt politely),
refocus (Bring the talk back on track), structure (Organise your point), example (Give an example),
summarise (Sum up), feedback (Give feedback kindly and clearly), no (Say no politely), request (Ask for something),
sorry (Apologise properly), wrong (Admit you were wrong), persuade (Recommend and persuade), close (End a meeting or conversation)

```json
{
  "id": "disagree",
  "title": "Disagree without offending",
  "when": "One plain sentence on when you need this.",
  "phrases": [
    { "p": "I see it a little differently.", "tone": "neutral", "ex": "I see it a little differently — I think the delay came from the vendor, not our team." }
  ],
  "avoid": [
    { "p": "You are wrong.", "why": "Attacks the person, so they defend instead of listening.", "better": "I'm not sure that's right — here's why." }
  ]
}
```
- 7 phrases per situation, with a mix of tones ("casual" = friends, WhatsApp; "neutral" = most work talk;
  "formal" = presentations, formal email). Each "ex" is one natural line, ≤ 25 words, Indian setting.
- 3 "avoid" items per situation: realistic things people actually say that work badly — blunt or rude versions,
  over-formal Indian-office English ("Kindly do the needful", "I humbly request you to…"), fillers ("Basically,
  actually…"), or Indian-English forms that confuse elsewhere. "why" ≤ 20 words, kind, not mocking.
  An avoid item must be clearly worse than every phrase in the same situation (a game asks "which sounds best?").
- No phrase may appear twice in the whole file.

## C. `upgrades.json` — "Upgrade the sentence"

30 flat sentences. Each has 2 or 3 tired phrases to replace. The right word MUST be a headword that exists in
one of the `words-*.json` files in this folder (read them; include words-phrasal / words-idioms only if those
files exist when you start). Distractors are other real headwords from those files that would be wrong here
(wrong meaning or wrong register) — not nonsense.
```json
{
  "parts": [
    "The traffic near Silk Board was ",
    { "tired": "very bad", "pick": "chaotic", "options": ["chaotic", "meagre", "serene"], "why": "Chaotic says what kind of bad: disorder." },
    " and I was ",
    { "tired": "very angry", "pick": "livid", "options": ["livid", "content", "candid"], "why": "…" },
    " by the time I reached."
  ]
}
```
- Joining the strings and the "pick" values must give a natural sentence (check grammar: a/an, verb forms).
  If a pick needs a different form (e.g. past tense), choose another sentence instead — the pick must fit as is.
- "options" has exactly 3 items including "pick"; "why" ≤ 18 words.
- Vary settings and rooms (work email, a family argument, a cricket match, an exam, a news report, a review).
- "livid" above is only an example of a ladder word; use headwords from the words files.

## D. `partners.json` — "Natural partners" (collocations)

40 items. Each tests one fixed partnership that Indian learners often get wrong or never use.
```json
{ "s": "I ___ a silly mistake in the report.", "a": "made", "wrong": ["did", "gave"], "pair": "make a mistake",
  "note": "We make mistakes, but we do homework." }
```
- Exactly one option is correct in standard English; never include a "wrong" option that is also acceptable in
  British or Indian English (e.g. do NOT test take/make a decision — both are fine).
- Cover: make/do/take/give/have/pay/keep/catch/raise/draw/reach/meet/run/hold verbs; adjective partners
  (heavy rain, strong coffee, high fever, deeply sorry, bitterly disappointed, highly unlikely, fully aware,
  strongly disagree, a narrow escape, a vague idea, a slight chance, crystal clear, a broad smile, a sharp rise);
  and Indian-English traps (switch on the light, not "open the light"; take/sit an exam, not "give an exam" —
  if you include these, the note must say the Indian form is common in India but confuses others).
- "note" ≤ 20 words.

## E. `talk.json` — "Speak for a minute"

40 speaking prompts. The site will pick three words for the speaker to use from the listed rooms.
```json
{ "t": "Describe your street on the first day of the monsoon.", "ask": ["What do you see and smell?", "How do people change?", "How do you feel?"], "rooms": ["world", "feel"] }
```
- Mix: describing (places, people), explaining (how something works, a process at work), opinions on everyday
  debates (balanced, never party politics, never religion-versus-religion), stories from life, leadership
  situations (giving bad news to a team, convincing a manager), and reflection.
- "rooms" lists 2–3 of: think, argue, doubt, feel, people, talk, lead, everyday, link, change, amount, cause,
  world, society, phrasal, idioms.
- Each prompt ≤ 14 words; each "ask" item ≤ 9 words; 2–3 asks.
