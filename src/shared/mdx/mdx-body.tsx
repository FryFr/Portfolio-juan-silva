'use client';

import { useMDXComponent } from '@content-collections/mdx/react';
import { mdxComponents } from './components';

type Props = { code: string };

export function MdxBody({ code }: Props) {
  const Component = useMDXComponent(code);
  return <Component components={mdxComponents as never} />;
}
