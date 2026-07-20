import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProjectCard } from '@/features/projects/ui/project-card';
import { getProjects } from '@/shared/content';
import { type Locale, routing } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects.index' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ProjectsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const t = await getTranslations('projects.index');
  const projects = getProjects(typedLocale);

  return (
    <main>
      <section>
        <Container size="wide" className="py-24 md:py-32">
          <DistortHeading
            as="h1"
            className="max-w-3xl font-sans text-4xl font-normal leading-[1] tracking-[-0.02em] text-foreground md:text-6xl"
          >
            {t('title')}
          </DistortHeading>
          <p className="mt-6 max-w-2xl font-sans text-lg italic text-subtle">{t('subtitle')}</p>

          {projects.length === 0 ? (
            <p className="mt-12 font-sans italic text-subtle">{t('empty')}</p>
          ) : (
            <ul className="mt-16 space-y-20">
              {projects.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} locale={typedLocale} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </main>
  );
}
