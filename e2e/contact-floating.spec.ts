import { expect, test } from '@playwright/test';

test('floating WA visible and dismissible', async ({ page }) => {
  await page.goto('/es');
  const wa = page.getByRole('link', { name: 'Abrir conversación por WhatsApp' });
  await expect(wa).toBeVisible();

  await page.getByRole('button', { name: 'Ocultar botón de WhatsApp' }).click();
  await expect(wa).toBeHidden();
});

test('floating WA stays hidden after reload in same session', async ({ page }) => {
  await page.goto('/es');
  await page.getByRole('button', { name: 'Ocultar botón de WhatsApp' }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Abrir conversación por WhatsApp' })).toBeHidden();
});

test('floating WA visible on en locale', async ({ page }) => {
  await page.goto('/en');
  const wa = page.getByRole('link', { name: 'Open WhatsApp conversation' });
  await expect(wa).toBeVisible();

  await page.getByRole('button', { name: 'Hide WhatsApp button' }).click();
  await expect(wa).toBeHidden();
});
