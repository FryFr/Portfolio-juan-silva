import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { HERO_ROLE_KEYS } from '@/features/hero/data';
import { RoleRotator } from '@/features/hero/ui/role-rotator';

export async function Hero() {
  const t = await getTranslations('home.hero');
  const phrases = HERO_ROLE_KEYS.map((key) => t(`roles.${key}`));

  return (
    // svh, not vh: mobile browser chrome makes 100vh overflow by the height of the
    // address bar, which puts a scrollbar on a section meant to fit exactly.
    <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_minmax(0,38%)]">
        <div className="flex flex-col justify-center px-6 pt-28 pb-12 md:px-12 md:pt-32 md:pb-20 lg:px-20">
          <p className="font-mono text-eyebrow uppercase text-muted">
            <span className="text-accent">$</span> {t('prompt')}
          </p>

          {/* Bleeds to the container edge rather than sitting inside a max-width
              wrapper. The old hero was large but contained, which reads as
              restrained rather than bold. */}
          <DistortHeading
            as="h1"
            className="mt-6 font-serif text-display font-light text-foreground"
          >
            {t('title')}
          </DistortHeading>

          <p className="mt-8 max-w-xl font-serif text-lead italic text-subtle">{t('subtitle')}</p>

          <p className="mt-10 font-mono text-eyebrow uppercase text-muted">
            {t('rolesIntro')} · <RoleRotator phrases={phrases} />
          </p>
        </div>

        {/* Portrait as a full-height panel instead of a 192px circle. This is the
            single biggest step from "typographic" to "visual". */}
        <div className="relative min-h-[45svh] md:min-h-0">
          <Image
            src="/images/portrait/juan-silva.jpg"
            alt="Juan Silva — Mechatronics Engineer & AI Specialist"
            fill
            className="object-cover object-top grayscale-[0.35]"
            priority
            sizes="(max-width: 768px) 100vw, 38vw"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:bg-gradient-to-r"
          />
        </div>
      </div>

      {/* The old hero gave no indication anything existed below it. */}
      <div className="flex items-center justify-end border-t border-border px-6 py-5 md:px-12 lg:px-20">
        <span aria-hidden="true" className="font-mono text-eyebrow uppercase text-muted">
          scroll ↓
        </span>
      </div>
    </section>
  );
}
