export const ABOUT_SKILL_KEYS = ['architecture', 'testing', 'tooling', 'teaching'] as const;
export type AboutSkillKey = (typeof ABOUT_SKILL_KEYS)[number];

export const ABOUT_TIMELINE_KEYS = ['current', 'mvp', 'gde', 'lead', 'senior'] as const;
export type AboutTimelineKey = (typeof ABOUT_TIMELINE_KEYS)[number];

export const ABOUT_BIO_PARAGRAPHS = 2;
