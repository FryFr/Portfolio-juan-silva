import { describe, expect, it } from 'vitest';
import { estimateReadingTime } from '@/features/blog/lib/reading-time';

// The implementation uses WORDS_PER_MINUTE = 220 and always returns at least 1.
// It takes a plain word-count number — callers are responsible for counting words.

describe('estimateReadingTime', () => {
  it('returns 1 for zero words (empty content)', () => {
    expect(estimateReadingTime(0)).toBe(1);
  });

  it('returns 1 for negative word count', () => {
    expect(estimateReadingTime(-50)).toBe(1);
  });

  it('returns 1 for very short content (below one full minute at 220 wpm)', () => {
    // 100 words / 220 wpm = ~0.45 min → rounds to 0, clamped to 1
    expect(estimateReadingTime(100)).toBe(1);
  });

  it('returns 1 for exactly 220 words (one minute at 220 wpm)', () => {
    expect(estimateReadingTime(220)).toBe(1);
  });

  it('scales proportionally with word count', () => {
    // 440 words / 220 wpm = exactly 2 minutes
    expect(estimateReadingTime(440)).toBe(2);
    // 660 words / 220 wpm = exactly 3 minutes
    expect(estimateReadingTime(660)).toBe(3);
  });

  it('rounds to nearest minute', () => {
    // 550 words / 220 wpm = 2.5 → rounds to 3
    expect(estimateReadingTime(550)).toBe(3);
    // 330 words / 220 wpm = 1.5 → rounds to 2
    expect(estimateReadingTime(330)).toBe(2);
  });
});
