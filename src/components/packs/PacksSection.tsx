import { useMemo, useState } from "react";
import { availableStyles, featuredPack, filterPacks, type PackStyle } from "@/lib/packs";
import { Reveal } from "../ui/Reveal";
import { PackCard } from "./PackCard";
import { PackFilters } from "./PackFilters";

export function PacksSection() {
  const [active, setActive] = useState<PackStyle | null>(null);
  const styles = useMemo(() => availableStyles(), []);
  const packs = useMemo(() => filterPacks(active), [active]);
  const hero = useMemo(() => featuredPack(), []);
  const isFiltered = active !== null;

  // Bento layout only when (a) no filter is active AND (b) we have a hero
  // pack flagged. The moment the user scopes by style the layout collapses
  // back to a uniform grid — keeping the asymmetric flagship slot only for
  // the editorial "all packs" view.
  const useBento = !isFiltered && hero !== undefined;
  const satellites = useBento ? packs.filter((p) => p.slug !== hero!.slug) : packs;

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

      {useBento ? (
        <BentoGrid hero={hero!} satellites={satellites} />
      ) : (
        <UniformGrid packs={packs} />
      )}

      {packs.length === 0 && (
        <div className="font-sans text-[14px] text-white/50 mt-10 text-center">
          No packs in this style yet. Check back soon.
        </div>
      )}
    </section>
  );
}

function BentoGrid({ hero, satellites }: { hero: Parameters<typeof PackCard>[0]["pack"]; satellites: Parameters<typeof PackCard>[0]["pack"][] }) {
  // 4-column grid on desktop. Hero spans 2×2, four satellites fill the
  // remaining 4 cells (two on the right of the hero, two below). Mobile
  // stacks single-column with the hero first.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:auto-rows-[clamp(220px,22vw,300px)]">
      <div className="md:col-span-2 lg:row-span-2 lg:col-span-2 h-full min-h-[420px] lg:min-h-0">
        <PackCard pack={hero} variant="hero" />
      </div>
      {satellites.slice(0, 4).map((p) => (
        <div key={p.slug} className="h-full min-h-[260px] lg:min-h-0">
          <PackCard pack={p} variant="small" />
        </div>
      ))}
    </div>
  );
}

function UniformGrid({ packs }: { packs: Parameters<typeof PackCard>[0]["pack"][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[clamp(280px,30vw,400px)]">
      {packs.map((p) => (
        <div key={p.slug} className="h-full">
          <PackCard pack={p} variant="small" />
        </div>
      ))}
    </div>
  );
}
