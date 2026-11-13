# Say it better — more words, clearer thinking

**Live:** https://abhijeetrayy.github.io/bricks/

A free daily practice for clearer English, made for Indian learners and anyone else. Most of us already *know*
words like "chaotic" or "ambivalent"; what we lack is the habit of reaching for them instead of "very bad" or
"mixed feelings". This builds that habit, five sentences at a time.

> Inspired by Javed Akhtar's talk *The gift of words* (paraphrased): the more words you have, the bigger the house
> you can build.

## What it does

The site is built on one idea from Javed Akhtar: **the more words you have, the bigger the house you can build.** More
words mean you think more clearly and say what you mean better. The site has three parts.

**1. Today: five sentences, about four minutes.** Each is a real sentence said the flat way, with the tired phrase
crossed out. You pick the exact word, hear the sentence, and say it out loud. There are two kinds:
- single-word sentences;
- one "upgrade the whole sentence" item, where you replace two or three tired phrases one by one.

The day ends with 30 seconds of speaking out loud, using your new words.

**2. Words: 725 words in 18 areas, grouped into four parts by what they help you do.**
- **Think clearly:** Reasoning · Certainty and doubt · Cause and effect · Change and time · Size and degree · Linking ideas
- **Express yourself:** Opinions · Agreeing and disagreeing · Being firm · Ways of speaking
- **Understand people:** Feelings · Anger and discontent · Character · Hidden meanings
- **Describe the world:** Places and senses · Work and daily life · Society and public life · Everyday verbs

Each area page lets you filter by level and shows every word as a card with its meaning and the flat phrase it
replaces. You can practise just that area. Each word page shows:
- the meaning in plain English and Hindi;
- "instead of saying…";
- two example sentences with audio;
- word partners and a note.

**3. You:** words that are yours, words you're learning, your level, and settings.

## How learning works

- A new word comes back after 1, 3, 7, 16 and 40 days (spaced repetition). Each day's five mixes new words with
  words that are due. A word becomes "yours" after you get it right on several different days.
- There are five levels: Everyday, Clear, Precise, Persuasive, Rare. Practice moves up a level when 60% of the
  current level is started. You can also choose your starting level.
- Wrong options come from the same kind of word and topic, so every choice makes you think about the exact meaning.

## Content

- **725 words.** Each has:
  - a plain meaning;
  - a Hindi hint;
  - pronunciation;
  - two Indian-setting example sentences;
  - the flat phrase it replaces;
  - collocations;
  - a note.
- **About 110 "upgrade the sentence" items**: the 120 written, minus those using removed words.
- **Speaking prompts** for the last step.

All content lives in `data/`, and the writing rules are in `data/BRIEF*.md`. The categories are defined in `js/data.js` (`PARTS`, `CATS`).

Earlier rounds also wrote phrase content: everyday phrase swaps, conversation moments and idioms. It is still in `data/` but no longer used, because
the site now focuses on words.

## Run it locally

```bash
python3 -m http.server 4341 --directory bricks
```

Check the data after editing it:

```bash
node bricks/scripts/check.mjs
```

## Files

```
index.html, css/app.css
js/app.js    everything: daily plan, the three practice kinds, Today / Find / Your words / word pages
js/data.js   groups, levels, loading (retries on weak connections)
js/store.js  progress in localStorage (no accounts, nothing sent anywhere)
js/util.js   speech, sharing, helpers
data/        all words, phrases and sentences
```

## Earlier versions

Before this rebuild the site went through three designs: a brick house, a kiln (kachcha → pakka), and a metro map.
All are in the git history. They were replaced because the site had grown too big, with 13 games, a toolkit and
maps. The one thing that matters, getting better at expressing yourself, had got buried.
