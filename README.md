# Wordline — English words for clear thinking

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

**Every topic is a metro line, every word a station.** The home page shows a network map. Each of the 16 lines is one
job you need words for, like thinking, disagreeing or describing feelings. The stretch you have travelled shows in
full colour. Levels are zones, from zone 1 (everyday) to zone 5 (rare).

Each page plays a part in the metaphor:
- **Today's five words** are a route, shown like the strip map above a metro door.
- **A line page** has a full strip map with tilted station names, plus the station list drawn as a rail.
- **A word page** is a station signboard, with previous and next stations.
- **"Find your zone"** is a 26-word yes/no test that includes 6 made-up words, so claiming words you don't know lowers your score.

**Words: 16 lines, grouped by purpose, never A to Z.**
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
- **Fill the gap**, **One better word**, **Word or meaning** and **Rush hour:** these can be limited to one line or your zone.
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

Wordline is built like metro signage. It uses a white background, ink, and one typeface (Hanken Grotesk) for clarity, with Tiro Devanagari Hindi for the Hindi hints.

| Element | Meaning |
|---|---|
| Line colour | Which topic a word belongs to |
| Filled station | A word you know |
| Signal-yellow station | A word you are learning |
| Hollow station | A word not visited yet |
| Dark panel with signal yellow | "Where you are now": today's route and the station signboard |

There are no decorative cards or pills. Every link is visible, and phones get a bottom tab bar. On phones the network map scrolls sideways at a readable size, like a real metro map.

## Files

```
index.html, css/metro.css
js/main.js    pages and routing (hash routes: #/word/nuance, #/phrases/disagree, #/play/upgrade …)
js/map.js     metro drawings: network map, line minis, strip maps, the rail, the learn minimap
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
- The repository and web address still say "bricks" (the first name). Renaming the repo would change the URL.
