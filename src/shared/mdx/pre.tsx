import type { HTMLAttributes } from 'react';

type PreProps = HTMLAttributes<HTMLPreElement>;

export function Pre({ className, children, ...props }: PreProps) {
  return (
    <pre
      className={`my-6 overflow-x-auto rounded border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] px-4 py-3 font-mono text-sm leading-relaxed ${className ?? ''}`}
      {...props}
    >
      {children}
    </pre>
  );
}
