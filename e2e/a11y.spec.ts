import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Index routes plus one detail route of each kind. Detail pages were previously
// unaudited, which meant the case-study, blog and talk templates — three of the
// four page layouts on the site — had no accessibility coverage at all.
const routes = [
  '/es',
  '/en',
  '/es/projects',
  '/es/blog',
  '/es/talks',
  '/es/projects/n8n-automations',
  '/es/blog/de-mecatronica-a-ia',
  '/es/talks/manageengine-partner-training-2025',
] as const;

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    // 'load', not 'networkidle'. Next prefetches every in-viewport link, so on a
    // page with this many links the network never goes quiet for the 500ms
    // networkidle requires and the run times out instead of reporting anything.
    // Playwright's own docs discourage networkidle for this exact reason.
    await page.goto(route, { waitUntil: 'load' });
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    const results = await new AxeBuilder({ page })
      .exclude('#__next-build-watcher, [data-nextjs-toast], nextjs-portal')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    // Moderate is included deliberately. Filtering to serious+critical let two real
    // WCAG failures ship: the theme toggle's accessible name did not contain its
    // visible text (2.5.3 Label in Name — voice control could not target it), and
    // the projects index skipped h1 -> h3. A Lighthouse run found both; this gate
    // did not, because it was only ever looking at two thirds of the output.
    const blocking = results.violations.filter(
      (v) => v.impact === 'moderate' || v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
