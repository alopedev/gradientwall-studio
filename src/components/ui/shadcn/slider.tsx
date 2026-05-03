import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

/**
 * Slider primitive — Radix under the hood, restyled as a tactile control.
 * Track is recessed into the panel (inset shadow stack); range has a top
 * highlight; thumb reads as a physical keyboard key (outer drop + inset
 * highlight + hairline ring) so the most-manipulated control in the
 * Studio actually has presence.
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // py-3 gives a 24px hit row (was 12px) so the user can grab the slider
      // without pixel-hunting the thumb. Track stays at h-1.5 so the visual
      // doesn't change.
      "relative flex w-full touch-none select-none items-center py-3 cursor-pointer",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="tactile-recessed relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full rounded-full",
          "bg-gradient-to-b from-white/95 to-white/70",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.15)]",
        )}
      />
    </SliderPrimitive.Track>
    {React.Children.map(props.children, () => null)}
    <SliderPrimitive.Thumb
      // Visible thumb at 18px + an invisible 32px hit-circle via ::before so
      // the grab target is comfortably bigger than the visual without making
      // the knob look chunky.
      className={cn(
        "tactile-knob relative block h-[18px] w-[18px] rounded-full outline-none",
        "cursor-grab active:cursor-grabbing",
        "before:absolute before:inset-[-7px] before:content-['']",
        "transition-transform duration-150 ease-out hover:scale-[1.08] active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-surface-1)]",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
