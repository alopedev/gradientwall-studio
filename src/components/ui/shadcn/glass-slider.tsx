import * as SliderPrimitive from "@radix-ui/react-slider";
import { useState } from "react";
import { cn } from "./utils";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Text shown next to the label and in the drag bubble. */
  display: string;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Labelled slider for the Adjust panel: gold fill, 44 px touch row and a
 * value bubble above the thumb while it is dragged or focused by keyboard.
 * Radix handles keyboard, pointer and ARIA.
 */
export function GlassSlider({ label, value, min, max, step, display, onChange, className }: Props) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className={cn("group/slider grid min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/60">
          {label}
        </span>
        <span className="font-sans text-[0.82rem] font-medium tabular-nums text-white">
          {display}
        </span>
      </div>
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0]!)}
        onPointerDown={() => setDragging(true)}
        onValueCommit={() => setDragging(false)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative -my-1 flex h-11 w-full touch-none cursor-pointer select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-white/[0.13]">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-gold" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          aria-valuetext={display}
          data-dragging={dragging || undefined}
          className="group/thumb relative block size-[18px] rounded-full bg-[#fbfaf7] shadow-[0_2px_8px_rgba(0,0,0,0.55)] outline-none transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] before:absolute before:-inset-3 before:content-[''] data-[dragging]:scale-[1.2] data-[dragging]:shadow-[0_0_0_7px_rgba(233,185,73,0.22),0_2px_8px_rgba(0,0,0,0.55)] focus-visible:shadow-[0_0_0_4px_rgba(233,185,73,0.45),0_2px_8px_rgba(0,0,0,0.55)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 scale-[0.7] whitespace-nowrap rounded-[7px] bg-[#eceae4] px-2 py-1 font-sans text-xs font-semibold tabular-nums text-[#111] opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.4)] transition-[opacity,transform] duration-200 group-data-[dragging]/thumb:scale-100 group-data-[dragging]/thumb:opacity-100 group-focus-visible/thumb:scale-100 group-focus-visible/thumb:opacity-100"
          >
            {display}
          </span>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}
