import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TagProps = HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-[var(--fg-muted)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)]',
        className,
      )}
      {...props}
    />
  );
}
