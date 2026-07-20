import { getTranslations } from 'next-intl/server';

/**
 * Was six cards, each with an ~11-word description — 75 words of prose that read
 * as filler and sat in the least visually anchored part of the page. Soft skills
 * are a list; treating them as a list is honest and costs a fifth of the space.
 */
export async function SoftSkills() {
  const t = await getTranslations('home.about');
  const skills = t.raw('softSkills') as string[];

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-3">
      {skills.map((skill) => (
        <li
          key={skill}
          className="border border-border px-3 py-1.5 font-mono text-eyebrow uppercase text-subtle"
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}
