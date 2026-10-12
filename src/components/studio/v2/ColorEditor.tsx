import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { paletteName } from "@/lib/palette-name";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";

interface Props {
  /** Short messages shown in the Studio toast. */
  onMessage: (message: string) => void;
}

const key = (colors: readonly string[]) => colors.join(",").toLowerCase();

/**
 * The four colors of the wallpaper, each one a color picker, with its hex code
 * underneath (click to copy). A run of edits leaves one step in the ‹ history
 * and a "Back to <palette>" button, both forgotten once something else
 * (a palette, Shuffle, a saved wallpaper) replaces the colors.
 */
export function ColorEditor({ onMessage }: Props) {
  const colors = useConfigStore((s) => s.colors);
  const setColor = useConfigStore((s) => s.setColor);
  // The colors before this run of edits, and the colors the last edit produced.
  const [base, setBase] = useState<Colors4 | null>(null);
  const lastEdit = useRef<string | null>(null);

  useEffect(() => {
    if (lastEdit.current !== null && lastEdit.current !== key(colors)) {
      lastEdit.current = null;
      setBase(null);
    }
  }, [colors]);

  const edit = (slot: number, hex: string) => {
    const current = useConfigStore.getState().colors;
    if (lastEdit.current !== key(current)) {
      useLookHistoryStore.getState().record();
      setBase([...current] as Colors4);
    }
    setColor(slot, hex);
    lastEdit.current = key(useConfigStore.getState().colors);
  };

  const restore = () => {
    if (!base) return;
    lastEdit.current = null;
    setBase(null);
    useConfigStore.setState({ colors: [...base] as Colors4 });
  };

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
    <div className="grid gap-2.5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-dim">
          {base ? "Your colors" : "Colors · tap to change"}
        </span>
        {base && (
          <button
            type="button"
            onClick={restore}
            className="whitespace-nowrap rounded-full bg-ink/[0.08] px-2.5 py-1 font-sans text-[0.72rem] text-ink/85 shadow-[inset_0_0_0_1px_rgba(18,18,18,0.14)] outline-none transition-colors hover:bg-ink/[0.14] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            Back to {paletteName(base)}
          </button>
        )}
      </div>
      <ul aria-label="Palette colors" className="m-0 grid list-none grid-cols-4 gap-1.5 p-0">
        {colors.map((c, slot) => {
          const hex = c.toUpperCase();
          return (
            // Slot number as key: two slots can hold the same hex.
            // biome-ignore lint/suspicious/noArrayIndexKey: the four slots are fixed positions
            <li key={slot} className="grid min-w-0 gap-1">
              <label
                style={{ background: c }}
                className="relative block h-[34px] cursor-pointer rounded-[9px] shadow-[inset_0_0_0_1px_rgba(18,18,18,0.18)] transition-transform duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent [@media(hover:hover)]:hover:-translate-y-0.5"
              >
                <input
                  type="color"
                  aria-label={`Color ${slot + 1}`}
                  value={c.toLowerCase()}
                  onChange={(e) => edit(slot, e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <Pencil
                  aria-hidden
                  className="pointer-events-none absolute bottom-1.5 right-1.5 size-3 text-ink drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                />
              </label>
              <button
                type="button"
                aria-label={`Copy ${hex}`}
                onClick={() => copy(hex)}
                className="truncate rounded px-0.5 text-left font-sans text-[0.64rem] font-medium tabular-nums tracking-[0.04em] text-ink-dim outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                {hex}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
