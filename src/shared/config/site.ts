import { CONTACT } from './contact';

export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'FryFr',
    jobTitle: 'Senior Software Architect',
  },
  social: {
    github: 'https://github.com/FryFr',
    linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
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
