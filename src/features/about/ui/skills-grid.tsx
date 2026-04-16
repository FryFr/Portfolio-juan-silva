import { getTranslations } from 'next-intl/server';
import { ABOUT_SKILL_KEYS } from '@/features/about/data';

type SkillItem = { label: string; url: string };

export async function SkillsGrid() {
  const t = await getTranslations('home.about');

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {ABOUT_SKILL_KEYS.map((key) => {
        const items = t.raw(`skills.${key}.items`) as SkillItem[];
        return (
          <div key={key} className="border-t border-[var(--bg-tertiary)] pt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              {t(`skills.${key}.label`)}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-serif text-base text-[var(--fg-secondary)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
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
  );
}
