import { RotateCcw, Shuffle as ShuffleIcon, SlidersHorizontal } from "lucide-react";
import { useId } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassSlider } from "@/components/ui/shadcn/glass-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { remixWallpaper, useConfigStore, useRenderParams } from "@/store";
import { useWallpaperEngine } from "../engine";
import type { AdjustmentSpec } from "../engine";
import { HarmonicWheel } from "../HarmonicWheel";
import { UseMyPhotoButton } from "../UseMyPhotoButton";
import { useRequestReveal } from "./reveal";

const SETTERS = {
  blur: "setBlur",
  grain: "setGrain",
  lightAngle: "setLightAngle",
  contrast: "setContrast",
  vibrance: "setVibrance",
} as const;

function AdjustSlider({ spec }: { spec: AdjustmentSpec }) {
  const value = useConfigStore((s) => s[spec.key]);
  const set = useConfigStore((s) => s[SETTERS[spec.key]]);
  return (
    <GlassSlider
      label={spec.label}
      value={value}
      min={spec.min}
      max={spec.max}
      step={spec.step}
      display={spec.format(value)}
      onChange={set}
    />
  );
}

/** Sliders and finer color tools that open under the dock. */
export function AdjustPanel({ id }: { id: string }) {
  const engine = useWallpaperEngine();
  const adjustments = engine.adjustmentsFor(useRenderParams());
  const requestReveal = useRequestReveal();
  const headingId = useId();

  const reset = () => {
    const patch: Record<string, number> = {};
    for (const spec of adjustments) patch[spec.key] = spec.default;
    useConfigStore.setState(patch);
  };

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mt-2 grid grid-cols-5 items-end gap-x-5 gap-y-1 border-t border-white/[0.08] px-3 pb-1.5 pt-3.5 @max-[900px]:grid-cols-2 @max-[760px]:gap-x-[18px] @max-[760px]:px-1.5"
    >
      <h3 id={headingId} className="sr-only">
        Adjust the wallpaper
      </h3>
      {adjustments.map((spec) => (
        <AdjustSlider key={spec.key} spec={spec} />
      ))}
      <div className="col-span-full flex flex-wrap items-center justify-end gap-1">
        <GlassButton variant="quiet" onClick={reset}>
          <RotateCcw className="size-[15px]" aria-hidden />
          Reset
        </GlassButton>
        <GlassButton
          variant="quiet"
          aria-keyshortcuts="R"
          onClick={(e) => {
            requestReveal(e.currentTarget);
            remixWallpaper();
          }}
        >
          <ShuffleIcon className="size-[15px]" aria-hidden />
          Remix
          <kbd className="hidden rounded-[5px] bg-white/10 px-1.5 py-1 font-sans text-[0.65rem] font-semibold leading-none [@media(hover:hover)]:inline">
            R
          </kbd>
        </GlassButton>
        <Popover>
          <PopoverTrigger asChild>
            <GlassButton variant="quiet">
              <SlidersHorizontal className="size-[15px]" aria-hidden />
              Colors
            </GlassButton>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="max-h-[min(80vh,640px)] w-[min(420px,92vw)] overflow-y-auto rounded-[14px] border-white/10 bg-[#0c0c11]/95 p-5 backdrop-blur-xl"
          >
            <HarmonicWheel />
            <div className="mt-4 flex justify-center">
              <UseMyPhotoButton />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
