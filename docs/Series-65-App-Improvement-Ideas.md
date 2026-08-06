# Series 65 App — Improvement Ideas (from research)

Suggested additions to the Series 65 Mastery app, grounded in the study-advice
research ([Series-65-Study-Advice.md](./Series-65-Study-Advice.md)), the free-
materials review ([Series-65-Free-Study-Materials.md](./Series-65-Free-Study-Materials.md)),
the official NASAA outline, and the app's current feature set.

_Written August 2026._

---

## First: are the "killer" high-failure topics real Series 65 topics?

The study-advice research flagged a handful of distinctions redditors say cause
the most failures. All are confirmed against the official NASAA test
specifications (effective June 12, 2023):

| "Killer" distinction | Official outline location |
|---|---|
| **Exclusion vs. exemption** | Part IV.E.1.3 "exemptions and exclusions from registration (basic concepts)"; also IV.B.2.1 "exclusions from registration" |
| **Exempt securities vs. exempt transactions** | Same IV.E.1.3 — but the outline says **"basic concepts,"** so it's lighter on the 65 than on the 63/66 |
| **State Administrator vs. SEC jurisdiction** | Part IV.A title "State-Registered and Federal Covered Advisers" + IV.A.2 notice filing + IV.F.1 "authority of state securities Administrator" + IV.E.3 "state enforcement and antifraud authority" |
| **IA / IAR / BD / Agent role rules** | Parts IV.A, IV.B, IV.C, IV.D are four separate sections defining each role |
| **Investment-adviser "ABC" definition** | Part IV.A.1 "definitions of Investment Advisers" (the "ABC test" is the prep mnemonic for that statutory definition) |
| **Suitability as application** (time horizon, risk tolerance, liquidity, taxes, objective) | Part III.B Client Profile: financial goals/objectives, tax situation, risk tolerance, time horizon; liquidity = cash flow. Part III is 30% of the exam |

**Conclusion:** all six are genuine Series 65 topics, and most are heavily
weighted — Part III (Recommendations/Suitability) + Part IV (Laws/Ethics) are
~60% of the exam. The only caveat is that exempt securities vs. transactions is
framed as "basic concepts" on the 65.

---

## What the app already has

- A full-length, blueprint-weighted **timed mock exam** (130 scored + 10 pretest,
  180-minute countdown, 92-to-pass).
- Adaptive/endless practice and **mastery drills** per topic and section.
- **Spaced repetition** plus **missed** and **flagged** queues.
- A question-scoped **AI tutor** (on-device LLM).
- A **Math section** with formulas and tagged calculation questions.
- **Exam history is already stored** (`progress.examHistory`).
- A **Watch** tab of curated Series 65 videos.

So the ideas below build on that rather than duplicate it.

---

## Suggested additions

### Tier 1 — biggest impact
1. **In-app reading content from the new textbook.** `src/data/studyNotes.ts` is
   tiny (~43 lines), while a 94k-word, outline-aligned textbook now lives in
   `docs/Series-65-Textbook.md`. Surface each section as readable "Learn" content
   per topic — the community's #1 workflow is *read for concepts, then drill*.
2. **A real readiness signal.** The app stores `examHistory` and has the timed
   mock — add a **mock-score trend** plus an explicit gate: *"You're ready when
   you're consistently ≥80% across full-length mocks"* (the single most-cited
   readiness rule), and nudge users to take **≥3** full-length mocks.
3. **"Killer distinction" drills** for the six confusables above — compare-and-
   contrast cards + quick quizzes on exclusion-vs-exemption, jurisdiction,
   IA/IAR-vs-BD/Agent, the ABC test, and suitability-factor extraction. These are
   the highest-failure, high-weight areas.

### Tier 2
4. **Flashcards** — auto-create one from every missed question ("turn every miss
   into a flashcard") plus a formula/definition deck, run through the existing
   spaced-repetition engine.
5. **Formula cheat sheet + brain-dump screen** — the popular "dump sheet":
   current yield, tax-equivalent yield, total/holding-period return, Rule of 72,
   CAPM, Sharpe, ratios. The math data already exists.
6. **Study plan / exam-date countdown** — set a test date → a daily plan weighted
   by exam % × mastery gaps (over-invest Law/Ethics + Suitability). Builds on the
   existing streak.

### Tier 3 — quick wins
7. **Test-day strategy card** — read the last line, watch *except/not*, "best
   answer" not "a correct answer," don't change answers, flag & return, and the
   test-center calculator is a basic 4-function.
8. **Free-resources card** — link the two genuinely-free 130-question practice
   exams (Achievable, Ken Finnen / series7exam.org) + the PassMasters PDF from
   the vendor review.
9. **Question polish** — ensure explanations state *why each wrong choice is
   wrong*, and seed some "which is NOT/EXCEPT" items (nudge the AI generator +
   audit the bank).

---

## Recommended starting point

Highest value-to-effort: **#1 (in-app textbook), #2 (readiness signal), and
#3 (killer-distinction drills)** — each maps directly to the strongest research
findings and reuses content/systems the app already has.
