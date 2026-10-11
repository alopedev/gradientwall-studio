import { X } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef } from "react";
import { activeColors, ALL_ACTIVE, DEFAULT_LIGHT_ANGLE, engineOf } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { type FavoriteItem, useFavoritesStore } from "@/store/useFavoritesStore";
import { useWallpaperEngine } from "../engine";
import { useRequestReveal } from "./reveal";

const THUMB_W = 44;
const THUMB_H = 76;
/** Canvas resolution is 2× the CSS size so thumbnails stay sharp on Retina. */
const SCALE = 2;

interface Props {
  item: FavoriteItem;
}

/**
 * One saved wallpaper: a small render of its config. Tap loads it into the
 * stage, drag reorders, ✕ removes. The chip that matches the stage shows a
 * gold outline.
 */
export function FavoriteThumbnail({ item }: Props) {
  const engine = useWallpaperEngine();
  const unpin = useFavoritesStore((s) => s.unpin);
  const controls = useDragControls();
  const requestReveal = useRequestReveal();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = item;
  const active = config.active ?? ALL_ACTIVE;

  const currentSeed = useConfigStore((s) => s.seed);
  const currentColors = useConfigStore((s) => s.colors);
  const isCurrent =
    currentSeed === config.seed && currentColors.join(",") === config.colors.join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    engine.paintThumbnail(
      canvas,
      {
        engine: engineOf(config),
        colors: activeColors(config.colors, config.active ?? ALL_ACTIVE),
        style: config.style,
        blur: config.blur,
        grain: config.grain,
        seed: config.seed,
        lightAngle: config.lightAngle,
        density: config.density,
        contrast: config.contrast,
        vibrance: config.vibrance,
      },
      { w: THUMB_W * SCALE, h: THUMB_H * SCALE },
    );
  }, [engine, config]);

  const load = (from: Element) => {
    requestReveal(from);
    useConfigStore.setState({
      engine: engineOf(config),
      colors: [...config.colors] as FavoriteItem["config"]["colors"],
      active: [...active] as NonNullable<FavoriteItem["config"]["active"]>,
      style: config.style,
      blur: config.blur,
      grain: config.grain,
      seed: config.seed,
      lightAngle: config.lightAngle ?? DEFAULT_LIGHT_ANGLE,
      density: config.density ?? 0.5,
      contrast: config.contrast ?? 1,
      vibrance: config.vibrance ?? 1,
    });
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="gw-reveal-on-scroll group relative shrink-0"
      style={{ width: THUMB_W, height: THUMB_H, scrollSnapAlign: "start" }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        onClick={(e) => load(e.currentTarget)}
        aria-current={isCurrent}
        aria-label={`Load favorite wallpaper from ${new Date(item.createdAt).toLocaleString()}`}
        className={`relative block size-full cursor-grab overflow-hidden rounded-lg bg-black outline-none transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-95 active:cursor-grabbing [@media(hover:hover)]:hover:-translate-y-[3px] ${
          isCurrent
            ? "shadow-[0_0_0_2px_#0b0b0d,0_0_0_4px_var(--color-gold)]"
            : "shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_6px_14px_-6px_rgba(0,0,0,0.7)]"
        }`}
      >
        <canvas ref={canvasRef} className="block size-full object-cover" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          unpin(item.id);
        }}
        aria-label="Remove from favorites"
        className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 opacity-0 outline-none transition-opacity duration-150 hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-gold group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X className="size-3" aria-hidden />
      </button>
    </Reorder.Item>
  );
}
