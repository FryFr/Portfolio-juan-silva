import Image from 'next/image';
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { Callout } from './callout';
import { Pre } from './pre';

// mdx/types is not available in this project (no `mdx` or `@types/mdx` package).
// React.ElementType covers both string tags and component types, making it
// a safe typed fallback for an MDX components map.
type MDXComponents = Record<string, React.ElementType>;

function MdxH2({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className="mb-4 mt-10 font-serif text-2xl text-[var(--fg-primary)]" {...props}>
      {children}
    </h2>
  );
}

function MdxH3({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className="mb-3 mt-8 font-serif text-xl text-[var(--fg-secondary)]" {...props}>
      {children}
    </h3>
  );
}

function MdxP({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="mb-4 font-sans text-base leading-relaxed text-[var(--fg-secondary)]" {...props}>
      {children}
    </p>
  );
}

function MdxUl({ children, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className="mb-4 list-disc pl-6 text-[var(--fg-secondary)] [&>li]:mb-1" {...props}>
      {children}
    </ul>
  );
}

function MdxOl({ children, ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className="mb-4 list-decimal pl-6 text-[var(--fg-secondary)] [&>li]:mb-1" {...props}>
      {children}
    </ol>
  );
}

function MdxLi({ children, ...props }: HTMLAttributes<HTMLLIElement>) {
  return (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  );
}

function MdxA({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = typeof href === 'string' && href.startsWith('http');
  return (
    <a
      href={href}
      className="underline underline-offset-4 transition-colors hover:text-[var(--accent)]"
      {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

function MdxCode({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 font-mono text-sm text-[var(--fg-primary)]"
      {...props}
    >
      {children}
    </code>
  );
}

type MdxImgProps = {
  src?: string;
  alt?: string;
};

function MdxImg({ src, alt }: MdxImgProps) {
  if (!src) return null;
  return (
    <span className="my-6 block overflow-hidden rounded">
      <Image src={src} alt={alt ?? ''} width={1200} height={675} className="rounded" />
    </span>
  );
}

export const mdxComponents: MDXComponents = {
  h2: MdxH2,
  h3: MdxH3,
  p: MdxP,
  ul: MdxUl,
  ol: MdxOl,
  li: MdxLi,
  a: MdxA,
  code: MdxCode,
  pre: Pre,
  img: MdxImg,
  Callout,
};
