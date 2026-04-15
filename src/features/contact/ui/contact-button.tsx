import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'whatsapp' | 'linkedin';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
  variant: Variant;
  href: string;
  label: string;
  icon?: ReactNode;
};

const variantMap: Record<Variant, string> = {
  whatsapp:
    'bg-[var(--fg-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-[var(--bg-primary)]',
  linkedin:
    'border border-[var(--bg-tertiary)] bg-transparent text-[var(--fg-primary)] hover:border-[var(--fg-primary)]',
};

export function ContactButton({ variant, href, label, icon, className, ...rest }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-12 items-center justify-center gap-3 px-6 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        variantMap[variant],
        className,
      )}
      {...rest}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
    </a>
  );
}
