/**
 * Similarity functions for each question type.
 * All functions return a value between 0.0 (no similarity) and 1.0 (identical).
 */

/** single_choice: exact match (fallback when no option order is defined) */
export function singleChoiceSimilarity(a: string, b: string): number {
  return a === b ? 1 : 0;
}

/**
 * single_choice (ordered): ordinal distance similarity.
 * Treats options as an ordered scale — adjacent options score higher than distant ones.
 * e.g. options = ["Idea", "Pre-seed", "Seed", "Series A+"]
 *   "Idea" vs "Pre-seed" → 1 - 1/3 = 0.67
 *   "Idea" vs "Series A+" → 1 - 3/3 = 0.00
 * Falls back to exact match if either value isn't found in the options array.
 */
export function orderedSingleChoiceSimilarity(
  a: string,
  b: string,
  options: string[]
): number {
  const idxA = options.indexOf(a);
  const idxB = options.indexOf(b);
  if (idxA === -1 || idxB === -1) return a === b ? 1 : 0;
  if (options.length <= 1) return 1;
  return 1 - Math.abs(idxA - idxB) / (options.length - 1);
}

/** multiple_choice: Jaccard similarity (|intersection| / |union|) */
export function multipleChoiceSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/** scale: normalized distance. Closer values = higher score. */
export function scaleSimilarity(a: number, b: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 1;
  return 1 - Math.abs(a - b) / range;
}
