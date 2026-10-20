/**
 * Smaller WebP copies of the pack images, so a phone frame 130 px wide doesn't
 * download a 1600 px JPEG. `scripts/pack-variants.sh` writes them next to the
 * source (`01.jpg` → `01-640w.webp`, `01-1280w.webp`); a test checks every
 * image in the manifest has them. Pure: no DOM, no React.
 */
export const VARIANT_WIDTHS = [640, 1280] as const;

/** URL of the WebP variant of `url` at `width` pixels wide. */
export function variantUrl(url: string, width: number): string {
  return `${url.replace(/\.[^./]+$/, "")}-${width}w.webp`;
}

/**
 * `srcset` with every variant narrower than the source, then the source itself
 * at its own width. Undefined when the source width is unknown.
 */
export function srcSetFor(url: string, width: number | undefined): string | undefined {
  if (!width) return undefined;
  const variants = VARIANT_WIDTHS.filter((w) => w < width).map(
    (w) => `${variantUrl(url, w)} ${w}w`,
  );
  return [...variants, `${url} ${width}w`].join(", ");
}

/**
 * CSS width an image takes in a `box` (its largest CSS size, [w, h]) with
 * `object-fit: cover`: a wider image is cut to the box height and overflows
 * sideways, so the browser needs the overflowing width to pick a sharp file.
 */
export function coverDisplayWidth(aspect: number, [w, h]: readonly [number, number]): number {
  return Math.round(aspect > w / h ? h * aspect : w);
}
