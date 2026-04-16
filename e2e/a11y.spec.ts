import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/es', '/en', '/es/projects', '/es/blog', '/es/talks'] as const;

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .exclude('#__next-build-watcher, [data-nextjs-toast], nextjs-portal')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });
}
