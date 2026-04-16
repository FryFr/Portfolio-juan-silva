import { expect, test } from '@playwright/test';

test('es nav links route correctly', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await page.goto('/es');
  await nav.getByRole('link', { name: 'Trabajos' }).click();
  await expect(page).toHaveURL('/es/projects');

  await page.goto('/es');
  await nav.getByRole('link', { name: 'Escritos' }).click();
  await expect(page).toHaveURL('/es/blog');

  await page.goto('/es');
  await nav.getByRole('link', { name: 'Charlas' }).click();
  await expect(page).toHaveURL('/es/talks');
});

test('en nav links route correctly', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await page.goto('/en');
  await nav.getByRole('link', { name: 'Work' }).click();
  await expect(page).toHaveURL('/en/projects');

  await page.goto('/en');
  await nav.getByRole('link', { name: 'Writing' }).click();
  await expect(page).toHaveURL('/en/blog');

  await page.goto('/en');
  await nav.getByRole('link', { name: 'Talks' }).click();
  await expect(page).toHaveURL('/en/talks');
});
