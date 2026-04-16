import { expect, test } from '@playwright/test';

test('es home: canonical, og:locale, JSON-LD Person + ProfilePage', async ({ page }) => {
  await page.goto('/es');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'profile');

  const ldTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = ldTexts.join('\n');
  expect(joined).toContain('"@type":"Person"');
  expect(joined).toContain('"@type":"ProfilePage"');
  expect(joined).toContain('"inLanguage":"es"');
});

test('en home: canonical, og:locale, JSON-LD Person + ProfilePage', async ({ page }) => {
  await page.goto('/en');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en');

  const ldTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = ldTexts.join('\n');
  expect(joined).toContain('"@type":"Person"');
  expect(joined).toContain('"@type":"ProfilePage"');
  expect(joined).toContain('"inLanguage":"en"');
});
