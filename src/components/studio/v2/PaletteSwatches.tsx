import { m } from "motion/react";
import { curatedPaletteIndex } from "@/lib/palette-name";
import { PALETTES } from "@/lib/palettes";
import { applyPalette, useConfigStore } from "@/store";
import { useRequestReveal } from "./reveal";

/** The curated palettes as dots; a ring springs to the one in use. The dots
 * share the row (up to 32px each) so a narrow phone never clips the last ones. */
export function PaletteSwatches() {
  const colors = useConfigStore((s) => s.colors);
  const current = curatedPaletteIndex(colors);
  const requestReveal = useRequestReveal();

  return (
    <fieldset
      aria-label="Palette"
      className="relative m-0 flex min-w-0 flex-nowrap items-center border-0 p-0"
    >
      {PALETTES.map((p, i) => (
        <button
          key={p.name}
          type="button"
          aria-pressed={i === current}
          aria-label={`Palette ${p.name}`}
          data-tip={p.name}
          onClick={(e) => {
            requestReveal(e.currentTarget);
            applyPalette(i);
          }}
          className="gws-tip group/sw relative grid h-11 min-w-0 max-w-8 flex-1 place-items-center outline-none"
        >
          {i === current && (
            <m.span
              layoutId="palette-ring"
              aria-hidden
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="absolute size-[30px] rounded-full shadow-[0_0_0_2px_var(--color-bg)]"
            />
          )}
          <span
            aria-hidden
            style={{
              background: `radial-gradient(circle at 32% 26%, rgba(18,18,18,0.35), transparent 55%), linear-gradient(140deg, ${p.colors[0]}, ${p.colors[1]} 35%, ${p.colors[2]} 68%, ${p.colors[3]})`,
              ["--sw" as string]: p.colors[2],
            }}
            className="size-[22px] rounded-full shadow-[inset_0_0_0_1px_rgba(18,18,18,0.18),0_2px_6px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active/sw:scale-90 group-focus-visible/sw:outline group-focus-visible/sw:outline-2 group-focus-visible/sw:outline-offset-4 group-focus-visible/sw:outline-accent [@media(hover:hover)]:group-hover/sw:-translate-y-[3px] [@media(hover:hover)]:group-hover/sw:scale-[1.14] [@media(hover:hover)]:group-hover/sw:shadow-[inset_0_0_0_1px_rgba(18,18,18,0.25),0_8px_16px_-4px_var(--sw)]"
          />
        </button>
      ))}
    </fieldset>
  );
}
