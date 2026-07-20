import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  children: ReactNode;
  as?: 'p' | 'h2' | 'h3' | 'span' | 'div';
  className?: string;
};

/**
 * The small mono label above a section.
 *
 * Previously hand-rolled at every call site in five near-identical shapes
 * (10px/0.15em, 10px/0.2em, 11px/0.15em, two different colour tokens). Sizing and
 * tracking now come from the --text-eyebrow token so they cannot drift again.
 */
export function Eyebrow({ children, as: Tag = 'p', className }: Props) {
  return (
    <Tag className={cn('font-mono text-eyebrow uppercase text-muted', className)}>{children}</Tag>
  );
}
