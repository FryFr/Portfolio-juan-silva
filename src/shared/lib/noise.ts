/**
 * Compact 2D value noise with a fixed permutation table.
 *
 * Hand-rolled rather than pulled from a package: the generative fields need one
 * smooth 2D function and nothing else, and a noise dependency would cost more
 * bytes than the whole visual layer it serves.
 *
 * Deterministic by seed, so a field looks the same on every load rather than
 * reshuffling between visits.
 */
export function makeNoise2D(seed = 1337): (x: number, y: number) => number {
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const a = perm[i];
    const b = perm[j];
    if (a !== undefined && b !== undefined) {
      perm[i] = b;
      perm[j] = a;
    }
  }

  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255] ?? 0;

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (hash: number, x: number, y: number) => (hash & 1 ? -x : x) + (hash & 2 ? -y : y);

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const X = xi & 255;
    const Y = yi & 255;
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);

    const aa = p[(p[X] ?? 0) + Y] ?? 0;
    const ab = p[(p[X] ?? 0) + Y + 1] ?? 0;
    const ba = p[(p[X + 1] ?? 0) + Y] ?? 0;
    const bb = p[(p[X + 1] ?? 0) + Y + 1] ?? 0;

    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
}
