import { useMemo, useState } from "react";
import { m } from "motion/react";
import { availableStyles, filterPacks, getPacks, type Pack, type PackStyle } from "@/lib/packs";
import { EASE } from "@/lib/motion";
import { Reveal } from "../ui/Reveal";
import { SplitWords } from "../ui/SplitWords";
import { PackCard } from "./PackCard";
import { PackFilters } from "./PackFilters";

export function PacksSection() {
  const [active, setActive] = useState<PackStyle | null>(null);
  const styles = useMemo(() => availableStyles(), []);
  const packs = useMemo(() => filterPacks(active), [active]);
  // Two packs don't need a filter bar; it comes back once the catalog has a few more.
  const showFilters = getPacks().length >= 4;

  return (
    <section
      id="packs"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(60px,9vw,120px)] border-t border-ink"
    >
      <Reveal className="grid md:grid-cols-2 gap-6 md:gap-12 items-end mb-8">
        <div>
          <h2 className="display-head text-[clamp(32px,3.6vw,52px)]">
            <SplitWords text="wallpaper packs." className="block text-ink" />
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-ink-dim font-sans font-light">
          €5.99 each, VAT included. Pay once, no subscription. Instant download, phone and desktop,
          up to 5K. Personal use.
        </p>
      </Reveal>

      {showFilters && (
        <Reveal className="mb-8">
          <PackFilters styles={styles} active={active} onChange={setActive} />
        </Reveal>
      )}

      <PackGrid packs={packs} />

      {packs.length === 0 && (
        <div className="font-sans text-[14px] text-ink-dim mt-10 text-center">
          No packs in this style yet. Check back soon.
        </div>
      )}
    </section>
  );
}

// Cascade entrance for grid cells. Children stagger 80ms apart, scale up
// from 0.96 + translateY(28px). Triggers once at 25% in-view; the whole
// section animates as one editorial reveal.
const GRID_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const GRID_CELL = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

/** Two big cards side by side while the catalog is small; three across once it grows. */
function PackGrid({ packs }: { packs: Pack[] }) {
  return (
    <m.div
      className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${packs.length > 2 ? "xl:grid-cols-3" : ""}`}
      variants={GRID_CONTAINER}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {packs.map((p) => (
        <m.div key={p.slug} variants={GRID_CELL} className="h-full">
          <PackCard pack={p} />
        </m.div>
      ))}
    </m.div>
  );
}
