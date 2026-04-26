import { useMemo, useState } from "react";
import { availableStyles, filterPacks, type PackStyle } from "@/lib/packs";
import { Reveal } from "../ui/Reveal";
import { PackCard } from "./PackCard";
import { PackFilters } from "./PackFilters";

export function PacksSection() {
  const [active, setActive] = useState<PackStyle | null>(null);
  const styles = useMemo(() => availableStyles(), []);
  const packs = useMemo(() => filterPacks(active), [active]);

  return (
    <section
      id="packs"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)] border-t border-white/8"
    >
      <Reveal className="grid md:grid-cols-2 gap-12 items-end mb-10">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            03 — Curated packs
          </span>
          <h2 className="display-head text-[clamp(40px,5.5vw,76px)]">
            <span className="block text-white">Ten wallpapers,</span>
            <span className="block text-white/75 font-serif italic">one quiet mood.</span>
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          Curated drops of ten wallpapers each, in maximum resolution. Personal use, no
          watermarks, no account. Pay once, download forever.
        </p>
      </Reveal>

      <Reveal className="mb-8">
        <PackFilters styles={styles} active={active} onChange={setActive} />
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {packs.map((p) => (
          <PackCard key={p.slug} pack={p} />
        ))}
      </div>

      {packs.length === 0 && (
        <div className="font-sans text-[14px] text-white/50 mt-10 text-center">
          No packs in this style yet. Check back soon.
        </div>
      )}
    </section>
  );
}
