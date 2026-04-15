const WORDS_PER_MINUTE = 220;

export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 1;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
