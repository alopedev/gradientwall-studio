import type { Pack } from "@/lib/packs";
import { packSpecs } from "@/lib/packs/showcase";

/** Exact files, sizes, format and licence: the numbers a buyer checks before paying. */
export function PackSpecs({ pack }: { pack: Pack }) {
  const specs = packSpecs(pack);
  return (
    <ul
      aria-label="Specifications"
      className="m-0 grid list-none grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-0"
    >
      {specs.map((s) => (
        <li key={s.label} className="grid content-start gap-1 bg-[#0a0a0d] px-4 py-3.5">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
            {s.label}
          </span>
          <span className="font-sans text-[15px] font-medium text-white">{s.value}</span>
          {s.detail && <span className="font-sans text-[12px] text-white/55">{s.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
