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
import { FieldCanvas } from '@/shared/ui/field-canvas';

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
      {/* 1 — Statement. Image is a contained portrait rather than a half-screen
          bleed: at that size it out-shouted the statement it was meant to support,
          and the crop outran the source resolution. */}
      <section id="about" className="relative overflow-hidden border-t border-border">
        {/* Structural counterpart to the hero's flow field: same accent, same
            point vocabulary, under tension rather than in motion. */}
        <FieldCanvas kind="lattice" className="pointer-events-none absolute inset-0 block" />

        <div className="relative grid grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-20 md:px-12 md:py-32 lg:px-20">
          <div className="reveal relative aspect-[3/4] w-full max-w-[18rem] overflow-hidden rounded-sm border border-border md:max-w-none">
            <Image
              src="/images/portrait/juan-silva-formal.jpg"
              alt="Juan Silva"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 18rem, 22rem"
            />
          </div>

          <div className="reveal flex flex-col justify-center">
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <DistortHeading
              as="h2"
              className="mt-6 font-sans text-section font-light text-foreground"
            >
              {t('title')}
            </DistortHeading>
            <div className="mt-10 space-y-6">
              {bio.map((paragraph) => (
                <ProximityReveal
                  key={paragraph}
                  className="max-w-xl font-sans text-lead leading-relaxed text-body"
                >
                  {paragraph}
                </ProximityReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Numbers. Different surface, different rhythm, no prose at all.
          The field carries through at reduced intensity: the same language, but
          this band is the quiet beat between two loud ones and should not shout
          back. Section rhythm is what fixed "hard to understand the structure";
          running every field at full strength would flatten it again. */}
      <section className="relative overflow-hidden border-t border-border bg-surface">
        <FieldCanvas
          kind="lattice"
          intensity={0.55}
          className="pointer-events-none absolute inset-0 block"
        />
        <Container size="wide" className="relative py-20 md:py-28">
          <Stats />
        </Container>
      </section>

      {/* 3 — Capability. Dense, asymmetric, label-led. */}
      <section className="border-t border-border">
        <Container size="wide" className="py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[2fr_1fr] lg:gap-24">
            <div>
              <Eyebrow as="h3" className="reveal">
                {t('skillsTitle')}
              </Eyebrow>
              <div className="mt-8">
                <SkillsGrid />
              </div>
              <div className="mt-14">
                <Eyebrow as="h3" className="reveal">
                  {t('softSkillsTitle')}
                </Eyebrow>
                <div className="reveal mt-6">
                  <SoftSkills />
                </div>
              </div>
            </div>

            <div>
              <Eyebrow as="h3" className="reveal">
                {t('timelineTitle')}
              </Eyebrow>
              <Timeline />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
