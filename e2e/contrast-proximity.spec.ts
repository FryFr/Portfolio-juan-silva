import { expect, type Locator, type Page, test } from '@playwright/test';

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
 * Read the element's text colour and the page background, both resolved to sRGB
 * inside the browser.
 *
 * getComputedStyle returns color-mix(in oklab, ...) as an oklab() value, which no
 * amount of regex will turn into channels. Canvas accepts every CSS colour syntax
 * the browser understands and hands back the sRGB bytes it would actually paint —
 * which is precisely what a human eye receives, and therefore what WCAG is about.
 */
function readColours(target: Locator): Promise<{ color: Rgb; background: Rgb }> {
  return target.evaluate((el) => {
    const toRgb = (value: string): [number, number, number] => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d canvas context');
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
    };
    return {
      color: toRgb(getComputedStyle(el).color),
      background: toRgb(getComputedStyle(document.body).backgroundColor),
    };
  });
}

/**
 * Scroll the first reveal target into view and park the cursor on it.
 *
 * The scroll is not incidental. Since the hero became a full-viewport section the
 * body copy sits below the fold, and the effect is gated by an IntersectionObserver
 * — off-screen, the rAF loop early-returns and never publishes --reveal, so the
 * assertions would pass or fail for reasons unrelated to contrast.
 */
async function focusRevealTarget(page: Page): Promise<Locator> {
  // .reveal-text is applied only once the mount gate confirms a fine pointer, so
  // its presence also proves the SSR/hydration gate resolved correctly.
  const target = page.locator('.reveal-text').first();
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();

  const box = await target.boundingBox();
  expect(box, 'reveal target has no layout box').not.toBeNull();
  if (!box) throw new Error('unreachable');

  // Park the pointer dead centre — peak intensity, the worst case.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect
    .poll(async () => target.evaluate((el) => el.style.getPropertyValue('--reveal')))
    .not.toBe('');

  return target;
}

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

      const target = await focusRevealTarget(page);
      const { color, background } = await readColours(target);

      const ratio = contrastRatio(color, background);
      expect(
        ratio,
        `text rgb(${color}) on rgb(${background}) = ${ratio.toFixed(2)}:1, below AA`,
      ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    test('never resolves to the page background colour', async ({ page }) => {
      await page.goto('/es');

      const target = await focusRevealTarget(page);
      const { color, background } = await readColours(target);

      expect(color.join(',')).not.toBe(background.join(','));
    });
  });
}
