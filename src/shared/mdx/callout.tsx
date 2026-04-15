import type { ReactNode } from 'react';

type Variant = 'note' | 'warning' | 'tip';

type CalloutProps = {
  variant?: Variant;
  children: ReactNode;
};

const variantStyles: Record<Variant, { border: string; label: string }> = {
  note: {
    border: 'border-l-[var(--fg-tertiary)]',
    label: 'Note',
  },
  warning: {
    border: 'border-l-[var(--accent-warn)]',
    label: 'Warning',
  },
  tip: {
    border: 'border-l-[var(--accent-success)]',
    label: 'Tip',
  },
};

export function Callout({ variant = 'note', children }: CalloutProps) {
  const styles = variantStyles[variant];

  return (
    <aside
      role="note"
      className={`my-6 border-l-4 bg-[var(--bg-secondary)] px-4 py-3 ${styles.border}`}
    >
      <span className="sr-only">{styles.label}: </span>
      <p
        aria-hidden="true"
        className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]"
      >
        {styles.label}
      </p>
      <div className="text-sm text-[var(--fg-secondary)] [&>p]:m-0">{children}</div>
    </aside>
  );
}
