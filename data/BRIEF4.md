# Round 4 brief: categories by intent, and "say this, not that" phrases

The user's aim is plain: the English you need to **think clearly and convey it clearly**. That means being firm,
understanding people, sharing your thoughts, and handling anger, discontent, disagreement and debate. Keep it
nuanced but simple. This is NOT Shashi Tharoor-level English: no showy or rare words unless they are truly useful.
Everything is for Indian learners, set in Indian life, respectful and neutral on politics and religion.

Read BRIEF.md for the word-entry format and rules. Every new entry must also have "ex2" (BRIEF3.md, Job B).

## A. New word rooms

Each new room is a new file containing 24 entries in the BRIEF.md format, plus ex2.
- **Floor spread:** 5 at floor 1, 6 at floor 2, 6 at floor 3, 5 at floor 4, 2 at floor 5.
- **No duplicates:** a headword must not already exist in ANY data/words-*.json. Check at the start and again at the end, because other writers are adding words at the same time.
- **"instead":** fill it for every entry. It is the flat phrase people actually say.
- **Phrases are allowed** when that is how people really talk, for example "push back", "hold your ground" or "read the room".

The four rooms:
- **firm** (words-firm.json), "Stand your ground": words to be firm and confident without being rude. Holding a position, setting limits, saying no, not backing down, owning a decision, quiet authority. For example firm, non-negotiable, boundary, push back, hold your ground, unwavering, resolute, back down, put your foot down, assertive (only if not already used). Choose your own.
- **read** (words-read.json), "Read what people really mean": words for understanding people and spotting what is left unsaid. Hints, sarcasm, spin, motives, tone, deflection, flattery, manipulation, empathy, listening. For example subtext, sarcastic, passive-aggressive, ulterior motive, deflect, read the room, backhanded compliment, gaslight (careful and accurate), loaded question, defensive, empathise, tone.
- **upset** (words-upset.json), "Anger and discontent": words to say exactly how unhappy you are, from mild to strong, and to complain or object well. For example annoyed, irritated, fed up, disgruntled, aggrieved, appalled, outraged, unacceptable, let down, bitter, vent, lose your temper, simmer, seethe, complaint, object to. Do NOT reuse words already in words-feel.json.
- **opinion** (words-opinion.json), "Say what you think": words and phrases for giving your view and making it land. Stating a view, giving reasons, examples, balance, emphasis, honesty, conviction. For example in my view, from where I stand, to be honest, point of view, take (as in "my take"), conviction, standpoint, frankly, the crux, food for thought (only if not already used), weigh up, hold a view, bluntly, a fair point.

## B. Fill "words" in intents.json (one writer only)

data/intents.json lists 15 categories. Each pulls in whole rooms through its "rooms" field. For these five
categories, also fill the "words" array with EXISTING headwords from OTHER rooms that clearly serve that intent:
opinion, firm, disagree, upset, read.
- Use 10–30 words each. A word may appear in more than one category.
- Use the exact "w" strings, ordered from easiest to hardest.
- Only include strong fits. For example:
  - firm: assertive, insist, decisive, stubborn, tenacious, stand up for, refuse-type words;
  - upset: frustrated, exasperated, indignant, resentful, the last straw, put up with, grievance;
  - read: imply, infer, insinuate, hint, allude, euphemism, read between the lines, condescending, sycophant, ostensibly, disingenuous, gloss over, play down, brush off;
  - disagree: words from other rooms like dubious, sceptical, devil's advocate, whataboutism;
  - opinion: articulate, clarify, elaborate, emphasise, perspective, stance, arguably, concise, coherent.
- Do not change anything else in the file.

## C. "Say this, not that": phrases.swaps (phrase writers)

These go in a new file, data/swaps-<scene>.json, one file per scene. Each file is a JSON array of exactly 25 items:

```json
{
  "situation": "You need two more days for a report your boss expects today.",
  "say": "Sorry sir, I couldn't complete it. I'll try my best.",
  "better": "I need two more days to get this right. Can I send it on Thursday?",
  "also": ["I'll share a draft today and the final version on Thursday."],
  "weak": ["Very sorry, it's almost done, small small things are pending.", "It will be done soon, don't worry."],
  "why": "Gives a clear new date and owns the delay instead of a vague promise.",
  "tone": "neutral"
}
```

- **situation:** one short line of context, at most 18 words.
- **say:** what people in India really say, the common weak, vague, rude, over-formal or awkward version, at most 18 words. These are real habits, including Indian-English office habits, fillers, overused slang and passive-aggression. Use them without mocking anyone.
- **better:** a clearly better way to say it, natural and modern, at most 25 words. Not over-polished, not Tharoor-level. Simple, clear, confident.
- **also:** 1–2 more good alternatives.
- **weak:** exactly 2 other realistic but worse ways to say it. These are wrong options in a quiz, so each must be clearly worse than "better".
- **why:** at most 18 words. The principle behind the fix (for example clarity, owning it, "I" not "you", specific not vague, firm not rude).
- **tone:** casual, neutral or formal.
- Vary the situations widely within the scene. No item may repeat another, in your files or the existing ones.

The 12 scenes, with their ids and titles:
- work: Work and office
- lead: Leading a team
- love: Relationships and partners
- family: Family
- friends: Friends
- social: Social life and small talk
- debate: Debates and arguments
- opinion: Sharing your opinion
- online: Online, reels and posts (hooks, captions, comments, replying to trolls, collaborations)
- feelings: Saying how you feel
- upset: When you are angry or unhappy (complaints, fights, discontent)
- firm: Saying no and setting limits

## Check before you finish

Every writer runs `node /Users/abhijeetray/Development/Personal-2/sometging/bricks/scripts/check.mjs` and fixes
problems in their own files. The checker may not know the new files yet; that is fine.
