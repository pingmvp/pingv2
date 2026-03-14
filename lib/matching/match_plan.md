# Matching Algorithm — Research & Improvement Plan

## Current Algorithm Assessment

What we have is essentially **OkCupid's v1** — content-based filtering with weighted similarity. It's a solid starting point but has three concrete problems at event scale:

### Problem 1: The superstar problem
If one attendee scores highly against everyone (e.g., a well-known investor), they appear in *every* founder's top-3. They literally can't have 80 conversations at a 2-hour event. The current algo has no capacity constraint — match lists are generated independently per person with no awareness of overall load.

### Problem 2: Rank assignment is broken
The current `rankForA` / `rankForB` logic in `engine.ts` assigns ranks *before* deduplication. When a match is first seen from A's side, B's rank gets stored as `999` if B didn't have A in their top-K. This means the rank displayed to attendees doesn't reflect mutual interest — it just reflects who iterated first in the loop.

### Problem 3: Single-choice similarity is binary (0 or 1)
`singleChoiceSimilarity` returns 0 if answers differ, regardless of how different. For a question like "What stage is your startup?" with options Idea / Pre-seed / Seed / Series A+, "Idea" vs "Pre-seed" is treated identically to "Idea" vs "Series A+". That's a lot of signal being thrown away.

---

## Research Summary

### Gale-Shapley (Stable Matching / Deferred Acceptance)

Gale-Shapley (1962) solves the "stable marriage problem": given N proposers and N receivers with ranked preference lists, find a matching where no two unmatched individuals would both prefer each other over their current partners (no "blocking pair").

**Algorithm (applicant-proposing):**
1. All applicants propose to their top choice.
2. Each receiver holds the best proposal, rejects the rest.
3. Rejected proposers propose to their next choice.
4. Repeat until stable.

O(n²) time. Always terminates with a stable matching.

**Real-world use:** NRMP (40,000 medical residents matched annually), NYC/Boston school admissions. Roth & Shapley won the 2012 Nobel Economics Prize. **Hinge** adopted GS for its "Most Compatible" daily suggestion.

**Properties:**
- Proposer-optimal (proposing side gets best stable match)
- Receiver-pessimal (receiving side gets worst stable match)
- Strategy-proof for proposers only

**Limitations for Ping:** Base GS is 1:1 only. For 3-5 matches per person, need many-to-many generalization (min-cost flow with capacities). GS optimizes for stability, not global score maximization.

---

### Dating App Algorithms

**Tinder — ELO-based desirability ranking:**
- Right-swipes from high-ELO users raise your ELO more than low-ELO swipes.
- Profiles shown to users with similar ELO scores ("ELO neighborhoods").
- Moved away from pure ELO ~2019 due to superstar concentration: top 10% of profiles received 58% of likes.
- New system incorporates: proximity, recent activity, interest signals, selectivity.

**Key problem:** Feedback loops make rich richer. Top profiles get shown more → get more swipes → get even higher ELO. Majority of users barely get shown.

**Hinge — Stable Matching + Engagement Prediction:**
- Computes a "Hinge Score": predicted engagement based on past behavior (who you liked, who liked you, conversation depth, dates set).
- Uses scores to generate synthetic preference rankings.
- Runs GS variant to find stable matches.
- Surfaces one "Most Compatible" suggestion per day.
- Optimizes for deleting the app (actual dates), not in-app engagement.

**OkCupid — Explicit Question Weighting:**
- Users answer questions, mark acceptable partner answers, and rate importance (Irrelevant / A little / Somewhat / Very / Mandatory → weights 0, 1, 10, 50, 250).
- Compatibility = weighted % of partner's answers that fall in your acceptable set.
- Final score = geometric mean of both directional scores (prevents gaming — you can't inflate score if they don't reciprocate).
- 2014 experiment: users told they were 90% compatible (actually 30%) messaged more and had longer conversations. Match scores are partly self-fulfilling prophecies.

---

