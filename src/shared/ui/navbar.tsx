import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';
import { Link } from '@/shared/ui/link';
import { LocaleSwitcher } from '@/shared/ui/locale-switcher';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type Props = {
  locale: string;
};

export async function Navbar({ locale }: Props) {
  const t = await getTranslations('common');

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--bg-tertiary)] bg-[var(--bg-primary)]/80 backdrop-blur">
      <Container size="wide">
        <nav className="flex h-14 items-center justify-between gap-6" aria-label="Primary">
          <Link
            href="/"
            className="font-serif text-lg font-normal tracking-tight text-[var(--fg-primary)] hover:text-[var(--fg-secondary)]"
          >
            {t('siteName')}
            <span className="text-[var(--accent)]">.</span>
          </Link>

          <ul className="hidden items-center gap-6 md:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.path}
                  className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle labelLight={t('theme.toLight')} labelDark={t('theme.toDark')} />
            <LocaleSwitcher currentLocale={locale} />
          </div>
        </nav>
      </Container>
    </header>
  );
}
