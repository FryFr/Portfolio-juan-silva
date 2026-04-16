import { expect, test } from '@playwright/test';

test('floating WA visible on es locale', async ({ page }) => {
  await page.goto('/es');
  const wa = page.getByRole('link', {
    name: 'Abrir conversación por WhatsApp',
  });
  await expect(wa).toBeVisible();
  await expect(wa).toHaveAttribute('target', '_blank');
  await expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
});

test('floating WA links to WhatsApp with pre-filled message', async ({ page }) => {
  await page.goto('/es');
  const wa = page.getByRole('link', {
    name: 'Abrir conversación por WhatsApp',
  });
  const href = await wa.getAttribute('href');
  expect(href).toContain('wa.me/');
});

test('floating WA visible on en locale', async ({ page }) => {
  await page.goto('/en');
  const wa = page.getByRole('link', {
    name: 'Open WhatsApp conversation',
  });
  await expect(wa).toBeVisible();
});

test('floating WA is always visible (no dismiss button)', async ({ page }) => {
  await page.goto('/es');
  const wa = page.getByRole('link', {
    name: 'Abrir conversación por WhatsApp',
  });
  await expect(wa).toBeVisible();
  // No dismiss button should exist
  await expect(
    page.locator('button').filter({ hasText: /ocultar|hide|cerrar|close/i }),
  ).toHaveCount(0);
});