### Speed Dating & Event Matching Research

**Fisman et al. (2006) — Columbia speed dating dataset:**
- Stated preferences are **poor predictors** of actual choices. People say they want intelligence/ambition; at the event, both genders primarily selected for physical attractiveness.
- Similarity in intelligence predicted mutual selection more than absolute intelligence level.
- Gap between stated and revealed preferences: ~40–60% of variance unexplained.

**Eastwick & Finkel (2008):**
- Individual idiosyncratic preferences account for more variance in attraction than shared demographic similarity.
- "Beauty is in the eye of the beholder" — person-specific compatibility factors matter more than population-level patterns.

**Implication for Ping:** Self-reported questionnaire answers may not predict actual event compatibility well. Post-event feedback is the most reliable signal. Even a perfect algorithm captures only a fraction of actual compatibility.

**Conference networking tools:**
- **ConfLink:** TF-IDF vectors from publication abstracts + cosine similarity between attendees. Filters by "I want to meet people who could help with X."
- **Braindate (C2 Montreal):** Matches on what someone wants to *do*, not who they *are* — topic-based matching. People post "I want to explore X" and are matched with others proposing complementary/overlapping topics.
- **Key insight:** Matching on *intent* ("what I want from this event") rather than just *identity* ("who I am") is underexplored and potentially more predictive for professional networking.

---

### Similarity vs. Complementarity

**Research consensus:** "Birds of a feather" is strongly supported; "opposites attract" is largely a myth for most traits.

- **Byrne's Similarity-Attraction Law (1971):** Attitude similarity predicts liking across many contexts.
- **Watson et al. (2004):** Strong assortative mating on education, religion, and personality.
- **Tidwell, Eastwick & Finkel (2013):** Speed dating found no support for complementarity in personality matching predicting attraction.
- Complementarity helps in specific skill pairs (founder ↔ investor, engineer ↔ designer) — structural role complementarity, not personality complementarity.

**For Ping:** Two-sided mode handles structural complementarity (investors only match with founders). Within each constraint, similarity on values/goals/stage is the best signal.

No dating app has demonstrated a reliable complementarity model that outperforms similarity matching at scale. OkCupid, Hinge, eHarmony — all similarity-based.

---

### Hungarian Algorithm & Bipartite Matching

The Hungarian algorithm (Kuhn-Munkres, 1955) solves the **linear assignment problem**: given an n×n score matrix, find a perfect matching that **maximizes total score**.

| Dimension | Hungarian | Gale-Shapley |
|---|---|---|
| Objective | Maximize global total score | Stability (no blocking pair) |
| Side optimality | Neither — global optimum | Proposing side optimal |
| Complexity | O(n³) | O(n²) |
| Requires preference lists | No — works with score matrix | Yes (ordinal preferences) |
| Handles K matches per person | Via min-cost flow generalization | Requires modification |

**For top-K matching (3-5 matches per person):**
- **Min-cost bipartite flow with capacities:** Model as flow network where each node has capacity K. Finds globally optimal K-regular bipartite matching.
- **Iterated Hungarian:** Run K rounds, removing matched pairs each round. Greedy and suboptimal — depletes popular nodes early.
- **Current approach (independent top-K + deduplication):** Simple, fast, but doesn't handle the constraint that popular attendees appear in too many match lists.

**For two-sided mode specifically:** With 30 investors (capacity 3 each = 90 slots) and 70 founders (capacity 3 each = 210 slots), supply/demand mismatch requires prioritization. Min-cost flow handles this naturally; independent top-K does not.

---

### Known Issues with Pure Score-Based Ranking

**Superstar / popularity bias:**
- Top 10% of profiles on major dating platforms receive 45-58% of all likes.
- One highly-scored attendee appears in everyone's match list — physically impossible at an event.

**The "everyone gets the same matches" problem:**
- With few questions and similar respondents, many pairs have near-identical scores. Top-3 lists become nearly identical across the whole event.
- Mitigation: diversity penalty — after picking match #1, penalize candidates similar to match #1 before picking match #2.

