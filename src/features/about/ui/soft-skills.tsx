import { getTranslations } from 'next-intl/server';

type SoftSkill = { label: string; description: string };

export async function SoftSkills() {
  const t = await getTranslations('home.about');
  const skills = t.raw('softSkills') as SoftSkill[];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <div key={skill.label} className="border-t border-[var(--bg-tertiary)] pt-4">
          <h4 className="font-mono text-sm font-medium text-[var(--fg-primary)]">{skill.label}</h4>
          <p className="mt-2 font-serif text-sm leading-relaxed text-[var(--fg-tertiary)]">
            {skill.description}
          </p>
        </div>
      ))}
    </div>
  );
}
