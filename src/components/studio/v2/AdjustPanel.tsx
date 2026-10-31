import { RotateCcw, Shuffle as ShuffleIcon } from "lucide-react";
import { useId } from "react";
import { InkButton } from "@/components/ui/InkButton";
import { GlassSlider } from "@/components/ui/shadcn/glass-slider";
import { remixWallpaper, useConfigStore, useRenderParams } from "@/store";
import { useWallpaperEngine } from "../engine";
import type { AdjustmentSpec } from "../engine";
import { useRequestReveal } from "./reveal";

const SETTERS = {
  blur: "setBlur",
  grain: "setGrain",
  lightAngle: "setLightAngle",
  contrast: "setContrast",
  vibrance: "setVibrance",
  rotation: "setRotation",
  tone: "setTone",
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
      ramp={spec.ramp}
    />
  );
}

/**
 * The engine's sliders, two to a row so the panel doesn't grow (Àlex, 2026-10-31,
 * mockup B), then the ramp sliders (the tone) on full-width rows, Reset and Remix.
 */
export function AdjustPanel({ id }: { id?: string }) {
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
    <section id={id} aria-labelledby={headingId} className="grid gap-y-1">
      <h3 id={headingId} className="sr-only">
        Adjust the wallpaper
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {adjustments
          .filter((spec) => !spec.ramp)
          .map((spec) => (
            <AdjustSlider key={spec.key} spec={spec} />
          ))}
      </div>
      {adjustments
        .filter((spec) => spec.ramp)
        .map((spec) => (
          <AdjustSlider key={spec.key} spec={spec} />
        ))}
      <div className="-mx-2 flex flex-wrap items-center justify-end gap-1">
        <InkButton variant="quiet" onClick={reset}>
          <RotateCcw className="size-[15px]" aria-hidden />
          Reset
        </InkButton>
        <InkButton
          variant="quiet"
          aria-keyshortcuts="R"
          onClick={(e) => {
            requestReveal(e.currentTarget);
            remixWallpaper();
          }}
        >
          <ShuffleIcon className="size-[15px]" aria-hidden />
          Remix
          <kbd className="hidden rounded-[5px] bg-ink/10 px-1.5 py-1 font-sans text-[0.65rem] font-semibold leading-none [@media(hover:hover)]:inline">
            R
          </kbd>
        </InkButton>
      </div>
    </section>
  );
}
