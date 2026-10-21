export function assertUniqueIds(items: readonly { id: string }[]): void {
  const ids = new Set<string>();
  for (const { id } of items) {
    if (!id.trim() || ids.has(id)) throw new Error(`Invalid or duplicate visualization id: ${id}`);
    ids.add(id);
  }
}

/** Reject executable schemes, protocol-relative URLs and ambiguous backslashes. */
export function safeSourceHref(href: string): string | undefined {
  if (/[\s\\]/.test(href)) return undefined;
  if (/^\/(?!\/)/.test(href) || /^#[^#]+$/.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
