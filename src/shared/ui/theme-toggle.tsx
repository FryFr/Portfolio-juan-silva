'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  labelLight: string;
  labelDark: string;
  className?: string;
};

export function ThemeToggle({ labelLight, labelDark, className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const nextLabel = isDark ? labelLight : labelDark;

  return (
    <button
      type="button"
      aria-label={nextLabel}
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-8 items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        className,
      )}
    >
      <span aria-hidden="true">{mounted ? (isDark ? '◐' : '◑') : '◐'}</span>
      <span>{mounted ? (isDark ? 'dark' : 'light') : '—'}</span>
    </button>
  );
}
