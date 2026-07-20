import type { HTMLAttributes } from 'react';

type PreProps = HTMLAttributes<HTMLPreElement>;

export function Pre({ className, children, ...props }: PreProps) {
  // The scroll container is a <section> with an accessible name, which carries an
  // implicit role="region" without an explicit role attribute.
  //
  // tabIndex is required here, not optional: overflow-x-auto creates a scrollable
  // region, and without a tab stop a keyboard user cannot scroll it at all — any
  // code wider than the container is unreachable for them. That is axe's
  // scrollable-region-focusable (serious). Biome's noNoninteractiveTabindex is a
  // heuristic against stray tab stops; here the tab stop is the accommodation.
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG requires a scrollable region to be keyboard focusable; see axe scrollable-region-focusable
      tabIndex={0}
      aria-label="Code block"
      className="my-6 overflow-x-auto rounded border border-border bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <pre className={`px-4 py-3 font-mono text-sm leading-relaxed ${className ?? ''}`} {...props}>
        {children}
      </pre>
    </section>
  );
}