**Capacity constraint gap:**
- Match lists generated independently per attendee have no awareness of global load.
- Needs either hard capacity constraints or flow-based matching with per-node capacity.

**Universally-desired dimensions:**
- If 90%+ of attendees prefer the same direction on a scale question (e.g., "more experience is better"), its discriminative power is near zero.
- Consider auto-downweighting questions with low answer variance.

**The cold start / single-shot problem:**
- Dating apps refine over thousands of interactions. Event matching has one shot with no prior history.
- Algorithmic quality ceiling is set by how predictive questionnaire answers are of actual meeting satisfaction — speed dating literature suggests ~10-30% of variance at best.
- Post-event feedback is therefore the most valuable long-term asset.

---

## Proposed Improvement Plan

### Phase 1 — Fix Correctness (Now)

- **Fix rank assignment bug:** Compute ranks after full deduplication, not during the first-seen iteration. Both `rankForA` and `rankForB` should reflect each person's actual preference position, not `999` placeholders.
- **Add capacity constraint (greedy):** After scoring all pairs, sort descending by score. Iterate and assign pairs only if both attendees still have remaining capacity (`matchCount` slots). Simple O(n² log n) approach, eliminates superstar problem.
- **Ordered scale similarity for single_choice:** Allow hosts to mark a single-choice question as "ordered" (e.g., startup stage). Compute ordinal distance rather than binary match — adjacent options score higher than distant ones.

### Phase 2 — Improve Quality (Next Sprint)

- **Bidirectional / complementarity scoring:** Add a per-question flag: `similarity` (default) vs `complementarity`. For similarity questions, score as today. For complementarity questions, score highest when answers are *opposite* (e.g., "I want to fundraise" ↔ "I want to invest"). This is the most impactful improvement for two-sided events.
- **Gale-Shapley for two-sided mode:** Replace independent per-person top-K with GS (or min-cost flow with K capacity). Produces stable matches where no investor-founder pair would both prefer to switch. Particularly valuable for high-stakes professional networking.
- **Diversity penalty in match set selection:** After selecting match #1 for an attendee, apply a penalty to candidates who are highly similar to match #1 on all dimensions before selecting match #2. Ensures range across the match set.

### Phase 3 — Learning Loop (Once Data Exists)

- **Feedback-driven weight adjustment:** After each event, use the binary feedback (positive/negative per match) to train a logistic regression on (per-question similarity vector → positive outcome). Use learned coefficients to adjust global question-type weights. Even 200 matches × 10 events is enough to learn meaningful signal.
- **Embedding-based free-text field:** Add one optional open-text field ("What are you working on?" or "What do you want from this event?"). Embed answers with OpenAI `text-embedding-3-small` and include cosine similarity as an additional weighted dimension. This captures semantic context that structured questions miss.
- **Cross-event collaborative filtering:** Once behavioral data accumulates across events of the same type/industry, build attendee-type embeddings and use them to refine questionnaire-based scores. "Users at tech events who answered similarly to you tended to get positive feedback with people who answered like them."

---

## References

- Gale & Shapley (1962) — "College Admissions and the Stability of Marriage"
- Roth & Peranson (1999) — "The Redesign of the Matching Market for American Physicians"
- Fisman, Iyengar, Kamenica & Simonson (2006) — "Gender Differences in Mate Preferences: Evidence from a Speed Dating Experiment"
- Eastwick & Finkel (2008) — "Sex differences in mate preferences revisited"
- Tidwell, Eastwick & Finkel (2013) — Speed dating and complementarity
- Byrne (1971) — "The Attraction Paradigm" (similarity-attraction law)
- Watson et al. (2004) — Assortative mating in married couples
- Kuhn (1955) — "The Hungarian Method for the Assignment Problem"
- OkCupid Engineering Blog — Match percentage methodology
- Hinge Blog (2019) — "Most Compatible" stable matching feature
