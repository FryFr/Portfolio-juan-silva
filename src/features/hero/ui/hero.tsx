import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { HERO_ROLE_KEYS } from '@/features/hero/data';
import { RoleRotator } from '@/features/hero/ui/role-rotator';
import { Container } from '@/shared/ui/container';

export async function Hero() {
  const t = await getTranslations('home.hero');
  const phrases = HERO_ROLE_KEYS.map((key) => t(`roles.${key}`));

  return (
    <section className="relative">
      <Container size="wide" className="py-24 md:py-32">
        <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span className="text-[var(--accent)]">$</span> {t('prompt')}
        </div>
        <DistortHeading
          as="h1"
          className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[var(--fg-primary)] md:text-9xl"
        >
          {t('title')}
        </DistortHeading>
        <ProximityReveal className="mt-6 max-w-2xl font-serif text-xl italic text-[var(--fg-tertiary)] md:text-2xl">
          {t('subtitle')}
        </ProximityReveal>
        <p className="mt-10 font-mono text-sm uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          {t('rolesIntro')} · <RoleRotator phrases={phrases} />
        </p>
      </Container>
    </section>
  );
}
