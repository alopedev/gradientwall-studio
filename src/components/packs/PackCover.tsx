import { useEffect, useRef } from "react";
import type { PackCover as PackCoverType } from "@/lib/packs";
import { imageSources, PHONE_MEDIA } from "@/lib/responsive-image";
import { useWallpaperEngine } from "../studio/engine";

interface Props {
  cover: PackCoverType;
  /** Native canvas resolution (gradient kind only). Image kind reads its own. */
  w?: number;
  h?: number;
  className?: string;
  /** Load now instead of lazily: for the one image the page is built around. */
  priority?: boolean;
  /** Load now at normal priority: an image shown later that should be ready by then. */
  eager?: boolean;
  /** Pure decoration (a blurred glow): hidden from assistive tech, so it adds no extra "image" of the pack. */
  decorative?: boolean;
  /**
   * Largest CSS size of the frame the image fills ([width, height]). With it the
   * browser picks a WebP variant that size instead of the full file.
   */
  box?: readonly [number, number];
  /**
   * The same frame's largest CSS size on phones (under Tailwind's `md`), when it
   * is smaller there: phones then get a file sized for it, such as the centre crop.
   * A `vw` share when the frame follows the screen width there.
   */
  phoneBox?: readonly [number, number] | `${number}vw`;
}

/**
 * Renders a pack cover regardless of source — gradient (drawn by the wallpaper engine
 * with grain baked in, WYSIWYG with downloads) or external image. Pack pages
 * and cards both go through here, so swapping a future pack from
 * gradient-spec to a real R2 image is a single manifest change with no
 * caller updates.
 */
export function PackCover({
  cover,
  w = 720,
  h = 720,
  className,
  priority = false,
  eager = false,
  decorative = false,
  box,
  phoneBox,
}: Props) {
  if (cover.kind === "image") {
    const { src, srcSet, sizes, width, height, phoneCrop } = imageSources(cover, box, phoneBox);
    const img = (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        // React 18 has no fetchPriority prop; the lowercase attribute passes through.
        {...(priority ? { fetchpriority: "high" } : {})}
        alt={decorative ? "" : cover.alt}
        aria-hidden={decorative || undefined}
        width={width}
        height={height}
        className={className}
        loading={priority || eager ? "eager" : "lazy"}
        decoding="async"
      />
    );
    if (!phoneCrop) return img;
    return (
      <picture>
        <source
          media={PHONE_MEDIA}
          srcSet={phoneCrop.src}
          width={phoneCrop.width}
          height={phoneCrop.height}
        />
        {img}
      </picture>
    );
  }
  return <GradientCover cover={cover} w={w} h={h} className={className} decorative={decorative} />;
}

function GradientCover({
  cover,
  w,
  h,
  className,
  decorative,
}: {
  cover: Extract<PackCoverType, { kind: "gradient" }>;
  w: number;
  h: number;
  className?: string;
  decorative?: boolean;
}) {
  const engine = useWallpaperEngine();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // No `engine` field: a cover is a v1 look, drawn as the Studio draws v1 thumbnails.
    engine.paintThumbnail(
      c,
      {
        colors: cover.colors,
        style: cover.style,
        blur: cover.blur,
        grain: cover.grain,
        seed: cover.seed,
      },
      { w, h },
    );
  }, [engine, cover, w, h]);
  return <canvas ref={ref} className={className} aria-hidden={decorative || undefined} />;
}
