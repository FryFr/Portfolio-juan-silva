import { expect, test } from '@playwright/test';

test('es home renders hero and contact', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: 'Juan Silva.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Hablamos?' })).toBeVisible();
});

test('en home renders hero and contact', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'Juan Silva.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Let's talk" })).toBeVisible();
});
