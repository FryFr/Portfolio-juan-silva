import { getTranslations } from 'next-intl/server';
import { ContactButton } from '@/features/contact/ui/contact-button';
import { LinkedInIcon, WhatsAppIcon } from '@/features/contact/ui/icons';
import { buildLinkedInUrl, buildWhatsAppUrl } from '@/shared/config/contact';
import { Container } from '@/shared/ui/container';

/**
 * Was 33 words, zero imagery, zero icons, on the same border-t + Container
 * template as the two sections above it — so the page ended on a flat text block
 * indistinguishable from what preceded it.
 *
 * Now an inverted full-bleed band. Inversion is the strongest available signal
 * that the page has reached its end, and it costs nothing to load.
 */
export async function ContactSection() {
  const t = await getTranslations('contact');
  const whatsappUrl = buildWhatsAppUrl(t('whatsappMessage'));
  const linkedinUrl = buildLinkedInUrl();

  return (
    <section id="contact" className="bg-invert text-on-invert">
      <Container size="wide" className="py-28 md:py-40">
        <p className="font-mono text-eyebrow uppercase text-on-invert/60">{t('eyebrow')}</p>

        {/* Plain h2, not DistortHeading: the per-character split effect reads as
            signature on the hero and as repetition when it is on every heading. */}
        <h2 className="mt-6 max-w-4xl font-serif text-display font-light leading-[0.9] text-on-invert">
          {t('heading')}
        </h2>

        {/* Deliberately NOT ProximityReveal. Its .reveal-text class mixes
            --fg-secondary toward --accent, both calibrated against --bg-primary.
            On an inverted surface that resolves to dark text on a dark band — the
            same class of bug as the original hardcoded lerp. An effect that reads
            theme tokens cannot be dropped onto a surface those tokens do not
            describe. */}
        <p className="mt-10 max-w-2xl font-serif text-lead leading-relaxed text-on-invert/80">
          {t('copy')}
        </p>

        <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ContactButton
            variant="whatsapp"
            href={whatsappUrl}
            label={t('whatsappLabel')}
            icon={<WhatsAppIcon />}
            className="bg-on-invert text-invert hover:bg-accent hover:text-invert"
          />
          <ContactButton
            variant="linkedin"
            href={linkedinUrl}
            label={t('linkedinLabel')}
            icon={<LinkedInIcon />}
            className="border-on-invert/40 text-on-invert hover:border-on-invert"
          />
        </div>
      </Container>
    </section>
  );
}
