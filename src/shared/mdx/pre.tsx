import type { HTMLAttributes } from 'react';

type PreProps = HTMLAttributes<HTMLPreElement>;

export function Pre({ className, children, ...props }: PreProps) {
  return (
    <pre
      className={`my-6 overflow-x-auto rounded border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed ${className ?? ''}`}
      {...props}
    >
      {children}
    </pre>
  );
}
