import { setRequestLocale } from 'next-intl/server';
import { About } from '@/features/about/ui/about';
import { ContactSection } from '@/features/contact/ui/contact-section';
import { Hero } from '@/features/hero/ui/hero';
import { ProjectsGrid } from '@/features/projects/ui/projects-grid';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <About />
      <ProjectsGrid locale={locale as Locale} />
      <ContactSection />
    </main>
  );
}
