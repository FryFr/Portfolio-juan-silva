import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TagProps = HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-muted px-2 py-0.5 font-mono text-eyebrow uppercase text-subtle',
        className,
      )}
      {...props}
    />
  );
}
