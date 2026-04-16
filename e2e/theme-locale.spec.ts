import { expect, test } from '@playwright/test';

test('theme toggle flips html class', async ({ page }) => {
  await page.goto('/es');
  const html = page.locator('html');
  const initial = (await html.getAttribute('class')) ?? '';

  // The button aria-label is the *next* state: if currently dark → "Cambiar a tema claro";
  // if currently light → "Cambiar a tema oscuro". Match either possibility.
  await page.getByRole('button', { name: /Cambiar a tema/i }).click();

  // Wait for next-themes to apply the class change
  await page.waitForFunction((initialClass) => {
    const cls = document.documentElement.getAttribute('class') ?? '';
    return cls !== initialClass;
  }, initial);

  const after = (await html.getAttribute('class')) ?? '';
  expect(after).not.toBe(initial);
});

test('locale switcher navigates es → en', async ({ page }) => {
  await page.goto('/es');
  // LocaleSwitcher renders <button> elements with the raw locale code (lowercase) inside the header nav.
  // Scope to the Primary navigation to avoid matching Next.js Dev Tools overlay buttons.
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await nav.getByRole('button', { name: 'en', exact: true }).click();
  await expect(page).toHaveURL(/\/en/);
});

test('locale switcher navigates en → es', async ({ page }) => {
  await page.goto('/en');
  // Scope to the Primary navigation to avoid strict-mode violations with dev overlay buttons.
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await nav.getByRole('button', { name: 'es', exact: true }).click();
  await expect(page).toHaveURL(/\/es/);
});
