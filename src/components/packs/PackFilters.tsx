import type { PackStyle } from "@/lib/packs";

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
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase font-sans transition-colors duration-150 ${
        selected
          ? "bg-white text-[#07070a] border border-white"
          : "bg-black/30 text-white/65 border border-white/14 hover:text-white hover:border-white/30"
      }`}
    >
      {label}
    </button>
  );
}
