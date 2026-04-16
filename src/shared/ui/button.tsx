import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'ghost' | 'link';
type Size = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantMap: Record<Variant, string> = {
  primary: 'bg-[var(--fg-primary)] text-[var(--bg-primary)] hover:bg-[var(--fg-secondary)]',
  ghost: 'bg-transparent text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]',
  link: 'bg-transparent text-[var(--fg-primary)] underline-offset-4 hover:underline',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-none font-mono uppercase tracking-[0.15em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    />
  );
}
