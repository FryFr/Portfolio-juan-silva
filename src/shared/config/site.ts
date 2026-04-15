export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'FryFr',
    email: 'hello@juan-silva.dev',
    jobTitle: 'Senior Software Architect',
  },
  social: {
    github: 'https://github.com/FryFr',
    linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
  },
  nav: [
    { key: 'work', href: '/' },
    { key: 'writing', href: '/' },
    { key: 'talks', href: '/' },
    { key: 'about', href: '/' },
  ],
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type NavKey = (typeof siteConfig.nav)[number]['key'];
