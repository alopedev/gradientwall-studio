import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { ImageSource } from "./ImageSource";

/**
 * Compact "Use my photo" affordance shown under Swatches in the Picker tab.
 * Wraps the ImageSource flow in a popover so image upload is an in-place
 * action on the picker, not a separate tab. Auto-closes once extraction
 * completes (the four swatches are already visible right above).
 */
export function UseMyPhotoButton() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="self-start inline-flex items-center gap-2 px-3 py-2 rounded-sharp border border-ink/12 bg-ink/[0.03] hover:bg-ink/[0.06] hover:border-ink/20 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition-colors duration-150 focus-ring"
        >
          <span aria-hidden>↑</span>
          Use my photo
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[min(320px,90vw)]">
        <ImageSource onComplete={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
