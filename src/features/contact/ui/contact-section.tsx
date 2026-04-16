import { getTranslations } from 'next-intl/server';
import { ContactButton } from '@/features/contact/ui/contact-button';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { buildLinkedInUrl, buildWhatsAppUrl } from '@/shared/config/contact';
import { Container } from '@/shared/ui/container';

export async function ContactSection() {
  const t = await getTranslations('contact');
  const whatsappUrl = buildWhatsAppUrl(t('whatsappMessage'));
  const linkedinUrl = buildLinkedInUrl();

  return (
    <section id="contact" className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
        >
          {t('heading')}
        </DistortHeading>
        <ProximityReveal className="mt-8 max-w-2xl font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
          {t('copy')}
        </ProximityReveal>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ContactButton variant="whatsapp" href={whatsappUrl} label={t('whatsappLabel')} />
          <ContactButton variant="linkedin" href={linkedinUrl} label={t('linkedinLabel')} />
        </div>
      </Container>
    </section>
  );
}
