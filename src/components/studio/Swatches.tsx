import { useConfigStore } from "@/store";
import { MIN_ACTIVE_COLORS } from "@/lib/palettes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { ColorHUD } from "./ColorHUD";

/**
 * Four-cell color grid. Each active cell is a Popover trigger that opens the
 * ColorHUD for that slot — Hex input + HSL sliders + Eyedropper + Recents.
 * The toggle button (×/+) sits over the cell to deactivate / re-activate the
 * slot, enforcing the {@link MIN_ACTIVE_COLORS} floor (last two active slots
 * cannot be deactivated). Inactive cells are dashed-outline placeholders.
 */
export function Swatches() {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  const setColor = useConfigStore((s) => s.setColor);
  const toggleColor = useConfigStore((s) => s.toggleColor);

  const activeCount = active.filter(Boolean).length;

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {colors.map((col, i) => {
        const isActive = active[i];
        const toggleDisabled = isActive && activeCount <= MIN_ACTIVE_COLORS;
        const toggleLabel = isActive ? `Deactivate color ${i + 1}` : `Activate color ${i + 1}`;
        const cellChrome = (
          <>
            <span
              className="absolute top-1.5 left-2 font-sans text-[10px] text-white/75 pointer-events-none"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="absolute bottom-1.5 left-2 right-2 font-sans text-[10px] tracking-[0.05em] text-white/90 pointer-events-none"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {col.toUpperCase()}
            </span>
          </>
        );

        return (
          <div
            key={i}
            data-slot-index={i}
            data-active={isActive ? "true" : "false"}
            className="relative aspect-square"
          >
            {isActive ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Edit color ${i + 1}`}
                    className="relative h-full w-full overflow-hidden rounded-[2px] border border-white/14 cursor-pointer transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-white/30 focus-visible:outline-none focus-visible:border-white"
                    style={{ background: col }}
                  >
                    {cellChrome}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={10}>
                  <ColorHUD value={col} onChange={(hex) => setColor(i, hex)} />
                </PopoverContent>
              </Popover>
            ) : (
              <div
                aria-disabled="true"
                className="relative h-full w-full overflow-hidden rounded-[2px] border border-dashed border-white/20 opacity-30"
              >
                {cellChrome}
              </div>
            )}
            {/* Toggle sits OUTSIDE the popover trigger so its click doesn't
                open the HUD — it only flips the active mask. */}
            <button
              type="button"
              aria-label={toggleLabel}
              title={toggleDisabled ? `Minimum ${MIN_ACTIVE_COLORS} colors required` : toggleLabel}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleColor(i);
              }}
              disabled={toggleDisabled}
              className={`absolute top-1 right-1 z-10 h-5 w-5 inline-flex items-center justify-center rounded-full backdrop-blur-sm font-sans text-[12px] leading-none transition-colors duration-150 ${
                isActive
                  ? "bg-black/55 text-white/90 hover:bg-black/75 disabled:opacity-40 disabled:cursor-not-allowed"
                  : "bg-white/90 text-[#07070a] hover:bg-white"
              }`}
            >
              {isActive ? "×" : "+"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
