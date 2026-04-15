export const HERO_ROLE_KEYS = ['architect', 'gde', 'mvp', 'teacher'] as const;

export type HeroRoleKey = (typeof HERO_ROLE_KEYS)[number];
