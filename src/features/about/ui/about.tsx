import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ABOUT_BIO_PARAGRAPHS } from '@/features/about/data';
import { SkillsGrid } from '@/features/about/ui/skills-grid';
import { SoftSkills } from '@/features/about/ui/soft-skills';
import { Stats } from '@/features/about/ui/stats';
import { Timeline } from '@/features/about/ui/timeline';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { Container } from '@/shared/ui/container';
import { Eyebrow } from '@/shared/ui/eyebrow';

/**
 * About used to be one 271-word block — 84% of the entire `home` namespace — with
 * a single image serving only its first 76 words, followed by three
 * near-identical hairline-separated text grids under 10px mono headings. Nothing
 * told the eye where to stop.
 *
 * It is now three sections that differ from each other, and from their
 * neighbours, on background and rhythm rather than repeating one template.
 */
export async function About() {
  const t = await getTranslations('home.about');
  const bio = Array.from({ length: ABOUT_BIO_PARAGRAPHS }, (_, i) => t(`bio.${i}`));

  return (
    <>
      {/* 1 — Statement. Full-bleed image, oversized pull-quote, no container. */}
      <section id="about" className="grid grid-cols-1 border-t border-border md:grid-cols-2">
        <div className="relative min-h-[60svh] border-b border-border md:min-h-[80svh] md:border-r md:border-b-0">
          <Image
            src="/images/portrait/juan-silva-formal.jpg"
            alt="Juan Silva"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <DistortHeading
            as="h2"
            className="mt-6 font-serif text-section font-light text-foreground"
          >
            {t('title')}
          </DistortHeading>
          <div className="mt-10 space-y-6">
            {bio.map((paragraph) => (
              <ProximityReveal
                key={paragraph}
                className="max-w-xl font-serif text-lead leading-relaxed text-body"
              >
                {paragraph}
              </ProximityReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — Numbers. Different surface, different rhythm, no prose at all. */}
      <section className="border-t border-border bg-surface">
        <Container size="wide" className="py-20 md:py-24">
          <Stats />
        </Container>
      </section>

      {/* 3 — Capability. Dense, asymmetric, label-led. */}
      <section className="border-t border-border">
        <Container size="wide" className="py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[2fr_1fr] lg:gap-24">
            <div>
              <Eyebrow as="h3">{t('skillsTitle')}</Eyebrow>
              <div className="mt-8">
                <SkillsGrid />
              </div>
              <div className="mt-14">
                <Eyebrow as="h3">{t('softSkillsTitle')}</Eyebrow>
                <div className="mt-6">
                  <SoftSkills />
                </div>
              </div>
            </div>

            <div>
              <Eyebrow as="h3">{t('timelineTitle')}</Eyebrow>
              <Timeline />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
