import {
  singleChoiceSimilarity,
  orderedSingleChoiceSimilarity,
  multipleChoiceSimilarity,
  scaleSimilarity,
} from "./similarity";

export type QuestionType = "single_choice" | "multiple_choice" | "scale";

export interface MatchQuestion {
  id: string;
  text?: string;
  type: QuestionType;
  weight: number;
  /**
   * For single_choice questions: when provided, enables ordinal similarity
   * (adjacent options score higher than distant ones) instead of binary exact match.
   */
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface BreakdownItem {
  questionId: string;
  questionText: string;
  weight: number;
  answerA: unknown;
  answerB: unknown;
  /** null if either attendee didn't answer */
  similarity: number | null;
  /** similarity * weight / totalWeight; 0 if unanswered */
  weightedContribution: number;
}

export interface MatchAttendee {
  id: string;
  groupId?: string | null;
  responses: Record<string, unknown>; // questionId → value
}

export interface MatchResult {
  attendeeAId: string;
  attendeeBId: string;
  score: number;
  /** 1-based rank of this match in attendeeA's full preference list */
  rankForA: number;
  /** 1-based rank of this match in attendeeB's full preference list */
  rankForB: number;
}

export interface EngineInput {
  questions: MatchQuestion[];
  attendees: MatchAttendee[];
  matchCount: number;
  matchingMode: "general" | "two_sided";
}

/** Compute compatibility score for a single pair */
function scorePair(
  a: MatchAttendee,
  b: MatchAttendee,
  questions: MatchQuestion[]
): number {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  if (totalWeight === 0) return 0;

  let weightedScore = 0;

  for (const q of questions) {
    const aVal = a.responses[q.id];
    const bVal = b.responses[q.id];
    if (aVal === undefined || bVal === undefined) continue;

    let sim = 0;

    if (q.type === "single_choice") {
      sim =
        q.options && q.options.length > 1
          ? orderedSingleChoiceSimilarity(aVal as string, bVal as string, q.options)
          : singleChoiceSimilarity(aVal as string, bVal as string);
    } else if (q.type === "multiple_choice") {
      sim = multipleChoiceSimilarity(aVal as string[], bVal as string[]);
    } else if (q.type === "scale") {
      sim = scaleSimilarity(aVal as number, bVal as number, q.scaleMin ?? 1, q.scaleMax ?? 10);
    }

    weightedScore += sim * q.weight;
  }

  return weightedScore / totalWeight;
}

/** Check if a pair is eligible based on matching mode */
function isPairEligible(
  a: MatchAttendee,
  b: MatchAttendee,
  matchingMode: "general" | "two_sided"
): boolean {
  if (matchingMode === "general") return true;
  if (!a.groupId || !b.groupId) return false;
  return a.groupId !== b.groupId;
}

/** Compute per-question similarity breakdown for a matched pair */
export function computeBreakdown(
  aResponses: Record<string, unknown>,
  bResponses: Record<string, unknown>,
  questions: MatchQuestion[]
): BreakdownItem[] {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  return questions.map((q) => {
    const aVal = aResponses[q.id];
    const bVal = bResponses[q.id];

    if (aVal === undefined || bVal === undefined) {
      return {
        questionId: q.id,
        questionText: q.text ?? "",
        weight: q.weight,
        answerA: aVal ?? null,
        answerB: bVal ?? null,
        similarity: null,
        weightedContribution: 0,
      };
    }

    let sim = 0;
    if (q.type === "single_choice") {
      sim =
        q.options && q.options.length > 1
          ? orderedSingleChoiceSimilarity(aVal as string, bVal as string, q.options)
          : singleChoiceSimilarity(aVal as string, bVal as string);
    } else if (q.type === "multiple_choice") {
      sim = multipleChoiceSimilarity(aVal as string[], bVal as string[]);
    } else if (q.type === "scale") {
      sim = scaleSimilarity(aVal as number, bVal as number, q.scaleMin ?? 1, q.scaleMax ?? 10);
    }

    return {
      questionId: q.id,
      questionText: q.text ?? "",
      weight: q.weight,
      answerA: aVal,
      answerB: bVal,
      similarity: sim,
      weightedContribution: totalWeight === 0 ? 0 : (sim * q.weight) / totalWeight,
    };
  });
}

/**
 * Run the matching engine.
 *
 * Phase 1 improvements over v1:
 * - Ranks are computed over ALL eligible candidates (not just top-K), so rankForA/B
 *   reflect true preference position regardless of capacity assignment.
 * - Capacity-constrained greedy assignment: pairs are sorted by score desc and
 *   greedily assigned only when both attendees have remaining capacity. This
 *   eliminates the superstar problem (one person appearing in everyone's match list).
 * - Ordered single_choice similarity via `options` field on MatchQuestion.
 */
export function runMatchingEngine(input: EngineInput): MatchResult[] {
  const { questions, attendees, matchCount, matchingMode } = input;

  if (attendees.length < 2) return [];

  // Canonical key: always smaller UUID first to avoid duplicate pairs
  const pairKey = (a: string, b: string) =>
    a < b ? `${a}:${b}` : `${b}:${a}`;

  // ── Step 1: Build pairwise score matrix ───────────────────────────────────
  const scores = new Map<string, number>();

  for (let i = 0; i < attendees.length; i++) {
    for (let j = i + 1; j < attendees.length; j++) {
      const a = attendees[i];
      const b = attendees[j];
      if (!isPairEligible(a, b, matchingMode)) continue;
      scores.set(pairKey(a.id, b.id), scorePair(a, b, questions));
    }
  }

  // ── Step 2: Build rank lookup over ALL eligible candidates ────────────────
  // rank[attendeeId][candidateId] = 1-based rank by score desc
  // Built over all candidates, not just top-K, so rank accurately reflects
  // preference position even when capacity constraints limit the assignment.
  const rankLookup = new Map<string, Map<string, number>>();

  for (const attendee of attendees) {
    const candidates: Array<{ id: string; score: number }> = [];

    for (const other of attendees) {
      if (other.id === attendee.id) continue;
      if (!isPairEligible(attendee, other, matchingMode)) continue;
      candidates.push({
        id: other.id,
        score: scores.get(pairKey(attendee.id, other.id)) ?? 0,
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    const rankMap = new Map<string, number>();
    candidates.forEach((c, i) => rankMap.set(c.id, i + 1));
    rankLookup.set(attendee.id, rankMap);
  }

  // ── Step 3: Capacity-constrained greedy assignment ────────────────────────
  // Sort all eligible pairs by score descending, then assign greedily.
  // Each attendee can appear in at most `matchCount` final match pairs.
  // This prevents any single "superstar" attendee from dominating all lists.
  const allPairs: Array<{ a: string; b: string; score: number }> = [];

  for (const [key, score] of scores) {
    const sep = key.indexOf(":");
    const a = key.slice(0, sep);
    const b = key.slice(sep + 1);
    allPairs.push({ a, b, score });
  }

  allPairs.sort((x, y) => y.score - x.score);

  const capacity = new Map<string, number>();
  for (const attendee of attendees) capacity.set(attendee.id, matchCount);

  const assigned: Array<{ a: string; b: string; score: number }> = [];

  for (const pair of allPairs) {
    const capA = capacity.get(pair.a) ?? 0;
    const capB = capacity.get(pair.b) ?? 0;
    if (capA > 0 && capB > 0) {
      assigned.push(pair);
      capacity.set(pair.a, capA - 1);
      capacity.set(pair.b, capB - 1);
    }
  }

  // ── Step 4: Build results with correct ranks from lookup ──────────────────
  // `a` is always the lexicographically smaller UUID (from pairKey canonical form),
  // so attendeeAId = a, attendeeBId = b consistently.
  return assigned.map(({ a, b, score }) => ({
    attendeeAId: a,
    attendeeBId: b,
    score,
    rankForA: rankLookup.get(a)?.get(b) ?? 999,
    rankForB: rankLookup.get(b)?.get(a) ?? 999,
  }));
}
