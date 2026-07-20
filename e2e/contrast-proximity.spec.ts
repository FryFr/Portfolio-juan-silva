import { expect, test } from '@playwright/test';

/**
 * Regression suite for the cursor-proximity invisible-text bug.
 *
 * The original ProximityReveal interpolated el.style.color toward a hardcoded
 * rgb(245,241,234) — the literal value of --bg-primary in light mode. Moving the
 * cursor toward body copy faded it to exactly the page background: 1:1 contrast.
 *
 * axe and Lighthouse both missed it, and they were right to by their own rules:
 * they evaluate computed styles at rest, and this colour was written by a
 * requestAnimationFrame loop only while the pointer was nearby. A static audit
 * cannot see a colour that only exists mid-interaction. Hence a real pointer.
 */

const AA_NORMAL_TEXT = 4.5;

type Rgb = [number, number, number];

/**
 * Resolve any CSS colour to sRGB inside the page.
 *
 * getComputedStyle returns color-mix(in oklab, ...) as an oklab() value, which no
 * amount of regex will turn into channels. Canvas accepts every CSS colour syntax
 * the browser understands and hands back the sRGB bytes it would actually paint —
 * which is precisely what a human eye receives, and therefore what WCAG is about.
 */
const TO_RGB = `(value) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}`;

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`proximity reveal contrast — ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test('body copy stays above WCAG AA with the cursor on it', async ({ page }) => {
      await page.goto('/es');

      // .reveal-text is applied only once the mount gate confirms a fine pointer,
      // so its presence also proves the SSR/hydration gate resolved correctly.
      const target = page.locator('.reveal-text').first();
      await expect(target).toBeVisible();

      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;

      // Park the pointer dead centre — peak intensity, the worst case.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect
        .poll(async () => target.evaluate((el) => el.style.getPropertyValue('--reveal')))
        .not.toBe('');

      const { color, background } = await target.evaluate((el, toRgbSrc) => {
        const toRgb = eval(toRgbSrc) as (v: string) => [number, number, number];
        return {
          color: toRgb(getComputedStyle(el).color),
          background: toRgb(getComputedStyle(document.body).backgroundColor),
        };
      }, TO_RGB);

      const ratio = contrastRatio(color, background);
      expect(
        ratio,
        `text rgb(${color}) on rgb(${background}) = ${ratio.toFixed(2)}:1, below AA`,
      ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    test('never resolves to the page background colour', async ({ page }) => {
      await page.goto('/es');

      const target = page.locator('.reveal-text').first();
      await expect(target).toBeVisible();

      const box = await target.boundingBox();
      if (!box) return;

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect
        .poll(async () => target.evaluate((el) => el.style.getPropertyValue('--reveal')))
        .not.toBe('');

      const { color, background } = await target.evaluate((el) => ({
        color: getComputedStyle(el).color,
        background: getComputedStyle(document.body).backgroundColor,
      }));

      expect(color).not.toBe(background);
    });
  });
}
