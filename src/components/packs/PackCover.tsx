import { useEffect, useRef } from "react";
import { paintWallpaper } from "@/lib/download/compose";
import type { PackCover as PackCoverType } from "@/lib/packs";

interface Props {
  cover: PackCoverType;
  /** Native canvas resolution (gradient kind only). Image kind reads its own. */
  w?: number;
  h?: number;
  className?: string;
  /** Forwarded to <img alt=""> when kind=image; ignored for gradients. */
  imgAlt?: string;
}

/**
 * Renders a pack cover regardless of source — gradient (drawn via the engine
 * with grain baked in, WYSIWYG with downloads) or external image. Pack pages
 * and cards both go through here, so swapping a future pack from
 * gradient-spec to a real R2 image is a single manifest change with no
 * caller updates.
 */
export function PackCover({ cover, w = 720, h = 720, className }: Props) {
  if (cover.kind === "image") {
    return <img src={cover.url} alt={cover.alt} className={className} loading="lazy" decoding="async" />;
  }
  return <GradientCover cover={cover} w={w} h={h} className={className} />;
}

function GradientCover({
  cover,
  w,
  h,
  className,
}: {
  cover: Extract<PackCoverType, { kind: "gradient" }>;
  w: number;
  h: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    paintWallpaper(c, {
      w,
      h,
      colors: cover.colors,
      style: cover.style,
      blur: cover.blur,
      grain: cover.grain,
      seed: cover.seed,
    });
  }, [cover, w, h]);
  return <canvas ref={ref} className={className} />;
}
