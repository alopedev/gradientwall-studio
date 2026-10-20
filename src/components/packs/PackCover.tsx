import { useEffect, useRef } from "react";
import type { PackCover as PackCoverType } from "@/lib/packs";
import { coverDisplayWidth, srcSetFor } from "@/lib/responsive-image";
import { useWallpaperEngine } from "../studio/engine";

interface Props {
  cover: PackCoverType;
  /** Native canvas resolution (gradient kind only). Image kind reads its own. */
  w?: number;
  h?: number;
  className?: string;
  /** Load now instead of lazily: for the one image the page is built around. */
  priority?: boolean;
  /** Pure decoration (a blurred glow): hidden from assistive tech, so it adds no extra "image" of the pack. */
  decorative?: boolean;
  /**
   * Largest CSS size of the frame the image fills ([width, height]). With it the
   * browser picks a WebP variant that size instead of the full file.
   */
  box?: readonly [number, number];
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
  decorative = false,
  box,
}: Props) {
  if (cover.kind === "image") {
    const srcSet = box && srcSetFor(cover.url, cover.width);
    const sizes =
      srcSet && box && cover.width && cover.height
        ? `${coverDisplayWidth(cover.width / cover.height, box)}px`
        : undefined;
    return (
      <img
        src={cover.url}
        srcSet={srcSet}
        sizes={sizes}
        // React 18 has no fetchPriority prop; the lowercase attribute passes through.
        {...(priority ? { fetchpriority: "high" } : {})}
        alt={decorative ? "" : cover.alt}
        aria-hidden={decorative || undefined}
        width={cover.width}
        height={cover.height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
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
