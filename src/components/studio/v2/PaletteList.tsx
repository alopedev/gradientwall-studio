import { useId, useState } from "react";
import { curatedPaletteIndex } from "@/lib/palette-name";
import { PALETTES } from "@/lib/palettes";
import { applyPalette, useConfigStore } from "@/store";
import { useRequestReveal } from "./reveal";

/** Palettes in view before "All" opens the rest: one row, so the panel fits without a scroll bar. */
export const PALETTES_SHOWN = 4;

/**
 * The curated palettes as square tiles of their four colours, four in a row.
 * "All" opens the rest below; the palette in use stays in view either way.
 */
export function PaletteList() {
  const colors = useConfigStore((s) => s.colors);
  const current = curatedPaletteIndex(colors);
  const requestReveal = useRequestReveal();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const restId = useId();
  // Closed, the last tile is the palette in use when it is one of the hidden ones.
  const last = current >= PALETTES_SHOWN - 1 ? current : PALETTES_SHOWN - 1;
  const shown = PALETTES.map((p, i) => ({ p, i })).filter(
    ({ i }) => open || i < PALETTES_SHOWN - 1 || i === last,
  );

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between">
        <h3
          id={titleId}
          className="m-0 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-dim"
        >
          Palette
        </h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={restId}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-7 cursor-pointer items-center gap-1 rounded-[4px] px-1 font-sans text-[0.72rem] font-medium text-ink-dim outline-none transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {open ? "Less" : `All ${PALETTES.length}`}
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative; the button carries the label */}
          <svg
            viewBox="0 0 12 12"
            width="10"
            height="10"
            aria-hidden
            className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      <fieldset
        id={restId}
        aria-labelledby={titleId}
        className="m-0 grid min-w-0 grid-cols-4 gap-x-2 gap-y-2.5 border-0 p-0"
      >
        {shown.map(({ p, i }) => (
          <button
            key={p.name}
            type="button"
            aria-pressed={i === current}
            aria-label={`Palette ${p.name}`}
            onClick={(e) => {
              requestReveal(e.currentTarget);
              applyPalette(i);
            }}
            className="group grid min-w-0 cursor-pointer gap-1 text-center font-sans text-[0.72rem] text-ink-dim outline-none aria-pressed:text-ink"
          >
            <span
              aria-hidden
              className="grid aspect-square grid-cols-2 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_rgba(18,18,18,0.12)] transition-transform duration-200 group-hover:scale-[1.04] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent group-aria-pressed:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-ink)] motion-reduce:transition-none"
            >
              {p.colors.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </fieldset>
    </div>
  );
}
