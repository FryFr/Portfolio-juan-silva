import { expect, test } from '@playwright/test';

/**
 * Scroll-driven animations have one catastrophic failure mode: if they are not
 * neutralised under prefers-reduced-motion, every revealed element stays at
 * opacity 0 and the page is permanently blank for those users.
 *
 * This is not hypothetical. The global reduced-motion block in globals.css clamps
 * animation-duration to 0.01ms, which does NOT stop a progress-based timeline —
 * those are driven by scroll position, not elapsed time. They must be switched off
 * explicitly, and this suite is what proves they were.
 *
 * emulateMedia is called explicitly rather than relying on test.use({reducedMotion}),
 * which did not take effect here — and a reduced-motion suite that silently runs
 * without reduced motion is worse than no suite, because it reports green while
 * testing the wrong thing. The first assertion below guards exactly that.
 */
test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the emulation is actually in effect', async ({ page }) => {
    await page.goto('/es');
    const matches = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(
      matches,
      'reduced-motion emulation is not active; the rest of this file is meaningless',
    ).toBe(true);
  });

  test('revealed content is visible without scrolling anything', async ({ page }) => {
    await page.goto('/es');

    const revealed = page.locator('.reveal, .reveal-stagger > *');
    const count = await revealed.count();
    expect(count, 'no reveal targets found — selector or markup drifted').toBeGreaterThan(0);

    const transparent = await revealed.evaluateAll((nodes) =>
      nodes
        .map((n, i) => ({ i, opacity: getComputedStyle(n).opacity }))
        .filter((r) => Number(r.opacity) < 1),
    );
    expect(transparent, 'reveal targets are transparent under reduced motion').toEqual([]);
  });

  test('the timeline rail is fully drawn rather than waiting on scroll', async ({ page }) => {
    await page.goto('/es');

    const charge = page.locator('.timeline-charge').first();
    await expect(charge).toBeAttached();

    const scaleY = await charge.evaluate((node) => {
      const t = getComputedStyle(node).transform;
      if (t === 'none') return 1;
      return new DOMMatrixReadOnly(t).d;
    });
    expect(scaleY).toBeCloseTo(1, 2);
  });

  test('the decorative canvas is never painted', async ({ page }) => {
    await page.goto('/es');
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();

    // A canvas defaults to 300x150, so a size check proves nothing. The graph
    // bails before its resize pass under reduced motion, so the backing store is
    // still the untouched default and every pixel is fully transparent.
    const painted = await canvas.evaluate((node) => {
      const c = node as HTMLCanvasElement;
      const ctx = c.getContext('2d');
      if (!ctx) return false;
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 3; i < data.length; i += 4) {
        if ((data[i] ?? 0) !== 0) return true;
      }
      return false;
    });
    expect(painted, 'canvas was painted despite reduced motion').toBe(false);
  });

  test('stats show their final value, never a stuck zero', async ({ page }) => {
    await page.goto('/es');
    const stats = page.locator('dl dd');
    await expect(stats.first()).toBeVisible();
    expect(await stats.first().innerText()).not.toMatch(/^0\b/);
  });
});
