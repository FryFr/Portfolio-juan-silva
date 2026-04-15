import { getTranslations } from 'next-intl/server';
import { ABOUT_SKILL_KEYS } from '@/features/about/data';

export async function SkillsGrid() {
  const t = await getTranslations('home.about');

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {ABOUT_SKILL_KEYS.map((key) => {
        const items = t.raw(`skills.${key}.items`) as string[];
        return (
          <div key={key} className="border-t border-[var(--bg-tertiary)] pt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              {t(`skills.${key}.label`)}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {items.map((item) => (
                <li key={item} className="font-serif text-base text-[var(--fg-secondary)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
