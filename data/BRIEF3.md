# Round 3 brief: more words, more sentences

Read BRIEF.md first: it has the entry format, the field rules, Indian settings, British spelling, and the
neutrality and safety rules. Everything there still applies.

The site is now "Say it better", a daily practice. Each item shows a real sentence with the tired phrase struck
through, for example ~~sad and alone~~, then a blank, and the learner picks the exact word. So for every entry:
- **"instead"** matters most. It is the flat phrase people actually say. Fill it for nearly every word.
- **"ex"** must read naturally, contain the headword exactly, and make the meaning guessable.

## Job A: add new words to your rooms

Add exactly 16 new entries to each room you own, appended at the end of its words-<room>.json file.
- **Spread across levels:** 3 at floor 1, 4 at floor 2, 4 at floor 3, 3 at floor 4, 2 at floor 5.
- **Choose words that improve expression:** high-use words that educated speakers really say in meetings, news,
  arguments and daily life. Avoid show-off, archaic or GRE-only words. Prefer words that replace a common vague
  phrase.
- **No duplicates.** A new headword must not already exist in ANY data/words-*.json file. Check all 16 files
  before adding, and check again just before you finish, because other writers are adding words at the same time.
  If your word now appears elsewhere, swap yours for another.
- **Stay on topic:** each word must clearly belong to that room's topic (see the room list in BRIEF.md).

## Job B: a second example sentence for every word

Add a field **"ex2"** to EVERY entry in your files, both the old ones and your new ones.
- ex2 follows the same rules as ex: one natural sentence, at most about 22 words, Indian setting, containing the headword exactly as written in "w".
- Use a clearly different situation from ex. For example, if ex is about an office, set ex2 at home, in a market, in sport or in the news.
- ex2 is shown when the word comes back for revision, so the learner meets the word in a new context.

Do not change any existing field except to fix a clear error.

## Job C: upgrades (only the writer told to do this)

Append 90 new items to data/upgrades.json, so it has 120 in total. Use the format in BRIEF2.md section C:
- 2–3 slots per sentence;
- each "pick" and each option must be an existing headword in the words files;
- the completed sentence must be grammatical, with the pick slotted in unchanged;
- "why" is at most 18 words;
- settings and topics should vary widely.

Spread the picks across all five floors. Aim for about 25 sentences whose picks are mostly floors 1–2, 30 mostly
floor 3, and 35 mostly floors 4–5, so every level has fresh sentences. Do not reuse a sentence idea that is already
in the file.

## Check before you finish

Run `node /Users/abhijeetray/Development/Personal-2/sometging/bricks/scripts/check.mjs`. Fix every problem it
reports in YOUR files. Ignore problems in files you do not own.
