import type { Pack } from "@/lib/packs";
import { packSpecs } from "@/lib/packs/showcase";

/**
 * Exact files, sizes, format and licence: the numbers a buyer checks before
 * paying. `compact` is the same list as plain rows, for the column beside the
 * buy button on desktop (3C, chosen 2026-11-09).
 */
export function PackSpecs({ pack, compact = false }: { pack: Pack; compact?: boolean }) {
  const specs = packSpecs(pack);
  if (compact) {
    return (
      <ul
        aria-label="What you get"
        className="m-0 list-none border-b border-ink p-0 font-sans text-[14px]"
      >
        {specs.map((s) => (
          <li key={s.label} className="flex justify-between gap-4 border-t border-ink py-2.5">
            <span className="text-ink-dim">{s.label}</span>
            <span className="text-right text-ink">
              {s.value}
              {s.detail && <span className="text-ink-dim"> · {s.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul
      aria-label="Specifications"
      className="m-0 grid list-none grid-cols-2 gap-px overflow-hidden rounded-sharp border-2 border-ink bg-ink p-0"
    >
      {specs.map((s) => (
        <li key={s.label} className="grid content-start gap-1 bg-bg px-4 py-3.5">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-ink-dim">
            {s.label}
          </span>
          <span className="font-sans text-[15px] font-medium text-ink">{s.value}</span>
          {s.detail && <span className="font-sans text-[12px] text-ink-dim">{s.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
