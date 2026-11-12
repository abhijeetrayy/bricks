# Say it better — five sentences a day

**Live:** https://abhijeetrayy.github.io/bricks/

A free daily practice for clearer English, made for Indian learners and anyone else. Most of us already *know*
words like "chaotic" or "ambivalent"; what we lack is the habit of reaching for them instead of "very bad" or
"mixed feelings". This builds that habit, five sentences at a time.

> Inspired by Javed Akhtar's talk *The gift of words* (paraphrased): the more words you have, the bigger the house
> you can build.

## What it does

The site has four parts: Today, Words, Phrases and You.

**1. Today: five items, about four minutes.** Every item is a real moment from Indian life, said the flat way. There
are four kinds:
- **Say it better:** a sentence with the tired phrase crossed out and a blank. You pick the exact word.
- **Upgrade the whole sentence:** two or three tired phrases in one sentence, replaced one by one.
- **Say this, not that:** a situation, plus what people usually say ("Gentle reminder!! Please revert ASAP"). You pick the better way to say it, then see why it works.
- **Say it well:** in "five more" sessions, ready phrases for conversation moments.

After each answer you see and hear the better version. The day ends with 30 seconds of speaking out loud. The
home page also has quick links to practise one thing: stand your ground, read what people mean, disagree and
debate, anger and discontent, say what you think, how you feel, work, and relationships.

**2. Words: organised by what you are trying to do when you speak.** There are 15 categories in four parts:
- **Speak up:** Say what you think · Stand your ground · Disagree and debate · Anger and discontent
- **Understand people:** Read what people really mean · Describe people fairly · Name your feelings
- **Think clearly:** Think clearly · Say how sure you are · Explain causes and change · Connect your ideas
- **Everyday life:** Work and leading · Describe things vividly · News and society · Sound natural

Each category lists its words from everyday to rare, and you can practise just that category. It aims for the plain
English you need to think clearly and say it clearly, not show-off vocabulary.

**3. Phrases: "say this, not that".** There are 300 everyday phrases across 12 scenes:
- work;
- leading a team;
- relationships;
- family;
- friends;
- social life;
- debates;
- opinions;
- online and reels;
- feelings;
- anger;
- saying no.

Each one has the situation, what people usually say, a better version (with tone and a speaker button), other good
options, and why the better version works. You can practise any scene, and there are also ready phrases for 20
conversation moments.

**4. You:** words you're learning and words that are yours, your level, and settings.

## How learning works

- A new word comes back after 1, 3, 7, 16 and 40 days (spaced repetition). Each day's five mixes new words with
  words that are due. A word becomes "yours" after you get it right on several different days.
- There are five levels: Everyday, Clear, Precise, Persuasive, Rare. Practice moves up a level when 60% of the
  current level is started. You can also choose your starting level.
- Wrong options come from the same kind of word and topic, so every choice makes you think about the exact meaning.

## Content

- 767 words. Each has:
  - a plain meaning;
  - a Hindi hint;
  - pronunciation;
  - two Indian-setting example sentences, the second used when the word comes back for revision;
  - the tired phrase it replaces;
  - collocations;
  - a note.
- 300 "say this, not that" phrases in 12 scenes (data/swaps-<scene>.json).
- 140 ready phrases for 20 conversation moments, each with three "avoid" lines.
- 15 word categories by intent (data/intents.json), each pulling in whole groups plus hand-picked words.
- 120 multi-slot "upgrade" sentences, spread across all five levels.
- 40 speaking prompts.

All the content lives in `data/`. The writing rules are in `data/BRIEF.md` to `data/BRIEF4.md`. Every entry was proofread. Some data
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
