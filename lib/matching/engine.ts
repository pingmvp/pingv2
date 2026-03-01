import {
  singleChoiceSimilarity,
  multipleChoiceSimilarity,
  scaleSimilarity,
} from "./similarity";

export type QuestionType = "single_choice" | "multiple_choice" | "scale";

export interface MatchQuestion {
  id: string;
  type: QuestionType;
  weight: number;
  scaleMin?: number;
  scaleMax?: number;
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
  rankForA: number;
  rankForB: number;
}

export interface EngineInput {
  questions: MatchQuestion[];
  attendees: MatchAttendee[];
  matchCount: number;
  matchingMode: "general" | "two_sided";
}

/** Compute compatibility score for a single pair of attendees */
function scorePair(
  a: MatchAttendee,
  b: MatchAttendee,
  questions: MatchQuestion[]
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const q of questions) {
    const aVal = a.responses[q.id];
    const bVal = b.responses[q.id];

    // Skip if either attendee didn't answer
    if (aVal === undefined || bVal === undefined) continue;

    let sim = 0;

    if (q.type === "single_choice") {
      sim = singleChoiceSimilarity(aVal as string, bVal as string);
    } else if (q.type === "multiple_choice") {
      sim = multipleChoiceSimilarity(aVal as string[], bVal as string[]);
    } else if (q.type === "scale") {
      sim = scaleSimilarity(
        aVal as number,
        bVal as number,
        q.scaleMin ?? 1,
        q.scaleMax ?? 10
      );
    }

    weightedScore += sim * q.weight;
    totalWeight += q.weight;
  }

  return totalWeight === 0 ? 0 : weightedScore / totalWeight;
}

/** Check if a pair is eligible based on matching mode */
function isPairEligible(
  a: MatchAttendee,
  b: MatchAttendee,
  matchingMode: "general" | "two_sided"
): boolean {
  if (matchingMode === "general") return true;
  // two_sided: must be in different groups
  if (!a.groupId || !b.groupId) return false;
  return a.groupId !== b.groupId;
}

/**
 * Run the matching engine.
 * Returns match results for all selected pairs (top-K per attendee).
 */
export function runMatchingEngine(input: EngineInput): MatchResult[] {
  const { questions, attendees, matchCount, matchingMode } = input;

  // Build pairwise score matrix
  const scores: Map<string, number> = new Map(); // "idA:idB" → score
  const pairKey = (a: string, b: string) =>
    a < b ? `${a}:${b}` : `${b}:${a}`;

  for (let i = 0; i < attendees.length; i++) {
    for (let j = i + 1; j < attendees.length; j++) {
      const a = attendees[i];
      const b = attendees[j];

      if (!isPairEligible(a, b, matchingMode)) continue;

      const score = scorePair(a, b, questions);
      scores.set(pairKey(a.id, b.id), score);
    }
  }

  // For each attendee, build ranked list of candidates
  const rankedMatches: Map<string, Array<{ id: string; score: number }>> =
    new Map();

  for (const attendee of attendees) {
    const candidates: Array<{ id: string; score: number }> = [];

    for (const other of attendees) {
      if (other.id === attendee.id) continue;
      if (!isPairEligible(attendee, other, matchingMode)) continue;

      const key = pairKey(attendee.id, other.id);
      const score = scores.get(key) ?? 0;
      candidates.push({ id: other.id, score });
    }

    candidates.sort((a, b) => b.score - a.score);
    rankedMatches.set(attendee.id, candidates.slice(0, matchCount));
  }

  // Apply reciprocity boost: if A→B and B→A both appear in top-K, mark pair as mutual
  // (for now this is informational; reciprocity is already implicit in the ranking)

  // Deduplicate pairs and build final results
  const seen = new Set<string>();
  const results: MatchResult[] = [];

  for (const [attendeeId, topMatches] of rankedMatches) {
    topMatches.forEach(({ id: matchId, score }, rankIdx) => {
      const key = pairKey(attendeeId, matchId);
      if (seen.has(key)) return;
      seen.add(key);

      const otherMatches = rankedMatches.get(matchId) ?? [];
      const rankForB = otherMatches.findIndex((m) => m.id === attendeeId);

      results.push({
        attendeeAId: attendeeId < matchId ? attendeeId : matchId,
        attendeeBId: attendeeId < matchId ? matchId : attendeeId,
        score,
        rankForA: attendeeId < matchId ? rankIdx + 1 : (rankForB === -1 ? 999 : rankForB + 1),
        rankForB: attendeeId < matchId ? (rankForB === -1 ? 999 : rankForB + 1) : rankIdx + 1,
      });
    });
  }

  return results;
}
