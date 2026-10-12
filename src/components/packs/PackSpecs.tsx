import type { Pack } from "@/lib/packs";
import { packSpecs } from "@/lib/packs/showcase";

/** Exact files, sizes, format and licence: the numbers a buyer checks before paying. */
export function PackSpecs({ pack }: { pack: Pack }) {
  const specs = packSpecs(pack);
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
