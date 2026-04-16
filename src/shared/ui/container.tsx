import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'narrow' | 'default' | 'wide';
};

const sizeMap = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
} as const;

export function Container({ size = 'default', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-6 md:px-8', sizeMap[size], className)} {...props} />;
}
