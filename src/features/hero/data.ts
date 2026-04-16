export const HERO_ROLE_KEYS = ['ai', 'mechatronics', 'itsm', 'robotics'] as const;

export type HeroRoleKey = (typeof HERO_ROLE_KEYS)[number];
