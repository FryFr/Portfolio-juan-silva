import { CONTACT } from './contact';

export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Mechatronics Engineer & AI Specialist',
  description:
    'Portfolio personal de Juan Silva. Ingeniero Mecatrónico, Business Systems & AI Specialist. IA, automatización, robótica y sistemas empresariales.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'FryFr',
    jobTitle: 'Business Systems & AI Specialist',
  },
  social: {
    github: 'https://github.com/FryFr',
    linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
    youtube: 'https://www.youtube.com/@zicamtech',
    tiktok: 'https://www.tiktok.com/@atlion_robotics',
    instagram: 'https://www.instagram.com/atlion_robotics/',
  },
  contact: CONTACT,
  nav: [
    { key: 'work', path: '/projects' },
    { key: 'writing', path: '/blog' },
    { key: 'talks', path: '/talks' },
    { key: 'about', path: '/#about' },
  ],
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type NavKey = (typeof siteConfig.nav)[number]['key'];
