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
      // No aria-label. An aria-label REPLACES the accessible name, so the visible
      // word "light" was not part of it — a voice-control user saying "click
      // light" matched nothing. WCAG 2.5.3 Label in Name requires the accessible
      // name to contain the visible text, so the visible word stays in the name
      // and the extra context is appended in a screen-reader-only span.
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-8 items-center gap-2 px-2 font-mono text-eyebrow uppercase text-subtle transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      <span aria-hidden="true">{mounted ? (isDark ? '◐' : '◑') : '◐'}</span>
      <span>{mounted ? (isDark ? 'dark' : 'light') : '—'}</span>
      <span className="sr-only">{nextLabel}</span>
    </button>
  );
}
