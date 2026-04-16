import { getTranslations } from 'next-intl/server';
import { ABOUT_BIO_PARAGRAPHS } from '@/features/about/data';
import { SkillsGrid } from '@/features/about/ui/skills-grid';
import { Timeline } from '@/features/about/ui/timeline';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { Container } from '@/shared/ui/container';

export async function About() {
  const t = await getTranslations('home.about');
  const bio = Array.from({ length: ABOUT_BIO_PARAGRAPHS }, (_, i) => t(`bio.${i}`));

  return (
    <section className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
        >
          {t('title')}
        </DistortHeading>
        <div className="mt-12 max-w-2xl space-y-6 font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
          {bio.map((paragraph) => (
            <ProximityReveal key={paragraph}>{paragraph}</ProximityReveal>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('skillsTitle')}
          </h3>
          <div className="mt-6">
            <SkillsGrid />
          </div>
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('timelineTitle')}
          </h3>
          <Timeline />
        </div>
      </Container>
    </section>
  );
}
