import { getTranslations } from 'next-intl/server';
import { ABOUT_SKILL_KEYS } from '@/features/about/data';
import { type GraphCategory, SignalGraph } from '@/features/about/ui/signal-graph';

type SkillItem = { label: string; url: string };

export async function SkillsGrid() {
  const t = await getTranslations('home.about');

  const categories: GraphCategory[] = ABOUT_SKILL_KEYS.map((key) => ({
    key,
    label: t(`skills.${key}.label`),
    items: (t.raw(`skills.${key}.items`) as SkillItem[]).map((i) => i.label),
  }));

  return (
    <div className="relative">
      {/* Decorative layer. The list below is the content and stands alone. */}
      <SignalGraph categories={categories} />

      <div className="reveal-stagger relative grid grid-cols-1 gap-8 md:grid-cols-2">
        {ABOUT_SKILL_KEYS.map((key, i) => {
          const items = t.raw(`skills.${key}.items`) as SkillItem[];
          return (
            <div
              key={key}
              style={{ '--i': i } as React.CSSProperties}
              className="border-t border-border pt-6"
            >
              <h4 className="flex items-center gap-2 font-mono text-eyebrow uppercase text-muted">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                />
                {t(`skills.${key}.label`)}
              </h4>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-sans text-base text-body underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-accent hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
