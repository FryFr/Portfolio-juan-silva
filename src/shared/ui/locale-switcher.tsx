'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/shared/i18n/navigation';
import { routing } from '@/shared/i18n/routing';
import { cn } from '@/shared/lib/cn';

type Props = {
  currentLocale: string;
  className?: string;
};

export function LocaleSwitcher({ currentLocale, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        'flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em]',
        className,
      )}
    >
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            disabled={isActive || isPending}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { locale });
              });
            }}
            className={cn(
              'h-8 px-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              isActive
                ? 'text-[var(--fg-primary)] underline underline-offset-4'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]',
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
