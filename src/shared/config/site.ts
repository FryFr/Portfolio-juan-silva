export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'juansilva',
    email: 'hello@juan-silva.dev',
  },
  social: {
    github: 'https://github.com/juansilva',
    linkedin: 'https://linkedin.com/in/juansilva',
    twitter: 'https://twitter.com/juansilva',
  },
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
