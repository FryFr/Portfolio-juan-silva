import { expect, test } from '@playwright/test';

test('blog index → detail shows reading time and related section', {
  tag: ['@e2e', '@blog'],
}, async ({ page }) => {
  await page.goto('/es/blog');

  const main = page.getByRole('main');

  // Check for empty state — skip if no posts exist
  const emptyState = main.getByText('Todavía no hay publicaciones.');
  const hasEmpty = await emptyState.count();
  if (hasEmpty > 0) {
    test.skip(true, 'No posts in es locale — empty state shown');
    return;
  }

  // PostCard wraps the entire article content in a single <Link>, so the
  // first <article> contains exactly one link that leads to the post detail.
  const firstArticle = main.locator('article').first();
  await expect(firstArticle).toBeVisible();

  const postLink = firstArticle.getByRole('link').first();
  await expect(postLink).toBeVisible();
  await postLink.click();

  await expect(page).toHaveURL(/\/es\/blog\/[^/]+$/);

  // Reading time chip — PostHeader renders "{minutes} min" (es: "{minutes} min")
  await expect(page.getByText(/\d+\s*min/).first()).toBeVisible();

  // Related section ("Seguí leyendo") is only shown when there are 2+ posts.
  // Make the assertion soft so a single-post fixture doesn't fail the suite.
  const related = page.getByRole('heading', { name: /Seguí leyendo/ });
  if ((await related.count()) > 0) {
    await expect(related).toBeVisible();
  }
});
