import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';

export async function Footer() {
  const t = await getTranslations('common.footer');
  const year = new Date().getFullYear();

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
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {t('copyright', { year })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
