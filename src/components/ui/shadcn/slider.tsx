import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

/**
 * Slider primitive — Radix under the hood, reskinned to GW identity.
 * Track 2px (matches our previous `gw-slider` look), 14px white thumb with
 * dark inner border, accent focus ring. Supports single value or range.
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[2px] w-full grow overflow-hidden bg-white/14">
      <SliderPrimitive.Range className="absolute h-full bg-white" />
    </SliderPrimitive.Track>
    {React.Children.map(props.children, () => null)}
    <SliderPrimitive.Thumb
      className={cn(
        "block h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_1px_white] outline-none",
        "border-2 border-[color:var(--color-bg)]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--color-bg)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-transform hover:scale-110",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
