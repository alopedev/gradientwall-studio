import type { Slot } from "@/lib/colorEditing/wheel-geometry";
import type { ActiveMask, Colors4 } from "@/lib/palettes";
import { MIN_ACTIVE_COLORS } from "@/lib/palettes";

interface ColorDotsProps {
  colors: Colors4;
  active: ActiveMask;
  focalSlot: number;
  activeCount: number;
  onSelectFocal: (slot: Slot) => void;
  onToggleActive: (slot: Slot) => void;
}

export function ColorDots({
  colors,
  active,
  focalSlot,
  activeCount,
  onSelectFocal,
  onToggleActive,
}: ColorDotsProps) {
  return (
    <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Pick focal color slot">
      {colors.map((c, i) => {
        const slot = i as Slot;
        const isFocal = slot === focalSlot;
        const isActive = active[slot];
        const toggleDisabled = isActive && activeCount <= MIN_ACTIVE_COLORS;
        return (
          <div key={slot} className="flex flex-col items-center gap-1">
            {/* biome-ignore lint/a11y/useSemanticElements: custom-styled color swatch — native radio cannot render the swatch fill */}
            <button
              type="button"
              role="radio"
              aria-checked={isFocal}
              aria-label={`Slot ${slot + 1} focal`}
              onClick={() => onSelectFocal(slot)}
              className={`focus-ring size-[22px] rounded-full transition-transform duration-150 hover:scale-110 active:scale-90 ${
                isActive ? "" : "opacity-40"
              }`}
              style={{
                background: c,
                boxShadow: isFocal
                  ? `inset 0 0 0 2px rgba(15,15,18,0.92), 0 0 0 2px rgba(255,255,255,0.85)`
                  : `inset 0 0 0 1px rgba(255,255,255,0.18)`,
              }}
            />
            <button
              type="button"
              onClick={() => onToggleActive(slot)}
              disabled={toggleDisabled}
              aria-label={isActive ? `Disable slot ${slot + 1}` : `Enable slot ${slot + 1}`}
              title={toggleDisabled ? `Minimum ${MIN_ACTIVE_COLORS} colors required` : undefined}
              className="font-sans text-[9px] tracking-[0.12em] uppercase text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isActive ? "on" : "off"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
