# Bricks — English words to build your thoughts

A vocabulary website for Indian learners, and anyone else who wants to say what they think more clearly.
It is not a dictionary. It is 362 hand-picked words, arranged so you can actually use them.

> The idea comes from Javed Akhtar's TED talk *The gift of words* (paraphrased): words are like bricks;
> with fewer bricks you can only build a small house.

## Run it

No build step. Any static server works:

```bash
python3 -m http.server 4341 --directory bricks
```

Then open http://127.0.0.1:4341. (In the Claude app, the launch entry is called `bricks`.)
Check the data after editing it:

```bash
node bricks/scripts/check.mjs
```

## How the words are arranged, and why

**The house.** Every word is a brick. When you know a word, its brick is laid in your house on the home page.
The house is the progress bar: you can see which floors you have built and where the gaps are.

**Rooms = what you want to say** (never A to Z). There are 14 rooms:
Think clearly · Agree and disagree · Sure or not sure · Feelings, precisely · People and character · Ways of saying ·
Lead and work · Everyday upgrades · Joining words · Change and time · How much · Cause and effect · Paint a picture ·
Society and public life.
You look for a word when you want to say something, so words sit next to the words they compete with
(jealous / envious, refute / rebut). Choosing between them is what precision means.

**Floors = levels.** Ground floor (seen but not used) → First (clear) → Second (precise) → Third (persuasive) → Terrace (rare but powerful).
"Find your floor" is a 26-word yes/no test with 6 made-up words in it. Saying yes to a fake word lowers your score.
This is a standard way to keep self-rating honest (yes/no vocabulary tests, after Meara).

**Which words.** Mostly "Tier 2" words (Beck, McKeown & Kucan): the words mature speakers use across every subject.
They give the biggest gain in reading, thinking and arguing. There are no GRE show-off words. Every word must be one
you would meet in a good newspaper, a podcast or a meeting.

**Each word card has:**
- a plain meaning, simpler than the word itself;
- a Hindi hint (can be turned off);
- a pronunciation respelling plus the device's own voice;
- one example sentence set in Indian life;
- "use it instead of" (the tired phrase it replaces);
- "words that go with it" (collocations);
- a note on common traps;
- a box to write your own sentence.

## What makes it stick

| Feature | Based on |
|---|---|
| Revise after 1, 3, 7, 16, 40 days (Leitner boxes) | Spaced repetition, Ebbinghaus's forgetting curve |
| Every game makes you recall, not just re-read | Retrieval practice / the testing effect (Roediger & Karpicke 2006) |
| A brick is laid only after a right answer, not just a "yes" | Recognising a word is not the same as knowing it |
| Write your own sentence | Generative use moves a word from "seen it" to "use it" |
| Feelings room | Emotional granularity (Lisa Feldman Barrett) |
| Roots with Hindi/Sanskrit echoes (nov–nav, mater–mata, dent–dant) | Morphology; English and Hindi are Indo-European cousins |

## Games

- **Fill the gap**: a real sentence with one word missing.
- **One better word**: swap a tired phrase like "very small" for one exact word.
- **Brick rush**: 60 seconds of matching words and meanings.
- **Build the ladder**: put five words in order from mildest to most extreme.
- **Which is stronger?**: pick the stronger of two words. Only words at least two steps apart are compared.
- **Mix-ups**: affect or effect, lose or loose, and so on.
- **Root hunt**: find the word that grows from a given root.
- **Word or meaning**: see a word and pick its meaning, or the other way round.

A game moves a word up only when the word is new or due for revision, so spamming a game cannot lay bricks.

## Toolkit

- Shades of strength: 16 ladders.
- Brick makers: 24 roots, 13 of them with genuine Sanskrit/Hindi relatives.
- 26 mix-ups.
- Indian English → global English: 28 notes. These are framed with respect: Indian English is a real variety, and the notes are for exams, formal writing and talking with people outside India.
- Say it right: 30 words.

## Files

```
index.html, css/style.css
js/app.js      pages and routing (hash routes: #/room/think, #/word/nuance, #/play/gap/feel …)
js/games.js    question builders, quiz runner, ladder game
js/store.js    progress in localStorage (no accounts, nothing sent anywhere)
js/data.js     rooms, floors, loading
js/util.js     speech, sharing (Web Share / WhatsApp link), helpers
data/BRIEF.md  the word list and the writing rules for every entry
data/words-<room>.json, ladders.json, roots.json, mixups.json, indian.json, say.json
scripts/check.mjs  data checker
```

## Not done yet

- Not deployed. It is a static site, so GitHub Pages or Netlify would work as-is.
- Progress lives on one device. Settings has a copy/paste way to move it. Shared progress or friend leagues would need accounts and a server.
- The Hindi hints and example sentences were written carefully, but a fluent human should proofread them before a wide launch.
- Name: "Bricks" is a working title.
