import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ABOUT_BIO_PARAGRAPHS } from '@/features/about/data';
import { SkillsGrid } from '@/features/about/ui/skills-grid';
import { SoftSkills } from '@/features/about/ui/soft-skills';
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
        <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
          <div className="relative aspect-[3/4] w-full max-w-xs shrink-0 overflow-hidden rounded-sm border border-[var(--bg-tertiary)]">
            <Image
              src="/images/portrait/juan-silva-formal.jpg"
              alt="Juan Silva"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70">
              fig.01 — Juan Silva
            </span>
          </div>
          <div className="max-w-2xl space-y-6 font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
            {bio.map((paragraph) => (
              <ProximityReveal key={paragraph}>{paragraph}</ProximityReveal>
            ))}
          </div>
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

        <div className="mt-20">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('softSkillsTitle')}
          </h3>
          <div className="mt-6">
            <SoftSkills />
          </div>
        </div>
      </Container>
    </section>
  );
}
