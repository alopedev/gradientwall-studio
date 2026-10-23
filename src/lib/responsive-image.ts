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

/**
 * Centre crop of a landscape pack image at a phone's shape, written by
 * `scripts/pack-variants.sh` (`01.jpg` → `01-phone.webp`). A catalog phone
 * shows only that middle strip, so it skips the 1280 px landscape file.
 */
export const PHONE_CROP = { width: 480, height: 900 } as const;

export function phoneCropUrl(url: string): string {
  return `${url.replace(/\.[^./]+$/, "")}-phone.webp`;
}

/**
 * The crop to use for an image in `box` ([w, h] CSS px), or null when the
 * crop doesn't fit: a portrait file, the desktop half of a phone + desktop
 * pair (it has a phone file of its own, so no crop is written), a box wider
 * than the crop's shape, or a box so tall the crop would be soft at 2×.
 */
export function phoneCropFor(
  img: { url: string; width?: number; height?: number },
  [w, h]: readonly [number, number],
): { url: string; width: number; height: number } | null {
  if (!img.width || !img.height || img.width <= img.height) return null;
  if (/-desktop\.\w+$/.test(img.url)) return null;
  if (img.height < PHONE_CROP.height || img.width < PHONE_CROP.width) return null;
  if (w / h > PHONE_CROP.width / PHONE_CROP.height || h * 2 > PHONE_CROP.height) return null;
  return { url: phoneCropUrl(img.url), ...PHONE_CROP };
}
