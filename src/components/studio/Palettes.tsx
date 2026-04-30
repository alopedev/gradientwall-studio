import { useUIStore, applyPalette } from "@/store";
import { PALETTES } from "@/lib/palettes";

export function Palettes() {
  const activePalette = useUIStore((s) => s.activePalette);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PALETTES.map((p, i) => {
        const active = i === activePalette;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPalette(i)}
            className={`relative rounded-[2px] p-2.5 liquid-subtle text-left cursor-pointer transition-colors duration-150 hover:bg-white/5 ${
              active ? "!border-white" : ""
            }`}
          >
            <div
              className="grid grid-cols-4 h-11 rounded overflow-hidden mb-2"
              style={{ gridTemplateColumns: "repeat(4,1fr)" }}
            >
              {p.colors.map((c, j) => (
                <div key={j} style={{ background: c }} />
              ))}
            </div>
            <div className="flex justify-between items-center font-sans text-[11px] tracking-[0.12em] uppercase text-white/75">
              <span>{p.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
