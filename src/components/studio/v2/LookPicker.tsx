import { useEffect, useRef } from "react";
import { pixelKey } from "@/lib/fitted-canvas";
import type { RenderParams } from "@/lib/palettes";
import { useConfigStore, useRenderParams } from "@/store";
import { type LookOption, useWallpaperEngine } from "../engine";

/** Tile canvas in pixels: 2× its CSS size, so the materials read on any screen. */
const TILE = { w: 180, h: 240 };

function LookTile({
  option,
  params,
  selected,
}: {
  option: LookOption;
  params: RenderParams;
  selected: boolean;
}) {
  const engine = useWallpaperEngine();
  const ref = useRef<HTMLCanvasElement>(null);
  const tileParams = { ...params, style: option.style, material: option.material };
  const key = pixelKey(tileParams, "v2");
  // `key` names what reaches the pixels: the current palette, seed, grain and turn in this look.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the trigger, the params are read whole
  useEffect(() => {
    if (ref.current) engine.paintThumbnail(ref.current, tileParams, TILE);
  }, [engine, key]);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => useConfigStore.setState({ style: option.style, material: option.material })}
      className="group grid min-w-0 gap-1.5 rounded-sharp text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <canvas
        ref={ref}
        aria-hidden
        className={`block aspect-[3/4] w-full rounded-sharp bg-bg-2 transition-[outline-color,transform] duration-200 [@media(hover:hover)]:group-hover:-translate-y-0.5 ${
          selected ? "outline-2 outline-offset-2 outline-ink outline" : "outline-transparent"
        }`}
      />
      <span
        className={`font-sans text-[0.8rem] font-medium ${selected ? "text-ink" : "text-ink-dim"}`}
      >
        {option.label}
      </span>
    </button>
  );
}

/**
 * The Studio's one Style picker: each look (a style, maybe under a material)
 * as a live thumbnail in the current colours, so the difference shows without
 * reading the names (Àlex chose this layout, B, on 2026-10-31).
 */
export function LookPicker({ options }: { options: readonly LookOption[] }) {
  const params = useRenderParams();
  const material = params.material ?? "none";
  return (
    <fieldset aria-label="Style" className="m-0 grid grid-cols-3 gap-x-2 gap-y-2.5 border-0 p-0">
      {options.map((o) => (
        <LookTile
          key={o.id}
          option={o}
          params={params}
          selected={o.style === params.style && o.material === material}
        />
      ))}
    </fieldset>
  );
}
