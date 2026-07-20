export const ABOUT_SKILL_KEYS = ['ai', 'backend', 'robotics', 'frontend'] as const;
export type AboutSkillKey = (typeof ABOUT_SKILL_KEYS)[number];

export const ABOUT_TIMELINE_KEYS = [
  'current',
  'manageengine',
  'teleperformance_manager',
  'teleperformance_supervisor',
  'university',
] as const;
export type AboutTimelineKey = (typeof ABOUT_TIMELINE_KEYS)[number];

// Cut from 2 to 1. The second paragraph's load-bearing facts (1200 people led,
// +30% sales) moved into <Stats>, where they are scannable instead of buried.
export const ABOUT_BIO_PARAGRAPHS = 1;
