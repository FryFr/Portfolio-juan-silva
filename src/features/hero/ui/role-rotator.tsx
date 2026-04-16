'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

type Props = {
  phrases: string[];
  intervalMs?: number;
};

export function RoleRotator({ phrases, intervalMs = 2400 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phrases.length, intervalMs]);

  const current = phrases[index] ?? phrases[0] ?? '';

  return (
    <span className="relative inline-block min-h-[1.2em] align-baseline" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-block text-[var(--accent)]"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
