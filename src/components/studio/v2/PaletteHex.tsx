import { m } from "motion/react";
import { useConfigStore } from "@/store";

interface Props {
  /** Short messages shown in the dock toast. */
  onMessage: (message: string) => void;
}

/**
 * The colors of the wallpaper with their hex codes, so a designer can lift them
 * straight into a project. Click a code to copy it. Shows only the colors the
 * wallpaper uses (2 to 4), not the ones switched off in the color wheel.
 */
export function PaletteHex({ onMessage }: Props) {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  // Slot number as key: two slots can hold the same hex.
  const used = colors.flatMap((c, slot) => (active[slot] ? [{ slot, hex: c.toUpperCase() }] : []));

  const copy = async (hex: string) => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(hex);
      onMessage(`Copied ${hex}`);
    } catch {
      onMessage(`Couldn't copy. The code is ${hex}.`);
    }
  };

  return (
    <ul
      aria-label="Palette colors"
      className="m-0 mt-1.5 flex list-none flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-t border-white/[0.08] p-0 pt-1.5 @max-[760px]:grid @max-[760px]:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
    >
      {used.map(({ slot, hex }) => (
        <li key={slot} className="min-w-0">
          <button
            type="button"
            aria-label={`Copy ${hex}`}
            onClick={() => copy(hex)}
            className="group/hex flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[10px] px-2.5 font-sans text-[0.72rem] font-medium tabular-nums tracking-[0.06em] text-white/70 outline-none transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold @max-[760px]:px-1 @max-[760px]:text-[0.66rem] @max-[760px]:tracking-[0.03em]"
          >
            <m.span
              aria-hidden
              key={hex}
              initial={{ scale: 0.6, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              style={{ background: hex }}
              className="size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
            />
            {hex}
          </button>
        </li>
      ))}
    </ul>
  );
}
