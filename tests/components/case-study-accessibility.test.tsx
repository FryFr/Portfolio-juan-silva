import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { allProjects } from '@/content-collections';
import { CaseStudyHeader } from '@/features/case-study/ui/case-study-header';
import { CaseStudyNav } from '@/features/case-study/ui/case-study-nav';
import { CursorContext } from '@/features/cursor/context/use-cursor';
import en from '@/messages/en.json';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: keyof typeof en.projects.detail) => en.projects.detail[key],
}));

afterEach(() => vi.restoreAllMocks());

const project = allProjects.find((item) => item.locale === 'en');
if (!project) throw new Error('Missing project fixture');

it('keeps the real header accessible and schedules no animation with reduced motion', async () => {
  // Exercise the real Motion hook and pointer detection; do not mock the gate.
  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => true,
  }));
  const frame = vi.spyOn(window, 'requestAnimationFrame');
  const observer = vi.spyOn(window, 'IntersectionObserver');
  const user = userEvent.setup();
  const { container } = render(
    <CursorContext.Provider
      value={{ current: { x: 100, y: 100, velocityX: 10, velocityY: 10, speed: 20 } }}
    >
      {
        await CaseStudyHeader({
          project: {
            ...project,
            links: {
              live: 'https://example.com/live',
              repo: 'https://example.com/repo',
              caseStudy: 'https://example.com/case',
            },
          },
        })
      }
    </CursorContext.Provider>,
  );
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion)');
  expect(matchMedia).toHaveBeenCalledWith('(pointer: coarse)');
  const heading = screen.getByRole('heading', { level: 1, name: project.title });
  expect(heading).toBeVisible();
  expect(heading.children).toHaveLength(0);
  expect(screen.getByText(project.summary)).toBeVisible();
  expect(container.querySelector('.reveal-text')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  for (const name of [
    en.projects.detail.live,
    en.projects.detail.repo,
    en.projects.detail.caseStudy,
  ]) {
    await user.tab();
    expect(screen.getByRole('link', { name })).toHaveFocus();
  }
  expect(frame).not.toHaveBeenCalled();
  expect(observer).not.toHaveBeenCalled();
});

it('exposes adjacent projects in keyboard order with localized names and destinations', async () => {
  const user = userEvent.setup();
  render(
    await CaseStudyNav({
      locale: 'en',
      prev: project,
      next: { ...project, slug: 'next', title: 'Next case' },
    }),
  );
  const nav = screen.getByRole('navigation');
  const links = within(nav).getAllByRole('link');
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAccessibleName(`${en.projects.detail.prev} ${project.title}`);
  expect(links[0]).toHaveAttribute('href', `/en/projects/${project.slug}`);
  expect(links[1]).toHaveAccessibleName(`${en.projects.detail.next} Next case`);
  expect(links[1]).toHaveAttribute('href', '/en/projects/next');
  await user.tab();
  expect(links[0]).toHaveFocus();
  await user.tab();
  expect(links[1]).toHaveFocus();
  await user.tab({ shift: true });
  expect(links[0]).toHaveFocus();
});

it('omits adjacent navigation when there are no neighbors', async () => {
  const { container } = render(
    await CaseStudyNav({ locale: 'en', prev: undefined, next: undefined }),
  );
  expect(container).toBeEmptyDOMElement();
});
