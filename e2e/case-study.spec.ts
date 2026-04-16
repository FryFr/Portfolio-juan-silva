import { expect, test } from '@playwright/test';

test('projects index → detail navigation', { tag: ['@e2e', '@projects'] }, async ({ page }) => {
  await page.goto('/es/projects');

  const main = page.getByRole('main');

  // Check for empty state — skip if no projects exist
  const emptyState = main.getByText('Todavía no hay proyectos');
  const hasEmpty = await emptyState.count();
  if (hasEmpty > 0) {
    test.skip(true, 'No projects in es locale — empty state shown');
    return;
  }

  // ProjectCard renders an <article> with the title as the first <Link> inside <h3>.
  // External links (live/repo/caseStudy) come after — scoping to article.first()
  // guarantees we get the title anchor and not an external link.
  const firstArticle = main.locator('article').first();
  await expect(firstArticle).toBeVisible();

  const titleLink = firstArticle.getByRole('link').first();
  await expect(titleLink).toBeVisible();
  await titleLink.click();

  await expect(page).toHaveURL(/\/es\/projects\/[^/]+$/);

  // Back link is rendered directly in the detail page layout (not in CaseStudyHeader)
  // Text value: "← Todos los proyectos"
  await expect(page.getByRole('link', { name: /Todos los proyectos/ })).toBeVisible();
});
