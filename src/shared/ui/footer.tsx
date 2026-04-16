import { getLocale, getTranslations } from 'next-intl/server';
import { buildWhatsAppUrl, CONTACT } from '@/shared/config/contact';
import { siteConfig } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';

export async function Footer() {
  const t = await getTranslations('common.footer');
  const tContact = await getTranslations('contact');
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const buildTs = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? new Date().toISOString();
  const buildDate = new Date(buildTs);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(buildDate);

  const whatsappUrl = buildWhatsAppUrl(tContact('whatsappMessage'));

  return (
    <footer className="mt-24 border-t border-[var(--bg-tertiary)] py-10">
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="font-serif text-sm italic text-[var(--fg-tertiary)]">{t('builtWith')}</p>
          <ul className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)]">
            <li>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                github
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                linkedin
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.youtube}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                youtube
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
                aria-label={`WhatsApp +${CONTACT.whatsappE164}`}
              >
                whatsapp
              </a>
            </li>
          </ul>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {t('lastUpdated', { date: formattedDate })}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {t('copyright', { year })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
