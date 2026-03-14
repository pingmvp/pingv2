/**
 * Similarity functions for each question type.
 * All functions return a value between 0.0 (no similarity) and 1.0 (identical).
 */

/** single_choice: exact match */
export function singleChoiceSimilarity(a: string, b: string): number {
  return a === b ? 1 : 0;
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
