import type { ElementType, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger children instead of animating this element as one block. */
  stagger?: boolean;
};

/**
 * Scroll-driven reveal. A SERVER component — this is the argument for CSS
 * scroll-driven animations over Motion's whileInView.
 *
 * whileInView would require 'use client' on every animated component, which here
 * means Hero, About, ProjectsGrid and ContactSection — all of which call
 * getTranslations on the server. Adopting it would push next-intl's server API
 * across the client boundary for the sake of a fade. This costs zero client
 * components and zero kilobytes, and it runs on the compositor rather than
 * competing with hydration on the main thread.
 */
export function Reveal({ children, as: Tag = 'div', className, stagger = false }: Props) {
  return <Tag className={cn(stagger ? 'reveal-stagger' : 'reveal', className)}>{children}</Tag>;
}
