import { describe, expect, it } from 'vitest';
import { getAdjacentProjects } from '@/shared/content';

// Real collection projects (en locale, sorted by order ascending):
//   order 0 — "n8n-automations"
//   order 1 — "dynapro-tracking"
//   order 2 — "michibot"
//   ...
//   order 12 — "personal-finances"

describe('getAdjacentProjects', () => {
  it('returns { prev: undefined, next: undefined } for a non-existent slug', () => {
    const result = getAdjacentProjects('en', 'no-such-project');
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });

  it('returns undefined prev and a valid next for the first project in order', () => {
    const result = getAdjacentProjects('en', 'n8n-automations');
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeDefined();
    expect(result.next?.slug).toBe('dynapro-tracking');
  });

  it('returns a valid prev and undefined next for the last project in order', () => {
    const result = getAdjacentProjects('en', 'personal-finances');
    expect(result.prev).toBeDefined();
    expect(result.prev?.slug).toBe('diomedes-chan');
    expect(result.next).toBeUndefined();
  });

  it('returns both prev and next for a middle project', () => {
    const result = getAdjacentProjects('en', 'michibot');
    expect(result.prev).toBeDefined();
    expect(result.prev?.slug).toBe('dynapro-tracking');
    expect(result.next).toBeDefined();
    expect(result.next?.slug).toBe('robotic-arm');
  });
});
