import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { HERO_ROLE_KEYS } from '@/features/hero/data';
import { RoleRotator } from '@/features/hero/ui/role-rotator';
import { FieldCanvas } from '@/shared/ui/field-canvas';

export async function Hero() {
  const t = await getTranslations('home.hero');
  const phrases = HERO_ROLE_KEYS.map((key) => t(`roles.${key}`));

  return (
    // svh, not vh: mobile browser chrome makes 100vh overflow by the height of the
    // address bar, which puts a scrollbar on a section meant to fit exactly.
    <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden">
      <FieldCanvas kind="flow" className="pointer-events-none absolute inset-0 block" />

      {/* Legibility scrim, text column only.
          The field runs at full presence everywhere it is actually seen; this
          just lifts the ground back out from under the display type, which
          otherwise shares a tonal range with the trails. Narrow and heavily
          feathered, so it reads as depth rather than a panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background via-background/80 to-transparent md:w-3/5"
      />

      <div className="relative grid flex-1 items-center gap-10 px-6 pt-28 pb-12 md:grid-cols-[1fr_auto] md:gap-16 md:px-12 md:pt-32 md:pb-20 lg:px-20">
        <div className="flex flex-col justify-center">
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-muted md:text-base">
            <span className="text-accent">$</span> {t('prompt')}
          </p>

          <DistortHeading
            as="h1"
            className="mt-7 font-sans text-display font-light text-foreground"
          >
            {t('title')}
          </DistortHeading>

          <p className="mt-8 max-w-xl font-sans text-lead italic text-subtle">{t('subtitle')}</p>

          <p className="mt-10 font-mono text-sm uppercase tracking-[0.22em] text-muted md:text-base">
            {t('rolesIntro')} · <RoleRotator phrases={phrases} />
          </p>
        </div>

        {/* Contained portrait, not a full-height bleed panel. At full height the
            crop demanded more source pixels than a square photo can give and
            upscaled on retina, and it dominated a page whose subject is the work
            rather than the face. */}
        <div className="relative aspect-[3/4] w-full max-w-[16rem] justify-self-start overflow-hidden rounded-sm border border-border md:w-[clamp(14rem,22vw,20rem)] md:max-w-none md:justify-self-end">
          <Image
            src="/images/portrait/juan-silva.jpg"
            alt="Juan Silva — Mechatronics Engineer & AI Specialist"
            fill
            className="object-cover object-top"
            priority
            sizes="(max-width: 768px) 16rem, 20rem"
          />
        </div>
      </div>

      {/* The old hero gave no indication anything existed below it. */}
      <div className="relative flex items-center justify-end border-t border-border px-6 py-5 md:px-12 lg:px-20">
        <span aria-hidden="true" className="font-mono text-eyebrow uppercase text-muted">
          scroll ↓
        </span>
      </div>
    </section>
  );
}
