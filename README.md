# Say it better — five sentences a day

**Live:** https://abhijeetrayy.github.io/bricks/

A free daily practice for clearer English, made for Indian learners and anyone else. Most of us already *know*
words like "chaotic" or "ambivalent"; what we lack is the habit of reaching for them instead of "very bad" or
"mixed feelings". This builds that habit, five sentences at a time.

> Inspired by Javed Akhtar's talk *The gift of words* (paraphrased): the more words you have, the bigger the house
> you can build.

## What it does

The site has three parts and nothing else.

**1. Today: five sentences, about four minutes.** Each item is a real sentence from Indian life, said the flat way.
There are three kinds:
- **Say it better:** a sentence with the tired phrase crossed out (~~sad and alone~~) and a blank. You pick the exact word from three that would all fit grammatically.
- **Upgrade the whole sentence:** two or three tired phrases in one sentence, replaced one by one.
- **Say it well:** a real moment, like bringing a meeting back on track or saying no politely. You pick what to say, then see why the other two land badly and three more good options.

After each answer you see the better sentence, hear it, and get the meaning in plain English and Hindi. The day
ends with 30 seconds of speaking out loud, using your new words.

**2. Find.** Type the word you overuse ("very good", "said", "angry") and get the exact one, or browse words by what
you want to say. Also lists 20 everyday moments, like disagreeing or ending a meeting, with phrases to use and what to avoid.

**3. Your words.** The words you're learning and the words that are yours, your level, and settings.

## How learning works

- A new word comes back after 1, 3, 7, 16 and 40 days (spaced repetition). Each day's five mixes new words with
  words that are due. A word becomes "yours" after you get it right on several different days.
- There are five levels: Everyday, Clear, Precise, Persuasive, Rare. Practice moves up a level when 60% of the
  current level is started. You can also choose your starting level.
- Wrong options come from the same kind of word and topic, so every choice makes you think about the exact meaning.

## Content

- 415 words in 16 groups. Each has:
  - a plain meaning;
  - a Hindi hint;
  - pronunciation;
  - an Indian-setting example;
  - the tired phrase it replaces;
  - collocations;
  - a note.
- 140 phrases for 20 situations, each with three "avoid" lines.
- 30 multi-slot "upgrade" sentences.
- 40 speaking prompts.

All the content lives in `data/`. The writing rules are in `data/BRIEF.md` and `data/BRIEF2.md`. Every entry was proofread. Some data
(ladders, roots, mix-ups, partners, Indian-English notes) is kept for future use; only the ladders appear today, in search.

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
