import { useConfigStore } from "@/store";
import { MIN_ACTIVE_COLORS } from "@/lib/palettes";

/**
 * Four-cell color grid. Each swatch exposes the native `<input type="color">`
 * picker via the square, plus a small toggle button in the top-right corner
 * to deactivate the slot — the rendered gradient then uses only the active
 * subset (2-4 colors). The `MIN_ACTIVE_COLORS` floor is enforced both in the
 * store (silent no-op on over-deactivation) and here (the toggle disables on
 * the last two active slots so users get clear visual feedback).
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
        // Block deactivation when only the minimum count remains.
        const toggleDisabled = isActive && activeCount <= MIN_ACTIVE_COLORS;
        const toggleLabel = isActive ? `Deactivate color ${i + 1}` : `Activate color ${i + 1}`;
        return (
          <label
            key={i}
            data-slot-index={i}
            data-active={isActive ? "true" : "false"}
            className={`relative aspect-square rounded-[2px] overflow-hidden transition-[transform,border-color,opacity] duration-150 hover:-translate-y-0.5 ${
              isActive
                ? "border border-white/14 cursor-pointer hover:border-white/30"
                : "border border-dashed border-white/20 opacity-30 cursor-not-allowed"
            }`}
            style={{ background: isActive ? col : "transparent" }}
          >
            <input
              type="color"
              value={col}
              disabled={!isActive}
              onChange={(e) => setColor(i, e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <span
              className="absolute top-1.5 left-2 font-sans text-[10px] text-white/75 pointer-events-none"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* Toggle lives ABOVE the color input so its click isn't swallowed. */}
            <button
              type="button"
              aria-label={toggleLabel}
              title={toggleDisabled ? `Minimum ${MIN_ACTIVE_COLORS} colors required` : toggleLabel}
              onClick={(e) => {
                // Prevent the surrounding <label> from re-focusing the color input
                // (which would immediately reopen the picker after a toggle).
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
            <span
              className="absolute bottom-1.5 left-2 right-2 font-sans text-[10px] tracking-[0.05em] text-white/90 pointer-events-none"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {col.toUpperCase()}
            </span>
          </label>
        );
      })}
    </div>
  );
}
