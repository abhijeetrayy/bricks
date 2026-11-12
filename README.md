# Bricks — English words to build your thoughts

**Live:** https://abhijeetrayy.github.io/bricks/

A free site for Indian learners, and anyone else, who want to think, speak and argue more clearly in English.
It is not a dictionary: 415 hand-picked words and 140 phrases, arranged by what you want to say, with practice
that makes them stick.

> The idea comes from Javed Akhtar's TED talk *The gift of words* (paraphrased): words are like bricks;
> with fewer bricks you can only build a small house.

## Run it locally

No build step. Any static server works:

```bash
python3 -m http.server 4341 --directory bricks
```

Check the data after editing it:

```bash
node bricks/scripts/check.mjs
```

## What is in it

**Kachcha → pakka.** Every word is a brick. It starts as a *kachchi eent*, raw clay. When you start learning it,
it goes into the *bhatta* (kiln) and glows orange. Answer it right over a few days and it comes out *pakka*: fired red.
"Pakka" already means "solid, sure" in everyday Indian speech.

**The house (home page).** An elevation drawing of a building, one brick per word. A new visitor sees a whole
clay house. It turns red as words become pakka. Floors are levels, from Ground (seen but not used) to Terrace
(rare but powerful). "Find your floor" is a 26-word yes/no test with 6 made-up words, so over-claiming lowers the
score.

**Words: 16 rooms, grouped by purpose, never A to Z.**
Think clearly · Agree and disagree · Sure or not sure · Feelings, precisely · People and character ·
Ways of saying · Phrasal verbs · Expressions · Lead and work · Everyday upgrades · Joining words ·
Change and time · How much · Cause and effect · Paint a picture · Society and public life.

Each word has:
- a plain meaning;
- a Hindi hint, which you can turn off;
- a pronunciation respelling plus a speaker button;
- an example from Indian life;
- "use it instead of" (the tired phrase it replaces);
- natural word partners;
- a note on common traps;
- a box to write your own sentence.

**Say it better (search).** Type the word you overuse ("very good", "said", "angry"). You get exact
replacements, the strength ladder, and phrases for the situation.

**Phrases: 20 real situations, 140 phrases.** Each phrase is tagged casual, neutral or formal and comes with an
example. Each situation also lists what to avoid and why. The situations include:
- disagreeing without offending;
- buying time to think;
- saying no politely;
- giving feedback;
- admitting you were wrong;
- ending a meeting.

**Practise:**
- **Revise:** words due today, at 1, 3, 7, 16 and 40 days.
- **Speak for a minute:** a topic, three words to use, and a 60-second clock.
- **Upgrade the sentence:** replace the tired phrases in a flat sentence one by one, then read it aloud.
- **Which sounds best?:** pick the phrase that works in a real moment.
- **Fill the gap**, **One better word**, **Word or meaning** and **Brick rush:** these can be limited to one room or your floor.
- **Natural partners:** make or do a mistake? heavy or strong rain?
- **Build the ladder** and **Which is stronger?:** words of exactly the right strength.
- **Mix-ups** and **Root hunt.**

**Toolkit:**
- Shades of strength: 16 ladders.
- Natural partners: 40.
- Roots: 24, many with genuine Sanskrit or Hindi relatives (nov–nav, mater–mata).
- Mix-ups: 26.
- Indian English → global English: 28 notes, framed with respect, since Indian English is a real variety.
- Say it right: 30.

## Why it is built this way

| Choice | Based on |
|---|---|
| Mostly "Tier 2" words | Beck, McKeown & Kucan, *Bringing Words to Life* |
| Phrases as whole chunks | Lewis, *The Lexical Approach*; Wray, *Formulaic Language* |
| Speaking practice | Swain's output hypothesis |
| Spaced revision | Ebbinghaus's forgetting curve; Leitner boxes |
| Every practice is recall, not re-reading | The testing effect (Roediger & Karpicke 2006) |
| Feelings room | Emotional granularity (Lisa Feldman Barrett) |
| Natural partners | Collocation research: natural English is about which words go together |

## Design

**One idea runs through the whole site:** words are bricks.
- **Today's five words** are a small stack of clay bricks. Tap one and it flips to show the meaning.
- **Rooms** are a wall of wide bricks laid in running bond. Each one fills with orange and red as you learn its words.
- **On a word page,** the word itself is a big brick, pressed into the face like a kiln stamp. Its colour shows where you are with it.

**Colour:**
- Clay #E2CBA2 for words you haven't learned.
- Kiln orange #EBA25A for words you're learning.
- Fired red #B2512E for words you know.
- A cool lime-wash page, ink text and neel-blue links.
- A faint grain gives the bricks the feel of real clay.

Pages are otherwise flat, with no pills and no tracked-capital labels.

| Role | Typeface |
|---|---|
| Words and headings | Spectral |
| Reading text | Atkinson Hyperlegible |
| Counts | Big Shoulders Display |
| Hindi | Tiro Devanagari Hindi |

Every link is visible, and phones get a bottom tab bar.

## Files

```
index.html, css/bricks.css
js/main.js    pages and routing (hash routes: #/word/nuance, #/phrases/disagree, #/play/upgrade …)
js/house.js   the house elevation (SVG, running bond, one brick per word)
js/quiz.js    question builders, quiz runner, ladder and upgrade games
js/store.js   progress in localStorage (no accounts, nothing sent anywhere)
js/data.js    rooms, floors, loading (with retries for weak connections)
js/util.js    speech, sharing (Web Share / WhatsApp link), helpers
data/BRIEF.md, BRIEF2.md   the word lists and writing rules for every entry
data/words-<room>.json, phrases.json, upgrades.json, partners.json, talk.json,
     ladders.json, roots.json, mixups.json, indian.json, say.json
scripts/check.mjs          data checker
```

## Still open

- Progress lives on one device. Settings has a copy/paste way to move it. Friend leagues would need accounts and a server.
- All entries were written and then proofread for accuracy, including the Hindi, but a fluent human proofread before a wide launch would still help.
- "Bricks" is a working title.
