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
    <section className="border-t border-border">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-eyebrow uppercase text-muted">{t('eyebrow')}</p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-foreground md:text-6xl"
        >
          {t('title')}
        </DistortHeading>
        <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
          <div className="relative aspect-[3/4] w-full max-w-xs shrink-0 overflow-hidden rounded-sm border border-border">
            <Image
              src="/images/portrait/juan-silva-formal.jpg"
              alt="Juan Silva"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            {/* Scrim, not opacity: contrast against a photograph is otherwise
                undefined and varies with whatever pixels sit behind the text. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent"
            />
            <span className="absolute bottom-3 left-3 font-mono text-eyebrow uppercase text-white">
              fig.01 — Juan Silva
            </span>
          </div>
          <div className="max-w-2xl space-y-6 font-serif text-lg leading-relaxed text-body md:text-xl">
            {bio.map((paragraph) => (
              <ProximityReveal key={paragraph}>{paragraph}</ProximityReveal>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-eyebrow uppercase text-muted">{t('skillsTitle')}</h3>
          <div className="mt-6">
            <SkillsGrid />
          </div>
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-eyebrow uppercase text-muted">{t('timelineTitle')}</h3>
          <Timeline />
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-eyebrow uppercase text-muted">{t('softSkillsTitle')}</h3>
          <div className="mt-6">
            <SoftSkills />
          </div>
        </div>
      </Container>
    </section>
  );
}
