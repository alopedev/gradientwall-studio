import { useEffect, useState } from "react";
import { useConfigStore } from "@/store";
import { seedToHex } from "@/lib/gradient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";

const HEX4_RE = /^#?[0-9a-fA-F]{1,4}$/;

/**
 * Editable seed badge. The seed is the deterministic key the renderer feeds
 * into mulberry32 — every gradient is reproducible from `(seed, style, colors)`.
 * Surfacing it as a clickable hex chip lets the user explore the 65,536-entry
 * space directly: paste a seed in the popover, the canvas redraws with the
 * exact same composition.
 */
export function SeedBadge() {
  const seed = useConfigStore((s) => s.seed);
  const setSeed = useConfigStore((s) => s.setSeed);
  const hex = seedToHex(seed); // "#A3F1"
  const [draft, setDraft] = useState(hex.replace("#", ""));
  const [open, setOpen] = useState(false);

  // Keep draft synced if seed changes externally (reshuffle / undo / palette apply).
  useEffect(() => {
    setDraft(hex.replace("#", ""));
  }, [hex]);

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{1,4}$/.test(trimmed)) return;
    const next = parseInt(trimmed.padStart(4, "0"), 16) & 0xffff;
    if (next !== seed) setSeed(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Edit seed ${hex}`}
          title="Click to edit the gradient seed"
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/14 bg-black/35 px-2.5 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/75 backdrop-blur-md transition-colors duration-150 hover:border-white/30 hover:text-white"
        >
          <span className="text-white/40">seed</span>
          <span>{hex}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10}>
        <div className="flex flex-col gap-3 w-[220px]">
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">Seed (hex)</span>
          <input
            type="text"
            value={draft}
            maxLength={4}
            onChange={(e) => {
              const v = e.target.value.replace(/^#/, "").toUpperCase();
              if (v === "" || HEX4_RE.test("#" + v)) setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit(draft);
                setOpen(false);
              } else if (e.key === "Escape") {
                setDraft(hex.replace("#", ""));
                setOpen(false);
              }
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoFocus
            placeholder="A3F1"
            className="rounded-[2px] border border-white/14 bg-[#070709] px-2.5 py-2 font-sans text-[14px] tracking-[0.18em] uppercase text-white outline-none transition-colors duration-150 hover:border-white/25 focus:border-white/50"
          />
          <p className="font-sans text-[11px] text-white/40 leading-relaxed">
            Each seed produces a unique composition for the same colors. 0000–FFFF.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
