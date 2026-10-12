import { m } from "motion/react";
import type { PackStyle } from "@/lib/packs";
import { EASE } from "@/lib/motion";

interface Props {
  styles: PackStyle[];
  active: PackStyle | null;
  onChange: (s: PackStyle | null) => void;
}

/**
 * Pill bar above the pack grid. "All" is the null slot. Single-select.
 *
 * Categorisation by technical style was the user's call (PRD); the filter
 * surfaces only styles actually present in the catalog so empty pills never
 * appear.
 */
export function PackFilters({ styles, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="tablist">
      <FilterPill label="All" selected={active === null} onClick={() => onChange(null)} />
      {styles.map((s) => (
        <FilterPill key={s} label={s} selected={active === s} onClick={() => onChange(s)} />
      ))}
    </div>
  );
}

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center rounded-sharp px-4 text-[11px] tracking-[0.14em] uppercase font-sans font-medium transition-colors duration-200 border-2 ${
        selected
          ? "text-bg border-ink"
          : "text-ink-dim border-ink/30 hover:text-ink hover:border-ink"
      }`}
    >
      {selected && (
        <m.span
          layoutId="active-filter-pill"
          aria-hidden
          className="absolute inset-0 -z-10 bg-ink"
          transition={{ duration: 0.45, ease: EASE }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}
