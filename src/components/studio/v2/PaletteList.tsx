import { curatedPaletteIndex } from "@/lib/palette-name";
import { PALETTES } from "@/lib/palettes";
import { applyPalette, useConfigStore } from "@/store";
import { useRequestReveal } from "./reveal";

/** The ten curated palettes by name, two per row, each with its four colors as a strip. */
export function PaletteList() {
  const colors = useConfigStore((s) => s.colors);
  const current = curatedPaletteIndex(colors);
  const requestReveal = useRequestReveal();

  return (
    <fieldset aria-label="Palette" className="m-0 grid min-w-0 grid-cols-2 gap-1.5 border-0 p-0">
      {PALETTES.map((p, i) => (
        <button
          key={p.name}
          type="button"
          aria-pressed={i === current}
          aria-label={`Palette ${p.name}`}
          onClick={(e) => {
            requestReveal(e.currentTarget);
            applyPalette(i);
          }}
          className="flex min-h-9 min-w-0 items-center gap-2 rounded-[10px] bg-ink/[0.04] p-1.5 text-left font-sans text-[0.8rem] text-ink/85 outline-none transition-colors duration-200 hover:bg-ink/[0.08] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-pressed:bg-ink/[0.1] aria-pressed:text-ink aria-pressed:shadow-[inset_0_0_0_1px_rgba(18,18,18,0.5)]"
        >
          <span
            aria-hidden
            className="flex h-[18px] w-[34px] flex-none overflow-hidden rounded-[5px] shadow-[inset_0_0_0_1px_rgba(18,18,18,0.12)]"
          >
            {p.colors.map((c) => (
              <i key={c} className="flex-1" style={{ background: c }} />
            ))}
          </span>
          <span className="truncate">{p.name}</span>
        </button>
      ))}
    </fieldset>
  );
}
