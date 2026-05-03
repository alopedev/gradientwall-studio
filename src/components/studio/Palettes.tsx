import { useUIStore, applyPalette } from "@/store";
import { PALETTES } from "@/lib/palettes";

export function Palettes() {
  const activePalette = useUIStore((s) => s.activePalette);

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PALETTES.map((p, i) => {
        const active = i === activePalette;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPalette(i)}
            className={`group relative flex items-center gap-2.5 rounded-[2px] px-2 py-1.5 liquid-subtle text-left cursor-pointer transition-colors duration-150 hover:bg-white/5 ${
              active ? "!border-white" : ""
            }`}
          >
            <div
              className="grid h-5 w-12 rounded-[1px] overflow-hidden flex-shrink-0"
              style={{ gridTemplateColumns: "repeat(4,1fr)" }}
              aria-hidden="true"
            >
              {p.colors.map((c, j) => (
                <div key={j} style={{ background: c }} />
              ))}
            </div>
            <span className="font-sans text-[10.5px] tracking-[0.14em] uppercase text-white/75 truncate">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
