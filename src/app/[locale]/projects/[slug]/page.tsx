import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { allProjects } from '@/content-collections';
import { CaseStudyHeader } from '@/features/case-study/ui/case-study-header';
import { CaseStudyNav } from '@/features/case-study/ui/case-study-nav';
import { getAdjacentProjects, getProjectBySlug } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { MdxBody } from '@/shared/mdx/mdx-body';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return allProjects.map((p) => ({ locale: p.locale, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProjectBySlug(locale as Locale, slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const project = getProjectBySlug(typedLocale, slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(typedLocale, slug);
  const t = await getTranslations('projects.detail');

  return (
    <main>
      <Container size="narrow" className="py-24 md:py-32">
        <Link
          href={`/${typedLocale}/projects`}
          className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-secondary)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          {t('backToList')}
        </Link>

        <div className="mt-12">
          <CaseStudyHeader project={project} />
        </div>

        <article className="prose prose-lg mt-16 max-w-none font-serif text-[var(--fg-secondary)]">
          <MdxBody code={project.body} />
        </article>

        <div className="mt-24">
          <CaseStudyNav locale={typedLocale} prev={prev} next={next} />
        </div>
      </Container>
    </main>
  );
}
